/**
 * 教室预约 API
 * 
 * GET - 获取预约列表
 * POST - 创建新预约（同时创建审批实例和发送通知）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 计算时间冲突
 */
function hasTimeConflict(
  existingBookings: Array<{
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    status: string;
    booking_date: string;
  }>,
  newBooking: { bookingDate: string; startTime: string; endTime: string; roomId: string }
): { hasConflict: boolean; conflictWith?: { bookingId: string; title: string; time: string } } {
  const newStart = new Date(`${newBooking.bookingDate}T${newBooking.startTime}`);
  const newEnd = new Date(`${newBooking.bookingDate}T${newBooking.endTime}`);
  
  for (const booking of existingBookings) {
    if (booking.status === 'rejected' || booking.status === 'cancelled') continue;
    
    const existStart = new Date(`${booking.booking_date}T${booking.start_time}`);
    const existEnd = new Date(`${booking.booking_date}T${booking.end_time}`);
    
    // 检查时间重叠
    if (newStart < existEnd && newEnd > existStart) {
      return {
        hasConflict: true,
        conflictWith: {
          bookingId: booking.id,
          title: booking.title,
          time: `${booking.start_time}-${booking.end_time}`,
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
      purposeDetail,
      title,
      description,
      bookingDate,
      startTime,
      endTime,
      expectedAttendees,
      attendeeType,
      requiredFacilities,
      cleaningRequired,
      applicantId,
      applicantName,
      applicantRole,
      department,
    } = body;
    
    // 验证必填字段
    if (!roomId || !roomName || !purpose || !title || !bookingDate || !startTime || !endTime || !expectedAttendees) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      );
    }
    
    // 计算时长
    const start = new Date(`${bookingDate}T${startTime}`);
    const end = new Date(`${bookingDate}T${endTime}`);
    const duration = Math.round((end.getTime() - start.getTime()) / 60000);
    
    if (duration <= 0) {
      return NextResponse.json(
        { success: false, error: '结束时间必须晚于开始时间' },
        { status: 400 }
      );
    }
    
    // 检查时间冲突
    const { data: existingBookings } = await client
      .from('room_bookings')
      .select('id, title, start_time, end_time, status, booking_date')
      .eq('room_id', roomId)
      .eq('booking_date', bookingDate)
      .in('status', ['pending', 'approved', 'in_progress']);
    
    const conflict = hasTimeConflict(existingBookings || [], {
      bookingDate,
      startTime,
      endTime,
      roomId,
    });
    
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
        purpose_detail: purposeDetail,
        title,
        description,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        duration,
        expected_attendees: expectedAttendees,
        attendee_type: attendeeType,
        required_facilities: requiredFacilities,
        cleaning_required: cleaningRequired || false,
        status: 'pending',
        conflict_with: conflict.hasConflict ? conflict.conflictWith : null,
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
    // 教室预约需要教务处审批
    const approvalInstanceId = crypto.randomUUID();
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
          start_time: startTime,
          end_time: endTime,
          duration,
          expected_attendees: expectedAttendees,
          description,
        },
      });
    
    if (approvalError) {
      console.error('创建审批实例失败:', approvalError);
      // 审批实例创建失败不影响预约创建，但记录日志
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
          approver_ids: [], // 教务处任何成员都可以审批
          approved_by: [],
        });
      
      // ==================== 发送通知到教务处部门工作台 ====================
      const notificationId = crypto.randomUUID();
      const notificationTitle = `【教室预约】${applicantName || '教师'}申请预约${roomName}`;
      const notificationContent = `
预约详情：
- 教室：${roomName}（${building}）
- 时间：${bookingDate} ${startTime}-${endTime}
- 用途：${purposeMap[purpose] || purpose}
- 预约人：${applicantName || '未知'}
- 预期人数：${expectedAttendees}人
${description ? `- 说明：${description}` : ''}

请及时处理审批。
      `.trim();
      
      await client
        .from('messages')
        .insert({
          id: notificationId,
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
