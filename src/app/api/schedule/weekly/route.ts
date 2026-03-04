/**
 * 本周课表 API
 * 
 * 功能：
 * - 从 schedule_slots 获取基准课表
 * - 从 course_adjustments 获取本周调课信息
 * - 合并生成实际课表
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

// 获取本周周一日期
function getWeekMonday(date?: Date): string {
  const d = date || new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/**
 * GET - 获取本周课表
 * 
 * Query params:
 * - weekStartDate: 周一日期，默认本周
 * - classId: 班级ID（可选）
 * - employeeId: 教师工号（可选）
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const weekStartDate = searchParams.get('weekStartDate') || getWeekMonday();
    const classId = searchParams.get('classId');
    const employeeId = searchParams.get('employeeId');
    
    // 1. 获取基准课表（schedule_slots 表中有 employee_id 字段，可以直接使用）
    let scheduleQuery = client
      .from('schedule_slots')
      .select('*');
    
    if (classId) {
      scheduleQuery = scheduleQuery.eq('class_id', classId);
    }
    if (employeeId) {
      // 直接使用 employee_id 过滤
      scheduleQuery = scheduleQuery.eq('employee_id', employeeId);
    }
    
    const { data: baseSlots, error: scheduleError } = await scheduleQuery;
    
    if (scheduleError) {
      console.error('获取基准课表失败:', scheduleError);
      return NextResponse.json(error('获取课表失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 3. 获取本周调课信息
    // 注意：effective_week 是 timestamp 类型，需要使用范围查询或日期转换
    // 使用 gte 和 lt 查询指定日期范围内的记录
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 7);
    const weekEndStr = weekEndDate.toISOString().split('T')[0];
    
    const { data: adjustments, error: adjustError } = await client
      .from('course_adjustments')
      .select(`
        id,
        leave_request_id,
        applicant_id,
        applicant_name,
        adjust_type,
        status,
        class_id,
        class_name,
        grade,
        week_day,
        period_index,
        subject,
        substitute_employee_id,
        substitute_name,
        reason,
        effective_week,
        created_at
      `)
      .gte('effective_week', weekStartDate)
      .lt('effective_week', weekEndStr)
      .eq('status', 'completed');
    
    if (adjustError) {
      console.error('获取调课信息失败:', adjustError);
      // 继续执行，不影响基准课表显示
    }
    
    // 3. 构建调课映射（key: classId-weekDay-periodIndex）
    const adjustmentMap = new Map<string, any>();
    (adjustments || []).forEach(adj => {
      const key = `${adj.class_id}-${adj.week_day}-${adj.period_index}`;
      adjustmentMap.set(key, adj);
    });
    
    // 4. 合并生成实际课表
    const slots = (baseSlots || []).map(slot => {
      const key = `${slot.class_id}-${slot.week_day}-${slot.period_index}`;
      const adj = adjustmentMap.get(key);
      
      if (adj) {
        // 有调课
        return {
          slotId: slot.id,
          classId: slot.class_id,
          className: slot.class_name,
          grade: slot.grade,
          weekDay: slot.week_day,
          periodIndex: slot.period_index,
          periodName: slot.period_name,
          subject: slot.subject,
          
          // 基准课表教师（原教师）
          teacherId: slot.teacher_id,
          teacherName: slot.teacher_name,
          employeeId: slot.employee_id,
          originalTeacherName: slot.teacher_name,
          originalEmployeeId: slot.employee_id,
          
          // 调课信息
          isAdjusted: true,
          adjustmentType: adj.adjust_type,
          adjustmentId: adj.id,
          adjustmentReason: adj.reason,
          
          // 实际任课教师
          actualEmployeeId: adj.substitute_employee_id || slot.employee_id,
          actualTeacherName: adj.substitute_name || slot.teacher_name,
          
          // 调课详情
          leaveRequestId: adj.leave_request_id,
          applicantId: adj.applicant_id,
          applicantName: adj.applicant_name,
        };
      }
      
      // 无调课
      return {
        slotId: slot.id,
        classId: slot.class_id,
        className: slot.class_name,
        grade: slot.grade,
        weekDay: slot.week_day,
        periodIndex: slot.period_index,
        periodName: slot.period_name,
        subject: slot.subject,
        
        // 基准课表教师
        teacherId: slot.teacher_id,
        teacherName: slot.teacher_name,
        employeeId: slot.employee_id,
        
        // 调课信息
        isAdjusted: false,
        adjustmentType: null,
        adjustmentId: null,
        adjustmentReason: null,
        
        // 实际任课教师
        actualEmployeeId: slot.employee_id,
        actualTeacherName: slot.teacher_name,
        
        // 调课详情
        leaveRequestId: null,
        applicantId: null,
        applicantName: null,
      };
    });
    
    // 5. 如果是按教师查询，还需要查询该教师代课的课程
    if (employeeId) {
      const { data: substituteSlots } = await client
        .from('course_adjustments')
        .select(`
          id,
          leave_request_id,
          applicant_id,
          applicant_name,
          adjust_type,
          class_id,
          class_name,
          grade,
          week_day,
          period_index,
          subject,
          substitute_employee_id,
          substitute_name,
          reason
        `)
        .gte('effective_week', weekStartDate)
        .lt('effective_week', weekEndStr)
        .eq('substitute_employee_id', employeeId)
        .eq('status', 'completed');
      
      // 添加代课课程
      (substituteSlots || []).forEach(adj => {
        // 检查是否已存在（避免重复）
        const exists = slots.find(s => 
          s.classId === adj.class_id && 
          s.weekDay === adj.week_day && 
          s.periodIndex === adj.period_index
        );
        
        if (!exists) {
          // 获取原课程信息
          slots.push({
            slotId: `adj-${adj.id}`,
            classId: adj.class_id,
            className: adj.class_name,
            grade: adj.grade,
            weekDay: adj.week_day,
            periodIndex: adj.period_index,
            periodName: null,
            subject: adj.subject,
            
            // 原教师
            teacherId: null,
            teacherName: adj.applicant_name,
            employeeId: adj.applicant_id,
            originalTeacherName: adj.applicant_name,
            originalEmployeeId: adj.applicant_id,
            
            // 调课信息
            isAdjusted: true,
            adjustmentType: 'substitute',
            adjustmentId: adj.id,
            adjustmentReason: adj.reason,
            
            // 实际任课教师（代课）
            actualEmployeeId: adj.substitute_employee_id,
            actualTeacherName: adj.substitute_name,
            
            // 调课详情
            leaveRequestId: adj.leave_request_id,
            applicantId: adj.applicant_id,
            applicantName: adj.applicant_name,
          });
        }
      });
      
      // 6. 还需要查询该教师作为被代课人（请假人）的课程
      // 当教师请假时，他的课应该标记为被代课
      const { data: leaveAdjustments } = await client
        .from('course_adjustments')
        .select(`
          id,
          leave_request_id,
          applicant_id,
          applicant_name,
          adjust_type,
          class_id,
          class_name,
          grade,
          week_day,
          period_index,
          subject,
          substitute_employee_id,
          substitute_name,
          reason
        `)
        .gte('effective_week', weekStartDate)
        .lt('effective_week', weekEndStr)
        .eq('applicant_id', employeeId)
        .eq('status', 'completed');
      
      // 更新被代课的课程槽位
      (leaveAdjustments || []).forEach(adj => {
        // 找到对应的课程槽位
        const slotIndex = slots.findIndex(s => 
          s.classId === adj.class_id && 
          s.weekDay === adj.week_day && 
          s.periodIndex === adj.period_index
        );
        
        if (slotIndex >= 0) {
          // 更新槽位信息，标记为被代课
          const slot = slots[slotIndex];
          slots[slotIndex] = {
            ...slot,
            isAdjusted: true,
            adjustmentType: 'substitute',
            adjustmentId: adj.id,
            adjustmentReason: adj.reason,
            // 实际任课教师是代课人
            actualEmployeeId: adj.substitute_employee_id,
            actualTeacherName: adj.substitute_name,
            // 原教师信息
            originalTeacherName: slot.teacherName,
            originalEmployeeId: slot.employeeId,
            // 调课详情
            leaveRequestId: adj.leave_request_id,
            applicantId: adj.applicant_id,
            applicantName: adj.applicant_name,
          };
        }
      });
    }
    
    // 7. 获取周次信息
    const weekNumber = getWeekNumber(weekStartDate);
    
    return NextResponse.json(success({
      weekStartDate,
      weekEndDate: getWeekEndDate(weekStartDate),
      weekNumber,
      slots,
      adjustments: adjustments || [],
    }));
    
  } catch (err) {
    console.error('获取本周课表失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

// 辅助函数：获取周次
function getWeekNumber(mondayDate: string): number {
  const startOfYear = new Date(new Date(mondayDate).getFullYear(), 0, 1);
  const monday = new Date(mondayDate);
  const days = Math.floor((monday.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

// 辅助函数：获取周五日期
function getWeekEndDate(mondayDate: string): string {
  const monday = new Date(mondayDate);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return friday.toISOString().split('T')[0];
}
