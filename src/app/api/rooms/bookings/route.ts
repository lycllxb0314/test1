import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取教室预约列表
 * 查询参数：
 * - page: 页码
 * - pageSize: 每页数量
 * - roomId: 教室ID
 * - applicantId: 申请人ID
 * - status: 预约状态
 * - date: 预约日期
 * - startDate: 开始日期
 * - endDate: 结束日期
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const roomId = searchParams.get('roomId');
    const applicantId = searchParams.get('applicantId');
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = client
      .from('room_bookings')
      .select('*', { count: 'exact' });

    if (roomId) {
      query = query.eq('room_id', roomId);
    }
    if (applicantId) {
      query = query.eq('applicant_id', applicantId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (date) {
      query = query.eq('booking_date', date);
    }
    if (startDate && endDate) {
      query = query.gte('booking_date', startDate);
      query = query.lte('booking_date', endDate);
    }

    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    query = query.order('booking_date', { ascending: true });
    query = query.order('start_time', { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        data: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
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
 * POST - 创建教室预约申请
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    // 1. 检查教室是否存在
    const { data: room, error: roomError } = await client
      .from('rooms')
      .select('*')
      .eq('id', body.room_id)
      .single();

    if (roomError || !room) {
      return NextResponse.json({
        success: false,
        error: '教室不存在',
      }, { status: 404 });
    }

    // 2. 检查教室是否可用
    if (room.status !== 'available') {
      return NextResponse.json({
        success: false,
        error: '该教室当前不可预约',
      }, { status: 400 });
    }

    // 3. 检查时间段冲突
    const { data: conflicts } = await client
      .from('room_bookings')
      .select('*')
      .eq('room_id', body.room_id)
      .eq('booking_date', body.booking_date)
      .neq('status', 'cancelled')
      .neq('status', 'rejected');

    const hasConflict = (conflicts || []).some(booking => {
      const existingStart = booking.start_time;
      const existingEnd = booking.end_time;
      const newStart = body.start_time;
      const newEnd = body.end_time;

      return (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      );
    });

    if (hasConflict) {
      return NextResponse.json({
        success: false,
        error: '该时间段已被预约',
      }, { status: 400 });
    }

    // 4. 计算时长
    const [startHour, startMin] = body.start_time.split(':').map(Number);
    const [endHour, endMin] = body.end_time.split(':').map(Number);
    const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    // 5. 创建预约
    const { data, error } = await client
      .from('room_bookings')
      .insert({
        ...body,
        room_name: room.name,
        room_type: room.type,
        building: room.building,
        location: room.location,
        duration,
        status: 'pending',
        current_step: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: '预约申请已提交',
    });
  } catch (error) {
    console.error('Failed to create room booking:', error);
    return NextResponse.json({
      success: false,
      error: '创建预约申请失败',
    }, { status: 500 });
  }
}
