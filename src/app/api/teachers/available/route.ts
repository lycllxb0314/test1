/**
 * 可用教师查询 API
 * 
 * 查询某时段无课的教师（用于代课安排）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

/**
 * GET - 获取某时段可用的教师
 * 
 * Query params:
 * - subject: 科目（可选，用于筛选同科目教师）
 * - weekDay: 星期几 (1-5)
 * - periodIndex: 第几节 (0-5)
 * - weekStartDate: 周一日期
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const subject = searchParams.get('subject');
    const weekDay = parseInt(searchParams.get('weekDay') || '1');
    const periodIndex = parseInt(searchParams.get('periodIndex') || '0');
    const weekStartDate = searchParams.get('weekStartDate');
    
    // 1. 获取所有教师
    let teacherQuery = client
      .from('teachers')
      .select('id, name, primary_subject, employee_id')
      .eq('status', 'active');
    
    if (subject) {
      // 优先显示同科目教师
      teacherQuery = teacherQuery.order('primary_subject', { ascending: false });
    }
    
    const { data: teachers, error: teacherError } = await teacherQuery;
    
    if (teacherError) {
      console.error('获取教师列表失败:', teacherError);
      return NextResponse.json(error('获取教师列表失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 2. 获取基准课表中该时段有课的教师
    const { data: busySlots } = await client
      .from('schedule_slots')
      .select('employee_id')
      .eq('week_day', weekDay)
      .eq('period_index', periodIndex);
    
    const busyEmployeeIds = new Set((busySlots || []).map(s => s.employee_id));
    
    // 3. 获取本周调课中该时段被安排代课的教师
    if (weekStartDate) {
      const { data: adjustments } = await client
        .from('course_adjustments')
        .select('substitute_employee_id')
        .eq('effective_week', weekStartDate)
        .eq('week_day', weekDay)
        .eq('period_index', periodIndex)
        .eq('status', 'completed');
      
      (adjustments || []).forEach(adj => {
        if (adj.substitute_employee_id) {
          busyEmployeeIds.add(adj.substitute_employee_id);
        }
      });
    }
    
    // 4. 筛选可用教师
    const availableTeachers = (teachers || [])
      .filter(t => !busyEmployeeIds.has(t.employee_id))
      .map(t => ({
        employeeId: t.employee_id,
        name: t.name,
        subject: t.primary_subject,
        isSameSubject: t.primary_subject === subject,
      }))
      .sort((a, b) => {
        // 同科目优先
        if (a.isSameSubject && !b.isSameSubject) return -1;
        if (!a.isSameSubject && b.isSameSubject) return 1;
        return a.name.localeCompare(b.name);
      });
    
    return NextResponse.json(success(availableTeachers, 'database'));
    
  } catch (err) {
    console.error('获取可用教师失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
