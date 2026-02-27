import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取调课记录
 * 查询参数：
 * - teacherId: 教师ID
 * - classId: 班级ID
 * - status: 状态
 * - semester: 学期
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const classId = searchParams.get('classId');
    const status = searchParams.get('status');
    const semester = searchParams.get('semester');

    // 构建查询
    let query = client
      .from('schedule_changes')
      .select(`
        id,
        original_schedule_id,
        new_teacher_id,
        new_teacher_name,
        new_room_id,
        new_room_name,
        new_day_of_week,
        new_period,
        reason,
        status,
        requester_id,
        requester_name,
        approver_id,
        approver_name,
        approved_at,
        created_at,
        semester,
        original_schedule:schedules!original_schedule_id (
          id,
          class_id,
          teacher_id,
          course_id,
          day_of_week,
          period,
          classes (id, name),
          courses (id, name),
          teachers (id, name)
        ),
        new_room:rooms!new_room_id (
          id,
          name,
          building
        )
      `)
      .order('created_at', { ascending: false });

    // 应用筛选条件
    if (teacherId) {
      query = query.or(`original_schedule.teacher_id.eq.${teacherId},new_teacher_id.eq.${teacherId}`);
    }

    if (classId) {
      query = query.eq('original_schedule.class_id', classId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (semester) {
      query = query.eq('semester', semester);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 格式化返回数据
    const formattedData = (data || []).map((change: any) => ({
      id: change.id,
      originalScheduleId: change.original_schedule_id,
      classId: change.original_schedule?.class_id,
      className: change.original_schedule?.classes?.name || '',
      originalTeacherId: change.original_schedule?.teacher_id,
      originalTeacherName: change.original_schedule?.teachers?.name || '',
      courseId: change.original_schedule?.course_id,
      courseName: change.original_schedule?.courses?.name || '',
      originalDayOfWeek: change.original_schedule?.day_of_week,
      originalPeriod: change.original_schedule?.period,
      newTeacherId: change.new_teacher_id,
      newTeacherName: change.new_teacher_name,
      newRoomId: change.new_room_id,
      newRoomName: change.new_room_name,
      newDayOfWeek: change.new_day_of_week,
      newPeriod: change.new_period,
      reason: change.reason,
      status: change.status,
      requesterId: change.requester_id,
      requesterName: change.requester_name,
      approverId: change.approver_id,
      approverName: change.approver_name,
      approvedAt: change.approved_at,
      createdAt: change.created_at,
      semester: change.semester,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Failed to fetch schedule changes:', error);
    return NextResponse.json({
      success: false,
      error: '获取调课记录失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建调课申请
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      originalScheduleId,
      newTeacherId,
      newTeacherName,
      newRoomId,
      newRoomName,
      newDayOfWeek,
      newPeriod,
      reason,
      requesterId,
      requesterName,
      semester,
    } = body;

    const { data, error } = await client
      .from('schedule_changes')
      .insert({
        original_schedule_id: originalScheduleId,
        new_teacher_id: newTeacherId,
        new_teacher_name: newTeacherName,
        new_room_id: newRoomId,
        new_room_name: newRoomName,
        new_day_of_week: newDayOfWeek,
        new_period: newPeriod,
        reason,
        status: 'pending',
        requester_id: requesterId,
        requester_name: requesterName,
        semester,
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
    console.error('Failed to create schedule change:', error);
    return NextResponse.json({
      success: false,
      error: '创建调课申请失败',
    }, { status: 500 });
  }
}

/**
 * PUT - 审批调课申请
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { id, action, approverId, approverName } = body;

    const updateData: any = {
      approver_id: approverId,
      approver_name: approverName,
      approved_at: new Date().toISOString(),
    };

    if (action === 'approve') {
      updateData.status = 'approved';
      
      // 获取调课详情
      const { data: change } = await client
        .from('schedule_changes')
        .select('original_schedule_id, new_teacher_id, new_room_id, new_day_of_week, new_period')
        .eq('id', id)
        .single();

      if (change) {
        // 更新原课表
        await client
          .from('schedules')
          .update({
            teacher_id: change.new_teacher_id,
            room_id: change.new_room_id,
            day_of_week: change.new_day_of_week,
            period: change.new_period,
          })
          .eq('id', change.original_schedule_id);
      }
    } else if (action === 'reject') {
      updateData.status = 'rejected';
    }

    const { data, error } = await client
      .from('schedule_changes')
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
    console.error('Failed to update schedule change:', error);
    return NextResponse.json({
      success: false,
      error: '审批调课申请失败',
    }, { status: 500 });
  }
}
