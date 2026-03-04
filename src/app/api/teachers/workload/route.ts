import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET: 获取教师工作量统计
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const semester = searchParams.get('semester') || '2024-2025-1';
    const weekStartDate = searchParams.get('weekStartDate');

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: '缺少教师工号' },
        { status: 400 }
      );
    }

    console.log('[workload] 查询教师:', employeeId);

    // 获取当前周的开始日期（周一）
    const getCurrentWeekMonday = () => {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(now.setDate(diff));
    };

    const currentWeekStart = weekStartDate || getCurrentWeekMonday().toISOString().split('T')[0];
    console.log('[workload] 当前周开始日期:', currentWeekStart);

    // 1. 获取教师的基准课表
    const { data: scheduleSlots, error: slotsError } = await supabase
      .from('schedule_slots')
      .select('*')
      .eq('employee_id', employeeId);

    if (slotsError) {
      console.error('[workload] 获取课表失败:', slotsError);
    }

    console.log('[workload] 查询到课表记录:', scheduleSlots?.length || 0);

    // 2. 获取本周调课信息（该教师请假，需要调出的课程）
    // effective_week 是 timestamp 类型，需要使用日期范围查询
    const weekEndDate = new Date(currentWeekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 7);
    const weekEndStr = weekEndDate.toISOString().split('T')[0];
    
    // applicant_id 是请假申请人
    const { data: adjustments, error: adjError } = await supabase
      .from('course_adjustments')
      .select('*')
      .eq('applicant_id', employeeId)
      .gte('effective_week', currentWeekStart)
      .lt('effective_week', weekEndStr);

    if (adjError) {
      console.error('[workload] 获取调课信息失败:', adjError);
    }

    console.log('[workload] 本周调出记录:', adjustments?.length || 0);

    // 3. 获取本周代课信息（该教师作为代课教师）
    // substitute_employee_id 是代课教师
    const { data: substitutes, error: subError } = await supabase
      .from('course_adjustments')
      .select('*')
      .eq('substitute_employee_id', employeeId)
      .gte('effective_week', currentWeekStart)
      .lt('effective_week', weekEndStr);

    if (subError) {
      console.error('[workload] 获取代课信息失败:', subError);
    }

    console.log('[workload] 本周代课记录:', substitutes?.length || 0);

    // 计算统计数据
    const totalBaseHours = scheduleSlots?.length || 0;
    const adjustedOutHours = adjustments?.filter(a => a.status === 'completed').length || 0;
    const substitutedInHours = substitutes?.filter(a => a.status === 'completed').length || 0;
    
    const teachingHours = totalBaseHours - adjustedOutHours;
    const substituteHours = substitutedInHours;
    const totalHours = teachingHours + substituteHours;

    console.log('[workload] 统计:', { totalBaseHours, adjustedOutHours, substitutedInHours, teachingHours, substituteHours, totalHours });

    // 4. 学科分布
    const subjectMap = new Map<string, number>();
    scheduleSlots?.forEach(slot => {
      const subject = slot.subject;
      subjectMap.set(subject, (subjectMap.get(subject) || 0) + 1);
    });

    const subjectDistribution = Array.from(subjectMap.entries()).map(([subject, hours]) => ({
      subject,
      hours,
      percentage: totalBaseHours > 0 ? Math.round((hours / totalBaseHours) * 100 * 10) / 10 : 0,
    }));

    // 5. 班级分布
    const classMap = new Map<string, number>();
    scheduleSlots?.forEach(slot => {
      const className = slot.class_name || '未知班级';
      classMap.set(className, (classMap.get(className) || 0) + 1);
    });

    const classDistribution = Array.from(classMap.entries())
      .map(([className, hours]) => ({ className, hours }))
      .sort((a, b) => b.hours - a.hours);

    // 6. 获取近5周趋势数据
    const weeklyTrend = [];
    for (let i = 4; i >= 0; i--) {
      const weekDate = new Date(getCurrentWeekMonday());
      weekDate.setDate(weekDate.getDate() - i * 7);
      const weekStart = weekDate.toISOString().split('T')[0];
      
      // 计算周末日期
      const weekEnd = new Date(weekDate);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekEndStr = weekEnd.toISOString().split('T')[0];
      
      // 获取该周的调课数据（使用日期范围查询）
      const { data: weekAdjustments } = await supabase
        .from('course_adjustments')
        .select('*')
        .or(`applicant_id.eq.${employeeId},substitute_employee_id.eq.${employeeId}`)
        .gte('effective_week', weekStart)
        .lt('effective_week', weekEndStr);

      const adjOut = weekAdjustments?.filter(a => a.applicant_id === employeeId && a.status === 'completed').length || 0;
      const subIn = weekAdjustments?.filter(a => a.substitute_employee_id === employeeId && a.status === 'completed').length || 0;

      weeklyTrend.push({
        week: weekStart,
        weekLabel: `第${getWeekNumber(weekDate)}周`,
        totalHours: totalBaseHours - adjOut + subIn,
        teachingHours: totalBaseHours - adjOut,
        substituteHours: subIn,
      });
    }

    // 7. 获取学期累计数据
    const semesterStart = '2024-09-01'; // 学期开始日期
    const { data: semesterAdjustments } = await supabase
      .from('course_adjustments')
      .select('*')
      .or(`applicant_id.eq.${employeeId},substitute_employee_id.eq.${employeeId}`)
      .gte('effective_week', semesterStart)
      .eq('status', 'completed');

    const semesterAdjustedOut = semesterAdjustments?.filter(a => a.applicant_id === employeeId).length || 0;
    const semesterSubstitutedIn = semesterAdjustments?.filter(a => a.substitute_employee_id === employeeId).length || 0;

    // 8. 获取教师基本信息
    const { data: teacherInfo } = await supabase
      .from('users')
      .select('name, employee_id')
      .eq('employee_id', employeeId)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        teacherName: teacherInfo?.name || '未知',
        employeeId: employeeId,
        totalHours,
        teachingHours,
        substituteHours,
        adjustedHours: semesterAdjustedOut,
        weeklyTrend,
        subjectDistribution,
        classDistribution,
        semesterStats: {
          totalAdjustedOut: semesterAdjustedOut,
          totalSubstitutedIn: semesterSubstitutedIn,
        },
      },
    });

  } catch (error) {
    console.error('[workload] 获取工作量统计失败:', error);
    return NextResponse.json(
      { success: false, error: '获取工作量统计失败' },
      { status: 500 }
    );
  }
}

// 辅助函数：获取周次
function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 8, 1); // 9月1日开学
  const diff = date.getTime() - startOfYear.getTime();
  const weekNum = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  return weekNum > 0 ? weekNum : 1;
}
