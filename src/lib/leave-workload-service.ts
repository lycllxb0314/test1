/**
 * 请假审批与工作量联动服务
 * 
 * 当请假审批通过后：
 * 1. 更新教师工作量
 * 2. 触发代课任务创建（如果需要）
 * 3. 更新课表状态
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { BaseScheduleSlot } from '@/types';

/**
 * 请假审批通过后的联动处理
 */
export async function onLeaveApproved(
  leaveRequestId: string,
  options?: {
    generateSubstitute?: boolean;
  }
): Promise<{
  success: boolean;
  affectedSlots?: BaseScheduleSlot[];
  substituteTasks?: Array<{
    id: string;
    classId: string;
    className: string;
    subject: string;
    date: string;
    periodIndex: number;
  }>;
  error?: string;
}> {
  const client = getSupabaseClient();
  
  try {
    // 1. 获取请假详情
    const { data: leaveRequest, error: leaveError } = await client
      .from('leave_requests')
      .select('*')
      .eq('id', leaveRequestId)
      .single();
    
    if (leaveError || !leaveRequest) {
      return { success: false, error: '请假记录不存在' };
    }
    
    const { applicant_id, start_time, end_time, type } = leaveRequest;
    
    // 2. 计算请假影响的课次
    const affectedSlots = await getAffectedSlots(
      applicant_id,
      start_time,
      end_time
    );
    
    // 3. 更新课表状态为"请假"
    await updateSlotsStatus(
      affectedSlots.map(s => s.id),
      'leave'
    );
    
    // 4. 如果需要生成代课任务
    let substituteTasks;
    if (options?.generateSubstitute !== false && affectedSlots.length > 0) {
      substituteTasks = await createSubstituteTasks(
        leaveRequestId,
        affectedSlots
      );
    }
    
    // 5. 更新请假记录的duration字段
    await client
      .from('leave_requests')
      .update({ duration: affectedSlots.length })
      .eq('id', leaveRequestId);
    
    return {
      success: true,
      affectedSlots,
      substituteTasks,
    };
  } catch (error) {
    console.error('请假联动处理失败:', error);
    return {
      success: false,
      error: '处理失败',
    };
  }
}

/**
 * 获取请假影响的课次
 */
async function getAffectedSlots(
  teacherId: string,
  startTime: string,
  endTime: string
): Promise<BaseScheduleSlot[]> {
  const client = getSupabaseClient();
  
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  
  // 获取当前学期
  const { data: settings } = await client
    .from('system_settings')
    .select('value')
    .eq('key', 'current_semester')
    .single();
  
  const semester = settings?.value || '2025-2026-2';
  
  // 获取教师的基准课表
  const { data: slots } = await client
    .from('schedule_slots')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('semester', semester)
    .eq('status', 'normal');
  
  if (!slots || slots.length === 0) {
    return [];
  }
  
  // 计算请假期间每周的星期几
  const affectedSlots: BaseScheduleSlot[] = [];
  
  // 简化处理：按天遍历
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay(); // 0=周日, 1=周一
    
    if (dayOfWeek > 0 && dayOfWeek < 7) { // 排除周末
      // 找到该天对应的课次
      const daySlots = slots.filter(s => s.dayOfWeek === dayOfWeek);
      for (const slot of daySlots) {
        affectedSlots.push({
          id: slot.id,
          semester: slot.semester,
          weekNumber: getWeekNumber(currentDate),
          dayOfWeek: slot.dayOfWeek,
          periodIndex: slot.periodIndex,
          classId: slot.classId,
          className: slot.className,
          grade: slot.grade,
          teacherId: slot.teacherId,
          teacherName: slot.teacherName,
          subject: slot.subject,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: 'leave',
          createdAt: slot.createdAt,
          updatedAt: slot.updatedAt,
        });
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return affectedSlots;
}

/**
 * 获取日期对应的周次
 */
function getWeekNumber(date: Date): number {
  // 简化：假设学期从9月1日开始
  const semesterStart = new Date(date.getFullYear(), 8, 1); // 9月1日
  const diff = date.getTime() - semesterStart.getTime();
  const week = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, week);
}

/**
 * 更新课次状态
 */
async function updateSlotsStatus(
  slotIds: string[],
  status: 'leave' | 'substitute' | 'normal'
): Promise<void> {
  const client = getSupabaseClient();
  
  await client
    .from('schedule_slots')
    .update({ status, updated_at: new Date().toISOString() })
    .in('id', slotIds);
}

/**
 * 创建代课任务
 */
async function createSubstituteTasks(
  leaveRequestId: string,
  slots: BaseScheduleSlot[]
): Promise<Array<{
  id: string;
  classId: string;
  className: string;
  subject: string;
  date: string;
  periodIndex: number;
}>> {
  const client = getSupabaseClient();
  
  const tasks = [];
  
  for (const slot of slots) {
    // 创建代课任务记录
    const { data, error } = await client
      .from('substitute_tasks')
      .insert({
        leave_request_id: leaveRequestId,
        class_id: slot.classId,
        class_name: slot.className,
        grade: slot.grade,
        subject: slot.subject,
        original_teacher_id: slot.teacherId,
        original_teacher_name: slot.teacherName,
        date: getDateFromWeekDay(slot.weekNumber || 1, slot.dayOfWeek),
        period_index: slot.periodIndex,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (!error && data) {
      tasks.push({
        id: data.id,
        classId: slot.classId,
        className: slot.className,
        subject: slot.subject,
        date: data.date,
        periodIndex: slot.periodIndex,
      });
    }
  }
  
  return tasks;
}

/**
 * 根据周次和星期获取日期
 */
function getDateFromWeekDay(weekNumber: number, dayOfWeek: number): string {
  // 简化：假设学期从9月1日开始（周日）
  const semesterStart = new Date(2024, 8, 1);
  const date = new Date(semesterStart);
  date.setDate(date.getDate() + (weekNumber - 1) * 7 + dayOfWeek);
  
  return date.toISOString().split('T')[0];
}

/**
 * 请假审批通过后更新工作量
 * 
 * 注意：工作量计算是实时的，不需要额外存储
 * 这里只是为了触发通知和日志
 */
export async function updateWorkloadOnLeaveApproved(
  teacherId: string,
  semester: string,
  duration: number
): Promise<void> {
  const client = getSupabaseClient();
  
  // 记录工作量变更日志
  await client.from('workload_logs').insert({
    teacher_id: teacherId,
    semester,
    change_type: 'leave',
    change_value: -duration,
    created_at: new Date().toISOString(),
    remark: `请假扣减课时${duration}节`,
  });
}
