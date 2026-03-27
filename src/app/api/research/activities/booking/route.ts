/**
 * 教研活动专用教室预约 API
 * 
 * POST - 创建教室预约（直接批准，无需审核）
 * 
 * 与普通教室预约不同，教务处创建的教研活动直接批准预约，不走审核流程
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { success, error, ErrorCode } from '@/lib/api';

const supabase = getSupabaseClient();

// 时段标签映射
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

// 时段时间映射
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
 * 检查时段冲突
 */
function hasSlotsConflict(
  existingBookings: Array<{
    id: string;
    title: string;
    time_slots: string[] | null;
    status: string;
  }>,
  newTimeSlots: string[]
): { hasConflict: boolean; conflicts: string[] } {
  const conflicts: string[] = [];
  
  for (const booking of existingBookings) {
    if (['rejected', 'cancelled'].includes(booking.status)) continue;
    
    const existingSlots: string[] = booking.time_slots || [];
    
    for (const newSlot of newTimeSlots) {
      if (existingSlots.includes(newSlot)) {
        conflicts.push(slotLabelMap[newSlot] || newSlot);
      }
    }
  }
  
  return { hasConflict: conflicts.length > 0, conflicts };
}

/**
 * POST - 创建教室预约（直接批准）
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    
    const {
      roomId,
      roomName,
      bookingDate,
      timeSlots,
      title,
      purpose,
      expectedAttendees,
      description,
    } = body;
    
    // 验证必填字段
    if (!roomId || !bookingDate || !timeSlots || timeSlots.length === 0) {
      return NextResponse.json(error('缺少必要参数', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    
    // 获取教室信息
    const { data: room } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();
    
    if (!room) {
      return NextResponse.json(error('教室不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    // 检查时段冲突
    const { data: existingBookings } = await supabase
      .from('room_bookings')
      .select('id, title, time_slots, status')
      .eq('room_id', roomId)
      .eq('booking_date', bookingDate)
      .in('status', ['pending', 'approved', 'in_progress']);
    
    const conflictResult = hasSlotsConflict(existingBookings || [], timeSlots);
    
    if (conflictResult.hasConflict) {
      return NextResponse.json(
        error(`以下时段已被预约：${conflictResult.conflicts.join('、')}`),
        { status: 400 }
      );
    }
    
    // 计算时间
    const firstSlot = slotTimeMap[timeSlots[0]] || { start: '08:00', end: '08:45' };
    const lastSlot = slotTimeMap[timeSlots[timeSlots.length - 1]] || { start: '08:00', end: '08:45' };
    const duration = 45 * timeSlots.length;
    
    // 创建预约（直接批准）
    const bookingId = `research-booking-${Date.now()}`;
    
    const { data: booking, error: dbError } = await supabase
      .from('room_bookings')
      .insert({
        id: bookingId,
        room_id: roomId,
        room_name: roomName || room.name,
        room_type: room.type,
        building: room.building,
        location: room.location,
        applicant_id: user.id,
        applicant_name: user.name,
        applicant_role: 'teacher',
        department: '教务处',
        purpose: purpose || 'meeting',
        title: title,
        description: description || '',
        booking_date: bookingDate,
        start_time: firstSlot.start,
        end_time: lastSlot.end,
        time_slot: timeSlots[0],
        time_slots: timeSlots,
        duration: duration,
        expected_attendees: expectedAttendees || 20,
        attendee_type: 'teachers',
        cleaning_required: false,
        status: 'approved', // 直接批准！
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        approved_by_name: user.name,
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('创建预约失败:', dbError);
      return NextResponse.json(error('创建预约失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 更新教室使用统计
    await supabase
      .from('rooms')
      .update({
        usage_stats: {
          totalBookings: (room.usage_stats?.totalBookings || 0) + 1,
          thisMonth: (room.usage_stats?.thisMonth || 0) + 1,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', roomId);
    
    return NextResponse.json(success({
      id: booking.id,
      roomId: booking.room_id,
      roomName: booking.room_name,
      bookingDate: booking.booking_date,
      timeSlots: booking.time_slots,
      status: booking.status,
    }));
    
  } catch (err) {
    console.error('创建教研活动预约失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
