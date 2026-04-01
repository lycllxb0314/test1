/**
 * 周课表 API
 * 
 * GET: 获取周课表
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用 protectedRoute 进行认证保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取周课表
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId') || undefined;
  const teacherId = searchParams.get('teacherId') || undefined;
  const employeeId = searchParams.get('employeeId') || undefined;
  const grade = searchParams.get('grade') ? parseInt(searchParams.get('grade')!) : undefined;
  const weekStartDate = searchParams.get('weekStartDate') || undefined;

  if (!classId && !teacherId && !employeeId && !grade) {
    return NextResponse.json(
      error('需要提供班级ID、教师ID或工号', ErrorCode.VALIDATION_ERROR),
      { status: 400 }
    );
  }

  try {
    const client = getSupabaseClient();
    
    // 查询 schedule_slots 表
    let query = client
      .from('schedule_slots')
      .select('*')
      .eq('status', 'active');
    
    if (classId) {
      query = query.eq('class_id', classId);
    }
    if (employeeId) {
      query = query.eq('teacher_id', employeeId);
    } else if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }
    if (grade) {
      query = query.eq('grade', grade);
    }

    const { data, error: dbError } = await query.order('week_day').order('period_index');

    if (dbError) {
      console.error('[schedule/weekly] query error:', dbError);
      return NextResponse.json(
        error('获取周课表失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    // 格式化返回数据，匹配前端期望的字段名
    const formattedSlots = (data || []).map((slot) => ({
      slotId: slot.id,
      classId: slot.class_id,
      className: slot.class_name,
      grade: slot.grade,
      weekDay: slot.week_day,
      periodIndex: slot.period_index,
      subject: slot.subject,
      teacherId: slot.teacher_id,
      teacherName: slot.teacher_name,
      employeeId: slot.teacher_id, // employeeId 与 teacher_id 相同
      isAdjusted: false,
      actualTeacherName: slot.teacher_name,
      actualEmployeeId: slot.teacher_id,
    }));

    return NextResponse.json(success({ slots: formattedSlots }));
  } catch (err) {
    console.error('[schedule/weekly] error:', err);
    return NextResponse.json(
      error('获取周课表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});
