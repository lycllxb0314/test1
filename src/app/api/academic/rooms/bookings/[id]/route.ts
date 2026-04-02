/**
 * 单个预订操作 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { roomBookingService } from '@/services/academic.service';
import { approvalRepository } from '@/repositories/approval.repository';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取单个预订详情
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少预订ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await roomBookingService.getList({ roomId: id });
    
    if (!result.success || !result.data || result.data.length === 0) {
      return NextResponse.json(error('预订不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: result.data[0] });
  } catch (err) {
    console.error('获取预订详情失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * PUT - 更新预订（支持取消操作）
 */
export const PUT = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    const user = context.user;
    
    if (!id) {
      return NextResponse.json(error('缺少预订ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    
    // 处理取消操作
    if (body.action === 'cancel') {
      const client = getSupabaseClient();
      
      // 获取预订详情，验证权限
      const { data: booking, error: bookingError } = await client
        .from('room_bookings')
        .select('*')
        .eq('id', id)
        .single();
      
      if (bookingError || !booking) {
        return NextResponse.json(error('预订不存在', ErrorCode.NOT_FOUND), { status: 404 });
      }
      
      // 验证是否是申请人本人
      if (booking.applicant_id !== user.id) {
        return NextResponse.json(error('只能取消自己的预约', ErrorCode.FORBIDDEN), { status: 403 });
      }
      
      // 检查状态，只有 pending 状态才能取消
      if (booking.status !== 'pending') {
        return NextResponse.json(error('该预约已处理，无法取消', ErrorCode.VALIDATION_ERROR), { status: 400 });
      }
      
      const now = new Date().toISOString();
      
      // 更新预约状态
      await client
        .from('room_bookings')
        .update({
          status: 'cancelled',
          cancelled_at: now,
          cancelled_by: user.id,
          cancelled_by_name: user.name,
          cancel_reason: body.reason || '申请人主动取消',
          updated_at: now,
        })
        .eq('id', id);
      
      // 更新关联的审批实例状态
      await client
        .from('approval_instances')
        .update({
          status: 'cancelled',
          finish_at: now,
          updated_at: now,
        })
        .eq('business_id', id)
        .eq('business_type', 'room_booking');
      
      return NextResponse.json({ success: true, message: '预约已取消' });
    }
    
    // 处理重新提交操作
    if (body.action === 'resubmit') {
      const client = getSupabaseClient();
      
      // 获取预订详情，验证权限
      const { data: booking, error: bookingError } = await client
        .from('room_bookings')
        .select('*')
        .eq('id', id)
        .single();
      
      if (bookingError || !booking) {
        return NextResponse.json(error('预订不存在', ErrorCode.NOT_FOUND), { status: 404 });
      }
      
      // 验证是否是申请人本人
      if (booking.applicant_id !== user.id) {
        return NextResponse.json(error('只能修改自己的预约', ErrorCode.FORBIDDEN), { status: 403 });
      }
      
      // 检查状态，只有 returned 状态才能重新提交
      if (booking.status !== 'returned') {
        return NextResponse.json(error('该预约不在待修改状态', ErrorCode.VALIDATION_ERROR), { status: 400 });
      }
      
      const now = new Date().toISOString();
      
      // 更新预约状态和信息
      const updatedTitle = body.title || booking.title;
      const updatedPurpose = body.purpose || booking.purpose;
      const updatedDescription = body.description ?? booking.description;
      const updatedExpectedAttendees = body.expectedAttendees || booking.expected_attendees;
      
      const updateData: Record<string, unknown> = {
        status: 'pending',
        purpose: updatedPurpose,
        title: updatedTitle,
        description: updatedDescription,
        expected_attendees: updatedExpectedAttendees,
        updated_at: now,
        resubmitted_at: now,
      };
      
      await client
        .from('room_bookings')
        .update(updateData)
        .eq('id', id);
      
      // 获取审批实例
      const { data: instance } = await client
        .from('approval_instances')
        .select('id')
        .eq('business_id', id)
        .eq('business_type', 'room_booking')
        .single();
      
      const instanceId = instance?.id;
      
      if (instanceId) {
        // 更新关联的审批实例状态
        await client
          .from('approval_instances')
          .update({
            status: 'pending',
            current_node_order: 2, // 当前在审批节点（第2个节点）
            finish_at: null, // 重置完成时间
            updated_at: now,
          })
          .eq('id', instanceId);
        
        // 重置审批节点记录 - 审批节点设为 pending
        await client
          .from('approval_node_records')
          .update({
            status: 'pending',
            approved_by: [],
            final_approver_id: null,
            final_approver_name: null,
            action: null,
            comment: null,
            updated_at: now,
          })
          .eq('instance_id', instanceId)
          .eq('node_order', 2);
        
        // 更新提交节点为已重新提交
        await client
          .from('approval_node_records')
          .update({
            status: 'approved',
            approved_by: [{ userId: user.id, userName: user.name || '', action: 'resubmitted', time: now }],
            comment: '已修改并重新提交',
            updated_at: now,
          })
          .eq('instance_id', instanceId)
          .eq('node_order', 1);
        
        // 发送通知给教务处（部门广播）
        await client.from('messages').insert({
          id: crypto.randomUUID(),
          title: `【预约待审批】${updatedTitle}`,
          content: `${user.name || '教师'}修改后重新提交了教室预约申请，请及时审批。预约日期：${booking.booking_date}，教室：${booking.room_name || '待定'}`,
          type: 'approval',
          priority: 'high',
          sender_id: user.id,
          sender_name: user.name,
          recipient_id: user.id, // 占位符
          recipient_type: 'department',
          metadata: {
            instance_id: instanceId,
            business_type: 'room_booking',
            business_id: id,
            target_department: 'academic',
          },
        });
      }
      
      return NextResponse.json({ success: true, message: '预约已重新提交' });
    }
    
    // 默认更新操作
    const result = await roomBookingService.update(id, body);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '更新预订失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('更新预订API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * DELETE - 取消预订
 */
export const DELETE = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少预订ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await roomBookingService.delete(id);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '取消预订失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: '预订已取消' });
  } catch (err) {
    console.error('取消预订API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
