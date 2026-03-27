/**
 * 推荐代课教师 API
 * 
 * 根据请假教师的时间段和年级，智能推荐可用的代课教师
 * 
 * 推荐规则：
 * 1. 年段长负责的年级内的教师
 * 2. 排除在该时间段已有课的教师
 * 3. 优先推荐相同学科的教师
 * 4. 按工作量排序（工作量少的优先）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取推荐代课教师列表
 * 
 * Query params:
 * - adjustmentId: 调课记录ID
 * - grade: 年级
 * - subject: 科目
 * - weekDay: 星期几 (1-5)
 * - periodIndex: 节次 (0-based)
 * - effectiveWeek: 生效周
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const adjustmentId = searchParams.get('adjustmentId');
    const grade = parseInt(searchParams.get('grade') || '0');
    const subject = searchParams.get('subject') || '';
    const weekDay = parseInt(searchParams.get('weekDay') || '0');
    const periodIndex = parseInt(searchParams.get('periodIndex') || '0');
    const effectiveWeek = searchParams.get('effectiveWeek');
    
    if (!adjustmentId) {
      return NextResponse.json(error('缺少调课记录ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 获取调课记录详情
    const { data: adjustment, error: adjError } = await client
      .from('course_adjustments')
      .select('*')
      .eq('id', adjustmentId)
      .single();
    
    if (adjError || !adjustment) {
      return NextResponse.json(error('调课记录不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    const adjustmentGrade = adjustment.grade || grade;
    const adjustmentSubject = adjustment.subject || subject;
    const adjustmentWeekDay = adjustment.week_day || weekDay;
    const adjustmentPeriodIndex = adjustment.period_index || periodIndex;
    
    // 如果关键信息缺失，尝试从 original_slot 获取
    const originalSlot = adjustment.original_slot || {};
    const finalGrade = adjustmentGrade || originalSlot.grade || 0;
    const finalSubject = adjustmentSubject || originalSlot.subject || '';
    const finalWeekDay = adjustmentWeekDay || originalSlot.weekDay || 0;
    const finalPeriodIndex = adjustmentPeriodIndex || originalSlot.periodIndex || 0;
    
    // 如果仍然缺少关键信息，返回错误
    if (!finalGrade && !finalSubject) {
      return NextResponse.json(error('调课记录缺少课程信息，无法推荐教师', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 获取当前学年学期
    const now = new Date();
    const { data: currentSemester } = await client
      .from('semesters')
      .select('*')
      .lte('start_date', now.toISOString().split('T')[0])
      .gte('end_date', now.toISOString().split('T')[0])
      .single();
    
    const academicYear = currentSemester?.academic_year || '2024-2025';
    const semester = currentSemester?.semester || '1';
    
    // 1. 获取该年级所有教师（如果没有年级信息，获取所有教师）
    let gradeTeachersQuery = client
      .from('teachers')
      .select(`
        id,
        name,
        employee_id,
        primary_subject,
        secondary_subjects,
        current_teaching_grades,
        total_weekly_hours,
        department,
        title
      `)
      .eq('status', 'active');
    
    // 如果有年级信息，按年级筛选
    if (finalGrade > 0) {
      gradeTeachersQuery = gradeTeachersQuery.contains('current_teaching_grades', [finalGrade]);
    }
    
    const { data: gradeTeachers, error: teachersError } = await gradeTeachersQuery;
    
    if (teachersError) {
      console.error('获取年级教师失败:', teachersError);
      return NextResponse.json(error('获取教师列表失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 2. 排除请假教师本人
    const applicantId = adjustment.applicant_id;
    const availableTeachers = (gradeTeachers || []).filter(t => t.employee_id !== applicantId);
    
    // 3. 获取已排课教师的课时统计
    const { data: workloadData } = await client
      .from('teacher_workload')
      .select('employee_id, total_lessons, substitute_lessons')
      .eq('academic_year', academicYear)
      .eq('semester', semester);
    
    const workloadMap: Record<string, { total: number; substitute: number }> = {};
    (workloadData || []).forEach(w => {
      workloadMap[w.employee_id] = {
        total: w.total_lessons || 0,
        substitute: w.substitute_lessons || 0,
      };
    });
    
    // 4. 检查每个教师在请假时段是否有课
    // 获取该时间段已有课的教师
    let busyTeacherIds = new Set<string>();
    if (finalWeekDay > 0) {
      const { data: busyTeachers } = await client
        .from('schedule_slots')
        .select('employee_id')
        .eq('week_day', finalWeekDay)
        .eq('period_index', finalPeriodIndex);
      
      busyTeacherIds = new Set((busyTeachers || []).map(t => t.employee_id));
    }
    
    // 5. 构建推荐列表
    const recommendations = availableTeachers.map(teacher => {
      const isSameSubject = teacher.primary_subject === finalSubject || 
                           (teacher.secondary_subjects || []).includes(finalSubject);
      const isBusy = busyTeacherIds.has(teacher.employee_id);
      const workload = workloadMap[teacher.employee_id] || { total: 0, substitute: 0 };
      
      // 计算推荐分数
      // - 无课冲突：+50分
      // - 同学科：+30分
      // - 工作量少：+20分（按比例）
      let score = 0;
      if (!isBusy) score += 50;
      if (isSameSubject) score += 30;
      // 工作量分数：最多20分，工作量越少分数越高
      const maxHours = teacher.total_weekly_hours || 20;
      const usedHours = workload.total;
      const availableRatio = Math.max(0, 1 - usedHours / maxHours);
      score += Math.round(availableRatio * 20);
      
      return {
        id: teacher.id,
        employeeId: teacher.employee_id,
        name: teacher.name,
        primarySubject: teacher.primary_subject,
        secondarySubjects: teacher.secondary_subjects || [],
        currentTeachingGrades: teacher.current_teaching_grades || [],
        department: teacher.department,
        title: teacher.title,
        totalWeeklyHours: teacher.total_weekly_hours,
        usedHours: workload.total,
        substituteCount: workload.substitute,
        isSameSubject,
        isAvailable: !isBusy,
        score,
        // 推荐理由
        reason: isBusy 
          ? '该时段有课' 
          : (isSameSubject ? '同学科，推荐代课' : '有空闲时段'),
      };
    });
    
    // 按分数排序，优先推荐无课冲突且同学科的教师
    recommendations.sort((a, b) => {
      // 先按是否可用排序
      if (a.isAvailable !== b.isAvailable) {
        return a.isAvailable ? -1 : 1;
      }
      // 再按分数排序
      return b.score - a.score;
    });
    
    // 分组返回
    const available = recommendations.filter(r => r.isAvailable);
    const unavailable = recommendations.filter(r => !r.isAvailable);
    
    return NextResponse.json(success({
      adjustment: {
        id: adjustment.id,
        grade: finalGrade,
        subject: finalSubject,
        weekDay: finalWeekDay,
        periodIndex: finalPeriodIndex,
        className: adjustment.class_name,
        applicantName: adjustment.applicant_name,
        effectiveWeek: adjustment.effective_week_number || getWeekNumber(new Date(adjustment.effective_week)),
      },
      recommended: available.slice(0, 5), // 最多推荐5个
      available,
      unavailable,
      total: recommendations.length,
    }, 'database'));
    
  } catch (err) {
    console.error('获取推荐教师失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

// 辅助函数：获取周数
function getWeekNumber(date: Date): number {
  if (!date || isNaN(date.getTime())) return 1;
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
