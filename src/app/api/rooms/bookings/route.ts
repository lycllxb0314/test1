import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 类型定义
interface RoomRow {
  id: string;
  name: string;
  code: string;
  type: string;
  building: string | null;
  location: string | null;
}

interface RoomBookingRow {
  id: string;
  room_id: string;
  applicant_id: string;
  applicant_name: string;
  purpose: string;
  start_time: string;
  end_time: string;
  status: string;
  attendees_count: number | null;
  facilities_needed: string[] | null;
  notes: string | null;
  approver_id: string | null;
  approver_name: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  rooms: RoomRow[] | null; // Supabase 嵌套查询返回数组
}

interface FormattedBooking {
  id: string;
  roomId: string;
  roomName: string;
  roomCode: string;
  roomType: string;
  building: string;
  location: string;
  applicantId: string;
  applicantName: string;
  purpose: string;
  startTime: string;
  endTime: string;
  status: string;
  attendeesCount: number | null;
  facilitiesNeeded: string[] | null;
  notes: string | null;
  approverId: string | null;
  approverName: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

interface BookingUpdateData {
  approver_id: string;
  approver_name: string;
  approved_at: string;
  status?: string;
  rejection_reason?: string;
}

/**
 * GET - 获取教室预约列表
 * 查询参数：
 * - roomId: 教室ID
 * - applicantId: 申请人ID
 * - status: 状态
 * - startDate: 开始日期
 * - endDate: 结束日期
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const applicantId = searchParams.get('applicantId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 构建查询
    let query = client
      .from('room_bookings')
      .select(`
        id,
        room_id,
        applicant_id,
        applicant_name,
        purpose,
        start_time,
        end_time,
        status,
        attendees_count,
        facilities_needed,
        notes,
        approver_id,
        approver_name,
        approved_at,
        rejection_reason,
        created_at,
        rooms (
          id,
          name,
          code,
          type,
          building,
          location
        )
      `)
      .order('start_time', { ascending: true });

    // 应用筛选条件
    if (roomId) {
      query = query.eq('room_id', roomId);
    }

    if (applicantId) {
      query = query.eq('applicant_id', applicantId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('start_time', startDate);
    }

    if (endDate) {
      query = query.lte('end_time', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 格式化返回数据
    const formattedData: FormattedBooking[] = (data || []).map((booking: RoomBookingRow) => {
      const room = booking.rooms?.[0]; // Supabase 嵌套查询返回数组
      return {
        id: booking.id,
        roomId: booking.room_id,
        roomName: room?.name || '',
        roomCode: room?.code || '',
        roomType: room?.type || '',
        building: room?.building || '',
        location: room?.location || '',
        applicantId: booking.applicant_id,
        applicantName: booking.applicant_name,
        purpose: booking.purpose,
        startTime: booking.start_time,
        endTime: booking.end_time,
        status: booking.status,
        attendeesCount: booking.attendees_count,
        facilitiesNeeded: booking.facilities_needed || [],
        notes: booking.notes,
        approverId: booking.approver_id,
        approverName: booking.approver_name,
        approvedAt: booking.approved_at,
        rejectionReason: booking.rejection_reason,
        createdAt: booking.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Failed to fetch room bookings:', error);
    return NextResponse.json({
      success: false,
      error: '获取教室预约列表失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建教室预约
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      roomId,
      applicantId,
      applicantName,
      purpose,
      startTime,
      endTime,
      attendeesCount,
      facilitiesNeeded,
      notes,
    } = body;

    // 检查时间冲突
    const { data: conflicts } = await client
      .from('room_bookings')
      .select('id')
      .eq('room_id', roomId)
      .neq('status', 'rejected')
      .or(`start_time.lt.${endTime},end_time.gt.${startTime}`);

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({
        success: false,
        error: '该时间段已有预约，请选择其他时间',
      }, { status: 400 });
    }

    const { data, error } = await client
      .from('room_bookings')
      .insert({
        room_id: roomId,
        applicant_id: applicantId,
        applicant_name: applicantName,
        purpose,
        start_time: startTime,
        end_time: endTime,
        status: 'pending',
        attendees_count: attendeesCount,
        facilities_needed: facilitiesNeeded || [],
        notes,
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
    console.error('Failed to create room booking:', error);
    return NextResponse.json({
      success: false,
      error: '创建教室预约失败',
    }, { status: 500 });
  }
}

/**
 * PUT - 更新教室预约状态（审批）
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { id, action, approverId, approverName, rejectionReason } = body;

    const updateData: BookingUpdateData = {
      approver_id: approverId,
      approver_name: approverName,
      approved_at: new Date().toISOString(),
    };

    if (action === 'approve') {
      updateData.status = 'approved';
    } else if (action === 'reject') {
      updateData.status = 'rejected';
      updateData.rejection_reason = rejectionReason;
    } else if (action === 'cancel') {
      updateData.status = 'cancelled';
    }

    const { data, error } = await client
      .from('room_bookings')
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
    console.error('Failed to update room booking:', error);
    return NextResponse.json({
      success: false,
      error: '更新教室预约失败',
    }, { status: 500 });
  }
}
