/**
 * 撤销请假申请 API
 * 
 * 仅限申请人撤销自己的请假申请
 * 只能撤销 pending 状态的申请
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

/**
 * POST - 撤销请假申请
 */
export const POST = protectedRoute(async (
  request: NextRequest, 
  context: ExtendedRouteContext
) => {
  try {
    const client = getSupabaseClient();
    const params = await context.params;
    
    if (!params?.id) {
      return NextResponse.json(error('缺少请假申请ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const leaveRequestId = params.id;
    const { user } = context;

    // 获取请假申请
    const { data: leaveRequest, error: fetchError } = await client
      .from('leave_requests')
      .select('*')
      .eq('id', leaveRequestId)
      .single();

    if (fetchError || !leaveRequest) {
      return NextResponse.json(error('请假申请不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }

    // 检查是否为申请人
    if (leaveRequest.applicant_id !== user.employeeId) {
      return NextResponse.json(error('只能撤销自己的请假申请', ErrorCode.FORBIDDEN), { status: 403 });
    }

    // 检查状态
    if (leaveRequest.status !== 'pending') {
      return NextResponse.json(error('该请假申请已处理，无法撤销', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }

    const now = new Date().toISOString();

    // 更新状态为已撤销
    const { error: updateError } = await client
      .from('leave_requests')
      .update({
        status: 'cancelled',
        updated_at: now,
      })
      .eq('id', leaveRequestId);

    if (updateError) {
      console.error('撤销失败:', updateError);
      return NextResponse.json(error('撤销失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }

    // 删除相关的调课记录
    await client
      .from('course_adjustments')
      .delete()
      .eq('leave_request_id', leaveRequestId);

    // 通知已选的审批人
    const approverSelection = leaveRequest.approver_selection || [];
    if (approverSelection.length > 0) {
      const notifications = approverSelection.map((approver: any) => ({
        title: `【已撤销】请假申请`,
        content: `${leaveRequest.applicant_name}已撤销${leaveRequest.type}申请（${leaveRequest.start_date}至${leaveRequest.end_date}）。`,
        event: 'leave_approval',
        priority: 'normal',
        sender_id: user.employeeId,
        sender_name: user.name,
        sender_role: user.role,
        recipient_id: approver.employeeId,
        metadata: { 
          leaveRequestId, 
          action: 'cancelled' 
        },
      }));

      await client.from('messages').insert(notifications);
    }

    return NextResponse.json(success({ status: 'cancelled' }, 'database'));

  } catch (err) {
    console.error('撤销失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
