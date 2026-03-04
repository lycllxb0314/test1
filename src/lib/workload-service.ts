/**
 * 教师工作量计算服务
 * 
 * 核心功能：
 * 1. 计算教师实际工作量（自己上的课 + 代课 + 课后服务）
 * 2. 与请假、调课系统联动
 * 3. 月度/学期统计
 */

import type { 
  TeacherWorkload, 
  TeacherMonthlyWorkloadSummary,
  ScheduleSlot,
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
  
  // 1. 获取教师信息
  const { data: teacher } = await client
    .from('teachers')
    .select('id, name, employee_id')
    .eq('id', teacherId)
    .single();
  
  const employeeId = teacher?.employee_id || teacherId;
  
  // 2. 获取该教师的基准课表 - 使用 teacher_id 和 status 筛选
  const { data: baseSlots } = await client
    .from('schedule_slots')
    .select('*')
    .eq('teacher_id', teacherId)
    .in('status', ['normal', 'active']);
  
  // 3. 获取调课记录（教师请假调出的课程）
  let leaveQuery = client
    .from('course_adjustments')
    .select('*')
    .eq('applicant_id', employeeId)
    .eq('status', 'completed');
  
  // 4. 获取代课记录（帮别人代课）
  let substituteQuery = client
    .from('course_adjustments')
    .select('*')
    .eq('substitute_employee_id', employeeId)
    .eq('status', 'completed');
  
  // 按月份筛选
  if (month) {
    const year = parseInt(semester.split('-')[0]);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    leaveQuery = leaveQuery.gte('effective_week', startDateStr).lte('effective_week', endDateStr);
    substituteQuery = substituteQuery.gte('effective_week', startDateStr).lte('effective_week', endDateStr);
  }
  
  const { data: leaveRecords } = await leaveQuery;
  const { data: substituteRecords } = await substituteQuery;
  
  // 5. 计算各项数据
  const baseSlotsCount = baseSlots?.length || 0;
  
  // 计算请假课时（调出的课程）
  const leaveHours = (leaveRecords || []).length;
  const leaveDetails = (leaveRecords || []).map(r => ({
    date: r.effective_week,
    leaveType: r.reason_type || '请假',
    hours: 1,
  }));
  
  // 计算代课课时
  const substituteHours = (substituteRecords || []).length;
  const substituteDetails = (substituteRecords || []).map(r => ({
    date: r.effective_week,
    classId: r.class_id,
    className: r.class_name,
    subject: r.subject,
    originalTeacherId: r.applicant_id,
    originalTeacherName: r.applicant_name,
    hours: 1,
  }));
  
  // 周课时 = 实际安排的课时数量
  const weeklyHours = baseSlotsCount;
  
  // 月应上课时 = 周课时 * 4（每月约4周）
  const expectedHours = weeklyHours * 4;
  
  // 自己上的课 = 月应上课时 - 请假课时
  const selfTaughtHours = Math.max(0, expectedHours - leaveHours);
  
  // 实际工作量 = 应上课时 - 请假课时 + 代课课时
  const totalWorkload = expectedHours - leaveHours + substituteHours;
  
  return {
    id: `wl-${teacherId}-${semester}${month || ''}`,
    teacherId,
    teacherName: teacher?.name || '',
    semester,
    month,
    baseWeeklyHours: weeklyHours,  // 改为实际周课时
    expectedHours,
    selfTaughtHours,
    leaveHours,
    leaveDetails,
    substituteHours,
    substituteDetails,
    afterSchoolServiceHours: 0,
    afterSchoolServiceDetails: [],
    totalWorkload,
    variance: totalWorkload - expectedHours,
    updatedAt: new Date().toISOString(),
  };
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
  
  // 如果有年级筛选，先获取该年级的教师ID列表
  let gradeTeacherIds: string[] | null = null;
  if (params.grade) {
    const { data: classesData } = await client
      .from('classes')
      .select('head_teacher_id, sub_teacher_id')
      .eq('grade', params.grade);
    
    if (classesData && classesData.length > 0) {
      const ids = new Set<string>();
      classesData.forEach(c => {
        if (c.head_teacher_id) ids.add(c.head_teacher_id);
        if (c.sub_teacher_id) ids.add(c.sub_teacher_id);
      });
      gradeTeacherIds = Array.from(ids);
    } else {
      // 该年级没有班级，返回空
      return [];
    }
  }
  
  // 获取教师列表（排除校长、书记等领导）
  let teacherQuery = client
    .from('teachers')
    .select('id, name, total_weekly_hours, employee_id')
    .not('role', 'in', '(principal,secretary,academic_vice_principal,moral_vice_principal,general_vice_principal)')
    .eq('status', 'active');
  
  if (params.teacherId) {
    teacherQuery = teacherQuery.eq('id', params.teacherId);
  }
  
  // 年级筛选
  if (gradeTeacherIds) {
    teacherQuery = teacherQuery.in('id', gradeTeacherIds);
  }
  
  const { data: teachers, error } = await teacherQuery;
  
  if (error) {
    console.error('获取教师列表失败:', error);
    return [];
  }
  
  // 批量计算工作量
  const results: TeacherWorkload[] = [];
  for (const teacher of (teachers || [])) {
    const workload = await calculateTeacherWorkload(
      teacher.id, 
      params.semester || '2025-2026-2',
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
  afterSchoolServiceHours: 4,
  afterSchoolServiceDetails: [
    { date: '2024-11-18', serviceType: '课后托管', classId: 'c001', className: '一年级1班', hours: 2 },
    { date: '2024-11-20', serviceType: '兴趣班', classId: 'c001', className: '一年级1班', hours: 2 },
  ],
  totalWorkload: 54,
  variance: 2,
  updatedAt: '2024-11-25T10:00:00Z',
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
  afterSchoolServiceHours: 4,
  totalWorkload: 54,
  variance: 2,
  trend: {
    totalWorkloadChange: 3,
    leaveHoursChange: -2,
    substituteHoursChange: 1,
  },
};
