import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * POST - 审批预约
 * 请求体：
 * - action: 'approve' | 'reject'
 * - comment: 审批意见
 * - approverId: 审批人ID
 * - approverName: 审批人姓名
 * - approverRole: 审批人角色
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    const { action, comment, approverId, approverName, approverRole } = body;

    // 1. 获取预约详情
    const { data: booking, error: bookingError } = await client
      .from('room_bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({
        success: false,
        error: '预约不存在',
      }, { status: 404 });
    }

    // 2. 检查状态
    if (booking.status !== 'pending') {
      return NextResponse.json({
        success: false,
        error: '该预约已处理',
      }, { status: 400 });
    }

    // 3. 更新预约状态
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (action === 'reject') {
      updateData.reject_reason = comment;
    }

    const { data, error } = await client
      .from('room_bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    // 4. 记录审批操作
    await client
      .from('booking_approval_records')
      .insert({
        booking_id: id,
        approver_id: approverId,
        approver_name: approverName,
        approver_role: approverRole,
        action,
        comment,
        created_at: new Date().toISOString(),
      });

    // 5. 如果审批通过且需要保洁，创建保洁请求
    if (action === 'approve' && booking.cleaning_required) {
      await client
        .from('room_maintenance_records')
        .insert({
          room_id: booking.room_id,
          room_name: booking.room_name,
          type: 'cleaning',
          description: `预约活动保洁：${booking.title}`,
          status: 'scheduled',
          booking_id: id,
          scheduled_date: booking.booking_date,
          created_at: new Date().toISOString(),
        });

      // 更新预约的保洁请求状态
      await client
        .from('room_bookings')
        .update({ cleaning_requested: true })
        .eq('id', id);
    }

    return NextResponse.json({
      success: true,
      data,
      message: action === 'approve' ? '预约已批准' : '预约已驳回',
    });
  } catch (error) {
    console.error('Failed to approve booking:', error);
    return NextResponse.json({
      success: false,
      error: '审批操作失败',
    }, { status: 500 });
  }
}
