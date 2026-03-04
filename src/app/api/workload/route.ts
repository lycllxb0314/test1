/**
 * 教师工作量统计 API
 * 
 * 功能：
 * - 批量获取教师工作量统计
 * - 获取单个教师工作量详情
 * - 按学期、月份、年级筛选
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

/**
 * GET - 获取工作量数据
 * 
 * Query params:
 * - action: 'batch' | 'teacher' | 'monthly'
 * - semester: 学期 (如 2024-2025-1)
 * - month: 月份 (1-12)
 * - grade: 年级筛选 (可选)
 * - teacherId: 教师ID (action=teacher时必填)
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const action = searchParams.get('action') || 'batch';
    const semester = searchParams.get('semester') || '2025-2026-2';
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const grade = searchParams.get('grade');
    
    // 解析学年学期 (格式: 2025-2026-2)
    const semesterParts = semester.split('-');
    // 第二学期使用学年的第二年作为基准年
    const baseYear = semesterParts[2] === '2' ? parseInt(semesterParts[1]) : parseInt(semesterParts[0]);
    const semesterNum = semesterParts[2] || '1';
    
    switch (action) {
      case 'batch':
        return await getBatchWorkload(client, baseYear, semesterNum, month, grade);
      
      case 'teacher':
        const teacherId = searchParams.get('teacherId');
        if (!teacherId) {
          return NextResponse.json(error('缺少教师ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
        }
        return await getTeacherWorkload(client, teacherId, baseYear, semesterNum, month);
      
      case 'monthly':
        const teacherIdForMonth = searchParams.get('teacherId');
        if (!teacherIdForMonth) {
          return NextResponse.json(error('缺少教师ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
        }
        return await getMonthlySummary(client, teacherIdForMonth, baseYear, semesterNum);
      
      default:
        return NextResponse.json(error('无效的操作类型', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
  } catch (err) {
    console.error('获取工作量数据失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * 批量获取教师工作量
 */
async function getBatchWorkload(
  client: any, 
  baseYear: number, 
  semester: string, 
  month: number,
  grade?: string | null
) {
  try {
    // 获取所有教师
    let teachersQuery = client
      .from('teachers')
      .select('employee_id, name, primary_subject, department')
      .eq('status', 'active');
    
    if (grade) {
      // 按年级筛选（查找该年级的班主任或任课教师）
      teachersQuery = teachersQuery.contains('managed_grades', [parseInt(grade)]);
    }
    
    const { data: teachers, error: teacherError } = await teachersQuery;
    
    if (teacherError) {
      console.error('获取教师列表失败:', teacherError);
      return NextResponse.json(error('获取教师列表失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 计算月份对应的周次范围（baseYear已经是正确的年份）
    const monthStart = new Date(baseYear, month - 1, 1);
    const monthEnd = new Date(baseYear, month, 0);
    
    // 构建学年字符串
    const academicYearStr = semester === '2' 
      ? `${baseYear - 1}-${baseYear}` 
      : `${baseYear}-${baseYear + 1}`;
    
    // 获取该月所有周的工作量数据
    const { data: workloads, error: workloadError } = await client
      .from('teacher_workload')
      .select('*')
      .eq('academic_year', academicYearStr)
      .eq('semester', semester)
      .gte('week_start_date', monthStart.toISOString().split('T')[0])
      .lte('week_end_date', monthEnd.toISOString().split('T')[0]);
    
    if (workloadError) {
      console.error('获取工作量数据失败:', workloadError);
    }
    
    // 获取教师基准课表课时（从课程表统计）
    // 注意：schedule_slots 表使用 employee_id 字段
    const { data: schedules } = await client
      .from('schedule_slots')
      .select('employee_id')
      .in('employee_id', teachers?.map((t: any) => t.employee_id) || []);
    
    // 统计每个教师的周课时（schedule_slots 中每条记录代表一节课）
    const scheduleCount: Record<string, number> = {};
    schedules?.forEach((s: any) => {
      if (s.employee_id) {
        scheduleCount[s.employee_id] = (scheduleCount[s.employee_id] || 0) + 1;
      }
    });
    
    // 组装数据
    const result = teachers?.map((teacher: any) => {
      // 汇总该教师该月的所有周工作量
      const teacherWorkloads = workloads?.filter((w: any) => w.employee_id === teacher.employee_id) || [];
      
      // schedule_slots 存储的是每周课程安排，每条记录代表一节课
      // 所以 totalLessons 就是每周课时数
      const weeklyLessons = scheduleCount[teacher.employee_id] || 0;
      const monthLessons = weeklyLessons * 4; // 月应上课时（每周课时 × 4周）
      
      const substituteLessons = teacherWorkloads.reduce((sum: number, w: any) => sum + (w.substitute_lessons || 0), 0);
      const adjustedLessons = teacherWorkloads.reduce((sum: number, w: any) => sum + (w.adjusted_lessons || 0), 0);
      
      // 计算实际工作量
      const actualLessons = monthLessons - adjustedLessons + substituteLessons;
      
      // 标准工作量（假设每周16节课）
      const standardLessons = 16 * 4;
      const variance = actualLessons - standardLessons;
      
      return {
        teacherId: teacher.employee_id,
        teacherName: teacher.name,
        primarySubject: teacher.primary_subject,
        department: teacher.department,
        totalWorkload: actualLessons,
        standardWorkload: standardLessons,
        variance,
        variancePercentage: Math.round((variance / standardLessons) * 100),
        details: {
          baseLessons: monthLessons,
          actualLessons: actualLessons,
          substituteLessons,
          adjustedLessons,
          leaveDays: teacherWorkloads.reduce((sum: number, w: any) => sum + (w.leave_days || 0), 0),
        },
      };
    }) || [];
    
    return NextResponse.json(success(result, 'database'));
    
  } catch (err) {
    console.error('批量获取工作量失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * 获取单个教师工作量详情
 */
async function getTeacherWorkload(
  client: any,
  teacherId: string,
  baseYear: number,
  semester: string,
  month: number
) {
  try {
    // 获取教师信息
    const { data: teacher, error: teacherError } = await client
      .from('teachers')
      .select('*')
      .eq('employee_id', teacherId)
      .single();
    
    if (teacherError || !teacher) {
      return NextResponse.json(error('教师不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    // 计算月份对应的周次范围（baseYear已经是正确的年份）
    const monthStart = new Date(baseYear, month - 1, 1);
    const monthEnd = new Date(baseYear, month, 0);
    
    // 构建学年字符串
    const academicYearStr = semester === '2' 
      ? `${baseYear - 1}-${baseYear}` 
      : `${baseYear}-${baseYear + 1}`;
    
    // 获取该月的周工作量数据
    const { data: workloads } = await client
      .from('teacher_workload')
      .select('*')
      .eq('employee_id', teacherId)
      .eq('academic_year', academicYearStr)
      .eq('semester', semester)
      .gte('week_start_date', monthStart.toISOString().split('T')[0])
      .lte('week_end_date', monthEnd.toISOString().split('T')[0])
      .order('week_number');
    
    // 获取教师的课表（使用 employee_id 字段）
    const { data: schedules } = await client
      .from('schedule_slots')
      .select('*')
      .eq('employee_id', teacherId);
    
    // 获取请假记录
    const { data: leaves } = await client
      .from('leave_requests')
      .select('*')
      .eq('applicant_id', teacherId)
      .gte('start_date', monthStart.toISOString().split('T')[0])
      .lte('end_date', monthEnd.toISOString().split('T')[0]);
    
    // 获取代课记录（教师作为代课人）
    const { data: substitutes } = await client
      .from('course_adjustments')
      .select('*')
      .eq('substitute_employee_id', teacherId)
      .eq('status', 'completed')
      .gte('effective_week', monthStart.toISOString().split('T')[0])
      .lte('effective_week', monthEnd.toISOString().split('T')[0]);
    
    // 获取被代课记录（教师作为请假人，课程被他人代课）
    const { data: substitutedByOthers } = await client
      .from('course_adjustments')
      .select('*')
      .eq('applicant_id', teacherId)
      .eq('status', 'completed')
      .gte('effective_week', monthStart.toISOString().split('T')[0])
      .lte('effective_week', monthEnd.toISOString().split('T')[0]);
    
    // 计算总课时
    // schedule_slots 存储的是每周课程安排，每条记录代表一节课
    // 所以 schedules?.length 就是每周课时数
    const weeklyLessons = schedules?.length || 0;
    const monthLessons = weeklyLessons * 4; // 月应上课时（每周课时 × 4周）
    
    // 代课课时 = 教师帮别人代课的节数
    const substituteLessons = substitutes?.length || 0;
    // 被代课课时 = 教师请假，由他人代课的节数
    const adjustedLessons = substitutedByOthers?.length || 0;
    // 实际授课 = 月应上课时 - 被代课 + 代课
    const actualLessons = monthLessons - adjustedLessons + substituteLessons;
    
    const result = {
      teacherId: teacher.employee_id,
      teacherName: teacher.name,
      primarySubject: teacher.primary_subject,
      department: teacher.department,
      academicYear: academicYearStr,
      semester,
      month,
      
      // 基准课时
      baseWeeklyHours: weeklyLessons,
      expectedHours: monthLessons,
      
      // 实际授课
      selfTaughtHours: monthLessons - adjustedLessons,
      leaveHours: adjustedLessons,
      leaveDetails: leaves?.map((l: any) => ({
        date: l.start_date,
        leaveType: l.type || l.leave_type,
        hours: l.duration || 1,
      })) || [],
      
      // 代课
      substituteHours: substituteLessons,
      substituteDetails: substitutes?.map((s: any) => ({
        date: s.effective_week,
        classId: s.class_id,
        className: s.class_name,
        subject: s.subject,
        originalTeacherId: s.applicant_id,
        originalTeacherName: s.applicant_name,
        hours: 1,
      })) || [],
      
      // 被代课（请假导致他人代课）
      adjustedHours: adjustedLessons,
      adjustedDetails: substitutedByOthers?.map((s: any) => ({
        date: s.effective_week,
        classId: s.class_id,
        className: s.class_name,
        subject: s.subject,
        substituteTeacherId: s.substitute_employee_id,
        substituteTeacherName: s.substitute_name,
        hours: 1,
      })) || [],
      
      // 课后服务
      afterSchoolServiceHours: 0,
      afterSchoolServiceDetails: [],
      
      // 统计
      totalWorkload: actualLessons,
      standardWorkload: 16 * 4,
      variance: actualLessons - 16 * 4,
      
      // 其他字段（保持兼容）
      details: {
        baseLessons: monthLessons,
        actualLessons,
        substituteLessons,
        adjustedLessons,
        leaveDays: leaves?.length || 0,
      },
      
      // 周明细
      weeklyBreakdown: workloads?.map((w: any) => ({
        weekNumber: w.week_number,
        weekStartDate: w.week_start_date,
        weekEndDate: w.week_end_date,
        totalLessons: w.total_lessons || weeklyLessons,
        actualLessons: w.actual_lessons || 0,
        substituteLessons: w.substitute_lessons || 0,
        adjustedLessons: w.adjusted_lessons || 0,
      })),
      
      // 请假记录
      leaveRecords: leaves?.map((l: any) => ({
        id: l.id,
        type: l.leave_type,
        startDate: l.start_date,
        endDate: l.end_date,
        reason: l.reason,
        status: l.status,
      })),
      
      // 代课记录
      substituteRecords: substitutes?.map((s: any) => ({
        id: s.id,
        weekDay: s.week_day,
        periodIndex: s.period_index,
        className: s.class_name,
        subject: s.subject,
        applicantName: s.applicant_name,
      })),
      
      updatedAt: new Date().toISOString(),
    };
    
    return NextResponse.json(success(result, 'database'));
    
  } catch (err) {
    console.error('获取教师工作量详情失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * 获取教师月度汇总
 */
async function getMonthlySummary(
  client: any,
  teacherId: string,
  baseYear: number,
  semester: string
) {
  try {
    // 构建学年字符串
    const academicYearStr = semester === '2' 
      ? `${baseYear - 1}-${baseYear}` 
      : `${baseYear}-${baseYear + 1}`;
    
    // 获取该学期所有月的工作量
    const { data: workloads } = await client
      .from('teacher_workload')
      .select('*')
      .eq('employee_id', teacherId)
      .eq('academic_year', academicYearStr)
      .eq('semester', semester)
      .order('week_number');
    
    // 按月汇总
    const monthlyData: Record<number, any> = {};
    
    workloads?.forEach((w: any) => {
      const month = new Date(w.week_start_date).getMonth() + 1;
      
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          totalLessons: 0,
          actualLessons: 0,
          substituteLessons: 0,
          adjustedLessons: 0,
          leaveDays: 0,
        };
      }
      
      monthlyData[month].totalLessons += w.total_lessons || 0;
      monthlyData[month].actualLessons += w.actual_lessons || 0;
      monthlyData[month].substituteLessons += w.substitute_lessons || 0;
      monthlyData[month].adjustedLessons += w.adjusted_lessons || 0;
      monthlyData[month].leaveDays += w.leave_days || 0;
    });
    
    const result = {
      teacherId,
      academicYear: academicYearStr,
      semester,
      monthlySummary: Object.values(monthlyData),
      totalSubstituteLessons: workloads?.reduce((sum: number, w: any) => sum + (w.substitute_lessons || 0), 0) || 0,
      totalAdjustedLessons: workloads?.reduce((sum: number, w: any) => sum + (w.adjusted_lessons || 0), 0) || 0,
    };
    
    return NextResponse.json(success(result, 'database'));
    
  } catch (err) {
    console.error('获取月度汇总失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
