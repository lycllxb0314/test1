/**
 * 单个预约 API
 * 
 * GET - 获取预约详情
 * PUT - 更新预约（审批/取消等）
 * DELETE - 删除预约
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取预约详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    
    const { data, error: dbError } = await client
      .from('room_bookings')
      .select('*')
      .eq('id', id)
      .single();
    
    if (dbError) {
      return NextResponse.json(
        { success: false, error: '预约不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('获取预约详情失败:', err);
    return NextResponse.json(
      { success: false, error: '获取预约详情失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT - 更新预约
 * 支持操作：
 * - approve: 批准预约
 * - reject: 拒绝预约
 * - cancel: 取消预约
 * - complete: 完成预约
 * - update: 更新信息
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    const { action, ...updateData } = body;
    
    // 先获取当前预约信息
    const { data: currentBooking, error: fetchError } = await client
      .from('room_bookings')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !currentBooking) {
      return NextResponse.json(
        { success: false, error: '预约不存在' },
        { status: 404 }
      );
    }
    
    let newStatus = currentBooking.status;
    let additionalUpdate: Record<string, unknown> = {};
    
    switch (action) {
      case 'approve':
        newStatus = 'approved';
        // 更新教室状态为reserved
        await client
          .from('rooms')
          .update({ status: 'reserved', updated_at: new Date().toISOString() })
          .eq('id', currentBooking.room_id);
        break;
        
      case 'reject':
        newStatus = 'rejected';
        additionalUpdate = {
          reject_reason: body.reason || '',
        };
        break;
        
      case 'cancel':
        newStatus = 'cancelled';
        additionalUpdate = {
          cancelled_at: new Date().toISOString(),
          cancelled_by: body.cancelledBy || null,
          cancelled_by_name: body.cancelledByName || null,
          cancel_reason: body.reason || '',
        };
        break;
        
      case 'complete':
        newStatus = 'completed';
        additionalUpdate = {
          actual_start_time: body.actualStartTime,
          actual_end_time: body.actualEndTime,
          actual_attendees: body.actualAttendees,
          usage_report: body.usageReport,
        };
        // 更新教室状态为available
        await client
          .from('rooms')
          .update({ status: 'available', updated_at: new Date().toISOString() })
          .eq('id', currentBooking.room_id);
        // 更新使用统计
        const { data: roomData } = await client
          .from('rooms')
          .select('usage_stats')
          .eq('id', currentBooking.room_id)
          .single();
        if (roomData) {
          const stats = roomData.usage_stats || { totalBookings: 0, thisMonth: 0 };
          await client
            .from('rooms')
            .update({
              usage_stats: {
                totalBookings: (stats.totalBookings || 0) + 1,
                thisMonth: (stats.thisMonth || 0) + 1,
                lastUsedAt: new Date().toISOString(),
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', currentBooking.room_id);
        }
        break;
        
      case 'update':
        // 普通更新，只更新传入的字段
        const allowedFields: Record<string, string> = {
          title: 'title',
          description: 'description',
          purpose: 'purpose',
          purposeDetail: 'purpose_detail',
          expectedAttendees: 'expected_attendees',
          attendeeType: 'attendee_type',
          requiredFacilities: 'required_facilities',
          cleaningRequired: 'cleaning_required',
          startTime: 'start_time',
          endTime: 'end_time',
        };
        Object.entries(allowedFields).forEach(([field, dbField]) => {
          if (body[field] !== undefined) {
            additionalUpdate[dbField] = body[field];
          }
        });
        // 重新计算时长
        if (body.startTime && body.endTime) {
          const start = new Date(`${currentBooking.booking_date}T${body.startTime}`);
          const end = new Date(`${currentBooking.booking_date}T${body.endTime}`);
          additionalUpdate.duration = Math.round((end.getTime() - start.getTime()) / 60000);
        }
        break;
        
      default:
        // 如果没有指定action，执行普通更新
        newStatus = body.status || currentBooking.status;
    }
    
    const finalUpdate = {
      ...additionalUpdate,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    
    const { data, error: dbError } = await client
      .from('room_bookings')
      .update(finalUpdate)
      .eq('id', id)
      .select()
      .single();
    
    if (dbError) {
      console.error('更新预约失败:', dbError);
      return NextResponse.json(
        { success: false, error: '更新预约失败: ' + dbError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('更新预约失败:', err);
    return NextResponse.json(
      { success: false, error: '更新预约失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - 删除预约
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    
    // 只能删除已取消或已拒绝的预约
    const { data: booking } = await client
      .from('room_bookings')
      .select('status')
      .eq('id', id)
      .single();
    
    if (booking && !['cancelled', 'rejected'].includes(booking.status)) {
      return NextResponse.json(
        { success: false, error: '只能删除已取消或已拒绝的预约' },
        { status: 400 }
      );
    }
    
    const { error: dbError } = await client
      .from('room_bookings')
      .delete()
      .eq('id', id);
    
    if (dbError) {
      console.error('删除预约失败:', dbError);
      return NextResponse.json(
        { success: false, error: '删除预约失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: { id } });
  } catch (err) {
    console.error('删除预约失败:', err);
    return NextResponse.json(
      { success: false, error: '删除预约失败' },
      { status: 500 }
    );
  }
}
