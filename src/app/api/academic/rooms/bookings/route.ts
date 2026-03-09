/**
 * 教室预约 API
 * 
 * GET - 获取预约列表
 * POST - 创建新预约（同时创建审批实例和发送通知）
 * 
 * 时段模式：使用 time_slot 字段（如 morning_1, afternoon_2 等）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 检查时段冲突
 */
function hasSlotConflict(
  existingBookings: Array<{
    id: string;
    title: string;
    time_slot: string;
    status: string;
    booking_date: string;
  }>,
  newBooking: { bookingDate: string; timeSlot: string }
): { hasConflict: boolean; conflictWith?: { bookingId: string; title: string } } {
  for (const booking of existingBookings) {
    if (booking.status === 'rejected' || booking.status === 'cancelled') continue;
    
    if (booking.booking_date === newBooking.bookingDate && booking.time_slot === newBooking.timeSlot) {
      return {
        hasConflict: true,
        conflictWith: {
          bookingId: booking.id,
          title: booking.title,
        },
      };
    }
  }
  
  return { hasConflict: false };
}

/**
 * 用途映射
 */
const purposeMap: Record<string, string> = {
  teaching: '教学活动',
  meeting: '教研会议',
  training: '培训讲座',
  activity: '学生活动',
  exam: '考试',
  defense: '答辩',
  competition: '比赛',
  other: '其他',
};

/**
 * 时段标签映射
 */
const slotLabelMap: Record<string, string> = {
  morning_1: '第1节',
  morning_2: '第2节',
  morning_3: '第3节',
  noon: '午休',
  afternoon_1: '第4节',
  afternoon_2: '第5节',
  afternoon_3: '第6节',
  evening: '晚上',
};

/**
 * GET - 获取预约列表
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const roomId = searchParams.get('roomId');
    const applicantId = searchParams.get('applicantId');
    const bookingDate = searchParams.get('bookingDate');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const purpose = searchParams.get('purpose');
    const search = searchParams.get('search');
    const timeSlot = searchParams.get('timeSlot');
    
    let query = client
      .from('room_bookings')
      .select('*')
      .order('created_at', { ascending: false });
    
    // 筛选条件
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (roomId) {
      query = query.eq('room_id', roomId);
    }
    if (applicantId) {
      query = query.eq('applicant_id', applicantId);
    }
    if (bookingDate) {
      query = query.eq('booking_date', bookingDate);
    }
    if (startDate) {
      query = query.gte('booking_date', startDate);
    }
    if (endDate) {
      query = query.lte('booking_date', endDate);
    }
    if (purpose && purpose !== 'all') {
      query = query.eq('purpose', purpose);
    }
    if (timeSlot) {
      query = query.eq('time_slot', timeSlot);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,applicant_name.ilike.%${search}%,room_name.ilike.%${search}%`);
    }
    
    const { data, error: dbError } = await query;
    
    if (dbError) {
      console.error('获取预约列表失败:', dbError);
      return NextResponse.json(
        { success: false, error: '获取预约列表失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('获取预约列表失败:', err);
    return NextResponse.json(
      { success: false, error: '获取预约列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST - 创建新预约
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    const {
      roomId,
      roomName,
      roomType,
      building,
      location,
      purpose,
      title,
      description,
      bookingDate,
      timeSlot,  // 课表时段
      expectedAttendees,
      attendeeType,
      cleaningRequired,
      applicantId,
      applicantName,
      applicantRole,
      department,
    } = body;
    
    // 验证必填字段
    if (!roomId || !roomName || !purpose || !title || !bookingDate || !timeSlot || !expectedAttendees) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      );
    }
    
    // 检查时段冲突
    const { data: existingBookings } = await client
      .from('room_bookings')
      .select('id, title, time_slot, status, booking_date')
      .eq('room_id', roomId)
      .eq('booking_date', bookingDate)
      .in('status', ['pending', 'approved', 'in_progress']);
    
    const conflict = hasSlotConflict(existingBookings || [], {
      bookingDate,
      timeSlot,
    });
    
    if (conflict.hasConflict) {
      return NextResponse.json(
        { success: false, error: `该时段已被预约：${conflict.conflictWith?.title}` },
        { status: 400 }
      );
    }
    
    const bookingId = `booking-${Date.now()}`;
    
    const { data, error: dbError } = await client
      .from('room_bookings')
      .insert({
        id: bookingId,
        room_id: roomId,
        room_name: roomName,
        room_type: roomType,
        building,
        location,
        applicant_id: applicantId || 'unknown',
        applicant_name: applicantName || '未知用户',
        applicant_role: applicantRole || 'teacher',
        department,
        purpose,
        title,
        description,
        booking_date: bookingDate,
        time_slot: timeSlot,
        duration: 45, // 默认时长，时段模式下不使用
        expected_attendees: expectedAttendees,
        attendee_type: attendeeType,
        cleaning_required: cleaningRequired || false,
        status: 'pending',
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('创建预约失败:', dbError);
      return NextResponse.json(
        { success: false, error: '创建预约失败: ' + dbError.message },
        { status: 500 }
      );
    }
    
    // ==================== 创建审批实例 ====================
    const approvalInstanceId = crypto.randomUUID();
    const slotLabel = slotLabelMap[timeSlot] || timeSlot;
    const approvalTitle = `教室预约审批：${title}`;
    
    // 创建审批实例
    const { error: approvalError } = await client
      .from('approval_instances')
      .insert({
        id: approvalInstanceId,
        business_type: 'room_booking',
        business_id: bookingId,
        title: approvalTitle,
        applicant_id: applicantId || null,
        applicant_name: applicantName || null,
        applicant_department: department || null,
        current_node_order: 1,
        status: 'pending',
        submit_at: new Date().toISOString(),
        metadata: {
          room_id: roomId,
          room_name: roomName,
          building,
          location,
          purpose,
          booking_date: bookingDate,
          time_slot: timeSlot,
          time_slot_label: slotLabel,
          expected_attendees: expectedAttendees,
          description,
        },
      });
    
    if (approvalError) {
      console.error('创建审批实例失败:', approvalError);
    } else {
      // 创建审批节点记录
      await client
        .from('approval_node_records')
        .insert({
          id: crypto.randomUUID(),
          instance_id: approvalInstanceId,
          node_order: 1,
          node_name: '教务处审批',
          node_type: 'approve',
          status: 'pending',
          approver_ids: [],
          approved_by: [],
        });
      
      // ==================== 发送通知到教务处部门工作台 ====================
      const notificationTitle = `【教室预约】${applicantName || '教师'}申请预约${roomName}`;
      const notificationContent = `
预约详情：
- 教室：${roomName}（${building}）
- 时间：${bookingDate} ${slotLabel}
- 用途：${purposeMap[purpose] || purpose}
- 预约人：${applicantName || '未知'}
- 预期人数：${expectedAttendees}人
${description ? `- 说明：${description}` : ''}

请及时处理审批。
      `.trim();
      
      await client
        .from('messages')
        .insert({
          id: crypto.randomUUID(),
          title: notificationTitle,
          content: notificationContent,
          type: 'room_booking_approval',
          priority: 'normal',
          sender_id: applicantId || null,
          sender_name: applicantName || '系统',
          recipient_type: 'department',
          metadata: {
            target_department: 'academic',
            approval_instance_id: approvalInstanceId,
            booking_id: bookingId,
          },
        });
    }
    
    return NextResponse.json({ 
      success: true, 
      data,
      approvalInstanceId,
    });
  } catch (err) {
    console.error('创建预约失败:', err);
    return NextResponse.json(
      { success: false, error: '创建预约失败' },
      { status: 500 }
    );
  }
}
