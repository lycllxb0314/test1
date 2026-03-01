/**
 * 课表管理 API
 * 
 * 数据源：Supabase 数据库（唯一数据源）
 * v3.0: 移除Mock fallback，数据库失败时返回错误响应
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, parseQueryParams, ErrorCode } from '@/lib/api-route-utils';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取课表
 * 
 * 查询参数：
 * - classId: 班级ID
 * - teacherId: 教师ID
 * - semesterId: 学期ID
 */
const handleGetSchedules = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const params = parseQueryParams(request);
  
  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('schedule_slots')
      .select('*')
      .order('week_day')
      .order('period_index');

    if (params.classId) query = query.eq('class_id', params.classId);
    if (params.teacherId) query = query.eq('teacher_id', params.teacherId);
    if (params.semesterId) query = query.eq('semester_id', params.semesterId);

    const { data, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json(
        error('数据库查询失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    const formattedData = (data || []).map((slot: Record<string, unknown>) => ({
      id: slot.id,
      classId: slot.class_id,
      className: slot.class_name,
      grade: slot.grade,
      teacherId: slot.teacher_id,
      teacherName: slot.teacher_name,
      courseId: slot.course_id,
      courseName: slot.course_name,
      subject: slot.subject,
      weekDay: slot.week_day,
      periodIndex: slot.period_index,
      periodName: slot.period_name,
      startTime: slot.start_time,
      endTime: slot.end_time,
      classroomId: slot.classroom_id,
      classroomName: slot.classroom_name,
      status: slot.status,
      semesterId: slot.semester_id,
    }));

    return NextResponse.json(success(formattedData));
  } catch (err) {
    console.error('Failed to fetch schedules:', err);
    return NextResponse.json(
      error('获取课表失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
};

/**
 * POST - 创建课表项
 */
const handleCreateSchedule = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { 
      classId, className, grade, 
      teacherId, teacherName, 
      courseId, courseName, subject,
      weekDay, periodIndex, periodName,
      startTime, endTime,
      classroomId, classroomName,
      semesterId 
    } = body;

    if (!classId || !teacherId || !weekDay || !periodIndex) {
      return NextResponse.json(
        error('缺少必要参数', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    const { data, error: dbError } = await client
      .from('schedule_slots')
      .insert({
        class_id: classId,
        class_name: className,
        grade,
        teacher_id: teacherId,
        teacher_name: teacherName,
        course_id: courseId,
        course_name: courseName,
        subject,
        week_day: weekDay,
        period_index: periodIndex,
        period_name: periodName,
        start_time: startTime,
        end_time: endTime,
        classroom_id: classroomId,
        classroom_name: classroomName,
        semester_id: semesterId,
        status: 'normal',
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        error('创建课表项失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success({
      id: data.id,
      classId: data.class_id,
      teacherId: data.teacher_id,
      weekDay: data.week_day,
      periodIndex: data.period_index,
    }));
  } catch (err) {
    console.error('Failed to create schedule:', err);
    return NextResponse.json(
      error('创建课表项失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
};

// 导出受保护的路由处理器
export const GET = protectedRoute(handleGetSchedules, { 
  module: 'academic', 
  permission: 'view',
  optional: true,
});

export const POST = protectedRoute(handleCreateSchedule, { 
  module: 'academic', 
  permission: 'edit' 
});
