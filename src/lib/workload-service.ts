/**
 * 教师工作量计算服务
 * 
 * 核心功能：
 * 1. 计算教师实际工作量（自己上的课 + 代课 + 课后服务）
 * 2. 与请假、代课系统联动
 * 3. 月度/学期统计
 */

import type { 
  TeacherWorkload, 
  TeacherMonthlyWorkloadSummary,
  ScheduleSlot,
  SubstituteRecord,
  AfterSchoolService,
  WorkloadQueryParams 
} from '@/types';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// ==================== 工作量计算 ====================

/**
 * 计算教师工作量
 */
export async function calculateTeacherWorkload(
  teacherId: string,
  semester: string,
  month?: number
): Promise<TeacherWorkload> {
  const client = getSupabaseClient();
  
  // 1. 获取教师信息（基准课时）
  const { data: teacher } = await client
    .from('teachers')
    .select('id, name, weekly_hours, role')
    .eq('id', teacherId)
    .single();
  
  // 2. 获取该教师的基准课表
  const { data: baseSlots } = await client
    .from('schedule_slots')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('semester', semester)
    .eq('status', 'normal');
  
  // 3. 获取请假记录
  let leaveQuery = client
    .from('leave_requests')
    .select('*')
    .eq('applicant_id', teacherId)
    .eq('status', 'approved');
  
  if (month) {
    const year = parseInt(semester.split('-')[0]);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    leaveQuery = leaveQuery
      .gte('start_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString());
  }
  
  const { data: leaveRecords } = await leaveQuery;
  
  // 4. 获取代课记录（帮别人代课）
  let substituteQuery = client
    .from('substitute_records')
    .select('*')
    .eq('substitute_teacher_id', teacherId)
    .eq('status', 'completed');
  
  if (month) {
    const year = parseInt(semester.split('-')[0]);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    substituteQuery = substituteQuery
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
  }
  
  const { data: substituteRecords } = await substituteQuery;
  
  // 5. 获取课后服务记录
  let afterSchoolQuery = client
    .from('after_school_services')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('status', 'completed');
  
  if (month) {
    const year = parseInt(semester.split('-')[0]);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    afterSchoolQuery = afterSchoolQuery
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);
  }
  
  const { data: afterSchoolRecords } = await afterSchoolQuery;
  
  // 6. 计算各项数据
  const baseWeeklyHours = teacher?.weekly_hours || 13;
  const baseSlotsCount = baseSlots?.length || 0;
  
  // 计算请假课时
  const leaveHours = calculateLeaveHours(leaveRecords || [], baseSlots || []);
  const leaveDetails = (leaveRecords || []).map(r => ({
    date: r.start_time,
    leaveType: r.type,
    hours: r.duration || 0,
  }));
  
  // 计算代课课时
  const substituteHours = (substituteRecords || []).length;
  const substituteDetails = (substituteRecords || []).map(r => ({
    date: r.created_at,
    classId: r.class_id,
    className: r.class_name,
    subject: r.subject,
    originalTeacherId: r.original_teacher_id,
    originalTeacherName: r.original_teacher_name,
    hours: 1,
  }));
  
  // 计算课后服务
  const afterSchoolServiceHours = (afterSchoolRecords || [])
    .reduce((sum, r) => sum + (r.hours || 1), 0);
  const afterSchoolServiceDetails = (afterSchoolRecords || []).map(r => ({
    date: r.date,
    serviceType: r.service_type,
    classId: r.class_id,
    className: r.class_name,
    hours: r.hours || 1,
  }));
  
  // 自己上的课 = 基准课时 - 请假课时
  const selfTaughtHours = Math.max(0, baseSlotsCount - leaveHours);
  
  // 实际工作量
  const totalWorkload = selfTaughtHours + substituteHours + afterSchoolServiceHours;
  
  // 预期课时（根据周数计算）
  const expectedHours = baseWeeklyHours * 4; // 简化：每月约4周
  
  return {
    id: `wl-${teacherId}-${semester}${month || ''}`,
    teacherId,
    teacherName: teacher?.name || '',
    semester,
    month,
    baseWeeklyHours,
    expectedHours,
    selfTaughtHours,
    leaveHours,
    leaveDetails,
    substituteHours,
    substituteDetails,
    afterSchoolServiceHours,
    afterSchoolServiceDetails,
    totalWorkload,
    variance: totalWorkload - expectedHours,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 计算请假课时
 */
function calculateLeaveHours(
  leaveRecords: Array<{ start_time: string; end_time: string; duration?: number }>,
  baseSlots: ScheduleSlot[]
): number {
  let totalHours = 0;
  
  for (const leave of leaveRecords) {
    // 如果有duration字段，直接使用
    if (leave.duration) {
      totalHours += leave.duration;
      continue;
    }
    
    // 否则根据请假时间计算
    const startDate = new Date(leave.start_time);
    const endDate = new Date(leave.end_time);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // 简化：每天约6节课
    totalHours += days * 6;
  }
  
  return totalHours;
}

/**
 * 获取教师月度工作量汇总
 */
export async function getTeacherMonthlyWorkloadSummary(
  teacherId: string,
  semester: string,
  month: number
): Promise<TeacherMonthlyWorkloadSummary> {
  const workload = await calculateTeacherWorkload(teacherId, semester, month);
  
  // 获取上月数据用于趋势对比
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevSemester = month === 1 
    ? `${parseInt(semester.split('-')[0]) - 1}-${parseInt(semester.split('-')[1])}`
    : semester;
  const prevWorkload = await calculateTeacherWorkload(teacherId, prevSemester, prevMonth);
  
  return {
    teacherId: workload.teacherId,
    teacherName: workload.teacherName,
    semester: workload.semester,
    month: workload.month!,
    baseWeeklyHours: workload.baseWeeklyHours,
    workingDays: 22, // 简化
    expectedHours: workload.expectedHours,
    selfTaughtHours: workload.selfTaughtHours,
    leaveHours: workload.leaveHours,
    substituteHours: workload.substituteHours,
    afterSchoolServiceHours: workload.afterSchoolServiceHours,
    totalWorkload: workload.totalWorkload,
    variance: workload.variance,
    trend: {
      totalWorkloadChange: workload.totalWorkload - prevWorkload.totalWorkload,
      leaveHoursChange: workload.leaveHours - prevWorkload.leaveHours,
      substituteHoursChange: workload.substituteHours - prevWorkload.substituteHours,
    },
  };
}

/**
 * 批量获取教师工作量
 */
export async function getTeachersWorkload(
  params: WorkloadQueryParams
): Promise<TeacherWorkload[]> {
  const client = getSupabaseClient();
  
  // 获取教师列表
  let teacherQuery = client
    .from('teachers')
    .select('id, name, weekly_hours');
  
  if (params.teacherId) {
    teacherQuery = teacherQuery.eq('id', params.teacherId);
  }
  
  const { data: teachers } = await teacherQuery;
  
  // 批量计算工作量
  const results: TeacherWorkload[] = [];
  for (const teacher of (teachers || [])) {
    const workload = await calculateTeacherWorkload(
      teacher.id, 
      params.semester || '2024-2025-1',
      params.month
    );
    results.push(workload);
  }
  
  return results;
}

// ==================== Mock数据 ====================

export const MOCK_TEACHER_WORKLOAD: TeacherWorkload = {
  id: 'wl-t001-2024-2025-1-11',
  teacherId: 't001',
  teacherName: '张明华',
  semester: '2024-2025-1',
  month: 11,
  baseWeeklyHours: 13,
  expectedHours: 52,
  selfTaughtHours: 48,
  leaveHours: 4,
  leaveDetails: [
    { date: '2024-11-15', leaveType: '病假', hours: 4 },
  ],
  substituteHours: 2,
  substituteDetails: [
    { 
      date: '2024-11-18', 
      classId: 'c002', 
      className: '一年级2班', 
      subject: '语文',
      originalTeacherId: 't003',
      originalTeacherName: '王建国',
      hours: 1 
    },
    { 
      date: '2024-11-20', 
      classId: 'c003', 
      className: '二年级1班', 
      subject: '语文',
      originalTeacherId: 't003',
      originalTeacherName: '王建国',
      hours: 1 
    },
  ],
  afterSchoolServiceHours: 8,
  afterSchoolServiceDetails: [
    { date: '2024-11-04', serviceType: '课后托管', classId: 'c001', className: '一年级1班', hours: 2 },
    { date: '2024-11-11', serviceType: '课后托管', classId: 'c001', className: '一年级1班', hours: 2 },
    { date: '2024-11-18', serviceType: '课后托管', classId: 'c001', className: '一年级1班', hours: 2 },
    { date: '2024-11-25', serviceType: '课后托管', classId: 'c001', className: '一年级1班', hours: 2 },
  ],
  totalWorkload: 58,
  variance: 6,
  updatedAt: '2024-11-30T00:00:00Z',
};

export const MOCK_MONTHLY_SUMMARY: TeacherMonthlyWorkloadSummary = {
  teacherId: 't001',
  teacherName: '张明华',
  semester: '2024-2025-1',
  month: 11,
  baseWeeklyHours: 13,
  workingDays: 22,
  expectedHours: 52,
  selfTaughtHours: 48,
  leaveHours: 4,
  substituteHours: 2,
  afterSchoolServiceHours: 8,
  totalWorkload: 58,
  variance: 6,
  trend: {
    totalWorkloadChange: 3,
    leaveHoursChange: -2,
    substituteHoursChange: 1,
  },
};
