/**
 * 教室预约 API
 * 
 * GET - 获取预约列表
 * POST - 创建新预约（支持多时段）
 * 
 * 时段模式：使用 time_slots 数组字段（如 ['morning_1', 'morning_2']）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 检查时段冲突（支持多时段）
 */
function hasSlotsConflict(
  existingBookings: Array<{
    id: string;
    title: string;
    time_slot: string | null;
    time_slots: string[] | null;
    status: string;
    booking_date: string;
  }>,
  newBooking: { bookingDate: string; timeSlots: string[] }
): { hasConflict: boolean; conflicts: Array<{ bookingId: string; title: string; slot: string }> } {
  const conflicts: Array<{ bookingId: string; title: string; slot: string }> = [];
  
  for (const booking of existingBookings) {
    if (booking.status === 'rejected' || booking.status === 'cancelled') continue;
    
    // 获取已有预约的时段（兼容单时段和多时段）
    const existingSlots: string[] = booking.time_slots || 
      (booking.time_slot ? [booking.time_slot] : []);
    
    // 检查是否有交集
    for (const newSlot of newBooking.timeSlots) {
      if (existingSlots.includes(newSlot)) {
        conflicts.push({
          bookingId: booking.id,
          title: booking.title,
          slot: newSlot,
        });
      }
    }
  }
  
  return { hasConflict: conflicts.length > 0, conflicts };
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
 * 时段时间映射（默认开始和结束时间）
 */
const slotTimeMap: Record<string, { start: string; end: string }> = {
  morning_1: { start: '08:00', end: '08:45' },
  morning_2: { start: '08:55', end: '09:40' },
  morning_3: { start: '10:00', end: '10:45' },
  noon: { start: '12:00', end: '14:00' },
  afternoon_1: { start: '14:00', end: '14:45' },
  afternoon_2: { start: '14:55', end: '15:40' },
  afternoon_3: { start: '16:00', end: '16:45' },
  evening: { start: '19:00', end: '21:00' },
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
      // 使用包含查询检查时段是否在数组中
      query = query.contains('time_slots', [timeSlot]);
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
 * POST - 创建新预约（支持多时段）
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
      timeSlot,   // 兼容单时段
      timeSlots,  // 多时段数组
      expectedAttendees,
      attendeeType,
      cleaningRequired,
      applicantId,
      applicantName,
      applicantRole,
      department,
    } = body;
    
    // 统一时段数据（兼容单时段和多时段）
    const finalTimeSlots: string[] = timeSlots || (timeSlot ? [timeSlot] : []);
    
    // 验证必填字段
    if (!roomId || !roomName || !purpose || !title || !bookingDate || finalTimeSlots.length === 0 || !expectedAttendees) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      );
    }
    
    // 检查时段冲突
    const { data: existingBookings } = await client
      .from('room_bookings')
      .select('id, title, time_slot, time_slots, status, booking_date')
      .eq('room_id', roomId)
      .eq('booking_date', bookingDate)
      .in('status', ['pending', 'approved', 'in_progress']);
    
    const conflictResult = hasSlotsConflict(existingBookings || [], {
      bookingDate,
      timeSlots: finalTimeSlots,
    });
    
    if (conflictResult.hasConflict) {
      const conflictDetails = conflictResult.conflicts.map(c => 
        `${slotLabelMap[c.slot] || c.slot}（${c.title}）`
      ).join('、');
      return NextResponse.json(
        { success: false, error: `以下时段已被预约：${conflictDetails}` },
        { status: 400 }
      );
    }
    
    const bookingId = `booking-${Date.now()}`;
    
    // 根据时段计算开始和结束时间
    const firstSlot = slotTimeMap[finalTimeSlots[0]] || { start: '08:00', end: '08:45' };
    const lastSlot = slotTimeMap[finalTimeSlots[finalTimeSlots.length - 1]] || { start: '08:00', end: '08:45' };
    const startTime = firstSlot.start;
    const endTime = lastSlot.end;
    
    const { data, error: dbError } = await client
      .from('room_bookings')
      .insert({
        id: bookingId,
        room_id: roomId,
        room_name: roomName,
        room_type: roomType || 'classroom',
        building: building || '未知楼栋',
        location,
        applicant_id: applicantId || 'unknown',
        applicant_name: applicantName || '未知用户',
        applicant_role: applicantRole || 'teacher',
        department,
        purpose,
        title,
        description,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        time_slot: finalTimeSlots[0], // 保留单时段字段兼容
        time_slots: finalTimeSlots,   // 新增多时段数组
        duration: 45 * finalTimeSlots.length, // 根据时段数量计算时长
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
    const slotsLabel = finalTimeSlots.map(s => slotLabelMap[s] || s).join('、');
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
          time_slots: finalTimeSlots,
          time_slots_label: slotsLabel,
          expected_attendees: expectedAttendees,
          description,
        },
      });
    
    if (approvalError) {
      console.error('创建审批实例失败:', approvalError);
    } else {
      // 创建审批节点记录
      const nodeResult = await client
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
      
      if (nodeResult.error) {
        console.error('创建审批节点记录失败:', nodeResult.error);
      }
      
      // ==================== 发送通知到教务处部门工作台 ====================
      const notificationTitle = `【教室预约】${applicantName || '教师'}申请预约${roomName}`;
      const notificationContent = `
预约详情：
- 教室：${roomName}（${building || '未知楼栋'}）
- 时间：${bookingDate} ${slotsLabel}
- 用途：${purposeMap[purpose] || purpose}
- 预约人：${applicantName || '未知'}
- 预期人数：${expectedAttendees}人
${description ? `- 说明：${description}` : ''}

请及时处理审批。
      `.trim();
      
      const msgResult = await client
        .from('messages')
        .insert({
          id: crypto.randomUUID(),
          title: notificationTitle,
          content: notificationContent,
          type: 'room_booking_approval',
          priority: 'normal',
          sender_name: applicantName || '系统',
          recipient_type: 'department',
          metadata: {
            target_department: 'academic',
            approval_instance_id: approvalInstanceId,
            booking_id: bookingId,
          },
        });
      
      if (msgResult.error) {
        console.error('发送审批通知失败:', msgResult.error);
      }
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
