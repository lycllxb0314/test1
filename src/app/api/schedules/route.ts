import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取课表
 * 查询参数：
 * - classId: 班级ID
 * - teacherId: 教师ID
 * - semester: 学期
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const teacherId = searchParams.get('teacherId');
    const semester = searchParams.get('semester');

    // 构建查询
    let query = client
      .from('schedules')
      .select(`
        id,
        class_id,
        teacher_id,
        course_id,
        day_of_week,
        period,
        start_time,
        end_time,
        room_id,
        semester,
        week_start,
        week_end,
        is_single_week,
        is_double_week,
        status,
        courses (
          id,
          name,
          subject
        ),
        teachers (
          id,
          name
        ),
        classes (
          id,
          name,
          grade
        ),
        rooms (
          id,
          name,
          building
        )
      `)
      .order('day_of_week')
      .order('period');

    // 应用筛选条件
    if (classId) {
      query = query.eq('class_id', classId);
    }

    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }

    if (semester) {
      query = query.eq('semester', semester);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 格式化返回数据
    const formattedData = (data || []).map((schedule: any) => ({
      id: schedule.id,
      classId: schedule.class_id,
      className: schedule.classes?.name || '',
      grade: schedule.classes?.grade || 0,
      teacherId: schedule.teacher_id,
      teacherName: schedule.teachers?.name || '',
      courseId: schedule.course_id,
      courseName: schedule.courses?.name || '',
      subject: schedule.courses?.subject || '',
      dayOfWeek: schedule.day_of_week,
      period: schedule.period,
      startTime: schedule.start_time,
      endTime: schedule.end_time,
      roomId: schedule.room_id,
      roomName: schedule.rooms?.name || '',
      building: schedule.rooms?.building || '',
      semester: schedule.semester,
      weekStart: schedule.week_start,
      weekEnd: schedule.week_end,
      isSingleWeek: schedule.is_single_week,
      isDoubleWeek: schedule.is_double_week,
      status: schedule.status,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Failed to fetch schedules:', error);
    return NextResponse.json({
      success: false,
      error: '获取课表失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建课表项
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      classId,
      teacherId,
      courseId,
      dayOfWeek,
      period,
      startTime,
      endTime,
      roomId,
      semester,
      weekStart,
      weekEnd,
      isSingleWeek,
      isDoubleWeek,
    } = body;

    const { data, error } = await client
      .from('schedules')
      .insert({
        class_id: classId,
        teacher_id: teacherId,
        course_id: courseId,
        day_of_week: dayOfWeek,
        period,
        start_time: startTime,
        end_time: endTime,
        room_id: roomId,
        semester,
        week_start: weekStart,
        week_end: weekEnd,
        is_single_week: isSingleWeek ?? true,
        is_double_week: isDoubleWeek ?? true,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to create schedule:', error);
    return NextResponse.json({
      success: false,
      error: '创建课表项失败',
    }, { status: 500 });
  }
}

/**
 * PUT - 更新课表项
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { id, ...updates } = body;

    const updateData: any = {};
    if (updates.teacherId !== undefined) updateData.teacher_id = updates.teacherId;
    if (updates.courseId !== undefined) updateData.course_id = updates.courseId;
    if (updates.dayOfWeek !== undefined) updateData.day_of_week = updates.dayOfWeek;
    if (updates.period !== undefined) updateData.period = updates.period;
    if (updates.startTime !== undefined) updateData.start_time = updates.startTime;
    if (updates.endTime !== undefined) updateData.end_time = updates.endTime;
    if (updates.roomId !== undefined) updateData.room_id = updates.roomId;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { data, error } = await client
      .from('schedules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to update schedule:', error);
    return NextResponse.json({
      success: false,
      error: '更新课表项失败',
    }, { status: 500 });
  }
}
