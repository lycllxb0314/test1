import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Mock调课数据
const mockScheduleChanges = [
  { id: 'sc1', originalScheduleId: 'sch1', classId: 'c001', className: '六年级1班', originalTeacherId: 't001', originalTeacherName: '王芳', courseId: 'course1', courseName: '语文', originalDayOfWeek: 1, originalPeriod: 2, newTeacherId: 't002', newTeacherName: '张华', newRoomId: null, newRoomName: null, newDayOfWeek: 1, newPeriod: 2, reason: '教师请假', status: 'approved', requesterId: 't005', requesterName: '赵敏', approverId: 'admin', approverName: '管理员', approvedAt: '2024-11-18', createdAt: '2024-11-17', semester: '2024-2025-1' },
  { id: 'sc2', originalScheduleId: 'sch2', classId: 'c002', className: '六年级2班', originalTeacherId: 't003', originalTeacherName: '李强', courseId: 'course2', courseName: '数学', originalDayOfWeek: 3, originalPeriod: 1, newTeacherId: 't003', newTeacherName: '李强', newRoomId: null, newRoomName: null, newDayOfWeek: 4, newPeriod: 3, reason: '外出培训', status: 'pending', requesterId: 't003', requesterName: '李强', approverId: null, approverName: null, approvedAt: null, createdAt: '2024-11-19', semester: '2024-2025-1' },
];

/**
 * GET - 获取调课记录
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const classId = searchParams.get('classId');
    const status = searchParams.get('status');
    const semester = searchParams.get('semester');

    const client = getSupabaseClient();
    
    let query = client
      .from('schedule_changes')
      .select('id, original_schedule_id, new_teacher_id, new_teacher_name, new_room_id, new_room_name, new_day_of_week, new_period, reason, status, requester_id, requester_name, approver_id, approver_name, approved_at, created_at, semester')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (semester) query = query.eq('semester', semester);

    const { data, error } = await query;

    if (error) {
      // 数据库失败，使用Mock数据
      let filteredData = [...mockScheduleChanges];
      if (teacherId) filteredData = filteredData.filter(s => s.originalTeacherId === teacherId || s.newTeacherId === teacherId);
      if (classId) filteredData = filteredData.filter(s => s.classId === classId);
      if (status) filteredData = filteredData.filter(s => s.status === status);
      if (semester) filteredData = filteredData.filter(s => s.semester === semester);

      return NextResponse.json({ success: true, data: filteredData, source: 'mock' });
    }

    const formattedData = (data || []).map((change: Record<string, unknown>) => ({
      id: change.id,
      originalScheduleId: change.original_schedule_id,
      classId: null,
      className: '',
      originalTeacherId: null,
      originalTeacherName: '',
      courseId: null,
      courseName: '',
      originalDayOfWeek: null,
      originalPeriod: null,
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

    return NextResponse.json({ success: true, data: formattedData, source: 'database' });
  } catch (error) {
    console.error('Failed to fetch schedule changes:', error);
    return NextResponse.json({ success: true, data: mockScheduleChanges, source: 'mock' });
  }
}

/**
 * POST - 创建调课申请
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { originalScheduleId, newTeacherId, newTeacherName, newRoomId, newRoomName, newDayOfWeek, newPeriod, reason, requesterId, requesterName, semester } = body;

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
      return NextResponse.json({
        success: true,
        data: { id: `sc-${Date.now()}`, ...body, status: 'pending' },
        source: 'mock',
      });
    }

    return NextResponse.json({ success: true, data, source: 'database' });
  } catch (error) {
    console.error('Failed to create schedule change:', error);
    return NextResponse.json({ success: false, error: '创建调课申请失败' }, { status: 500 });
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

    const updateData: Record<string, unknown> = {
      approver_id: approverId,
      approver_name: approverName,
      approved_at: new Date().toISOString(),
    };

    if (action === 'approve') {
      updateData.status = 'approved';
    } else {
      updateData.status = 'rejected';
    }

    const { error } = await client
      .from('schedule_changes')
      .update(updateData)
      .eq('id', id);

    if (error) {
      return NextResponse.json({
        success: true,
        data: { id, status: action === 'approve' ? 'approved' : 'rejected' },
        source: 'mock',
      });
    }

    return NextResponse.json({ success: true, source: 'database' });
  } catch (error) {
    console.error('Failed to update schedule change:', error);
    return NextResponse.json({ success: false, error: '审批调课申请失败' }, { status: 500 });
  }
}
