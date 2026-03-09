/**
 * 教室预约 API
 * 
 * GET - 获取预约列表
 * POST - 创建新预约
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
    
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('创建预约失败:', err);
    return NextResponse.json(
      { success: false, error: '创建预约失败' },
      { status: 500 }
    );
  }
}
