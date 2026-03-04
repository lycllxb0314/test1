/**
 * 审批操作 API
 * 
 * PUT: 执行审批操作（通过/驳回/退回）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { ApprovalActionRequest } from '@/types/approval';

/**
 * 执行审批操作
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: '未登录，请先登录',
        code: 'AUTH_FAILED' 
      }, { status: 401 });
    }

    const body: ApprovalActionRequest = await request.json();
    const { instanceId, action, comment } = body;
    
    console.log('[Approval Action] Request:', { instanceId, action, comment, userId: user.id });

    // 1. 获取审批实例
    const { data: instance, error: instanceError } = await supabase
      .from('approval_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (instanceError) {
      console.error('[Approval Action] Instance error:', instanceError);
    }
    if (!instance) {
      return NextResponse.json({
        success: false,
        error: '审批实例不存在',
      }, { status: 404 });
    }
    
    console.log('[Approval Action] Instance found:', { 
      id: instance.id, 
      current_node_order: instance.current_node_order,
      business_type: instance.business_type 
    });

    // 2. 获取当前审批节点记录
    const { data: currentNodeRecord, error: nodeError } = await supabase
      .from('approval_node_records')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('node_order', instance.current_node_order)
      .eq('status', 'pending')
      .single();

    if (nodeError) {
      console.error('[Approval Action] Node record error:', nodeError);
    }
    if (!currentNodeRecord) {
      console.error('[Approval Action] No pending node found for instance:', instanceId, 'current_node_order:', instance.current_node_order);
      return NextResponse.json({
        success: false,
        error: '未找到待审批的节点',
        details: { instanceId, current_node_order: instance.current_node_order }
      }, { status: 400 });
    }
    
    console.log('[Approval Action] Node record found:', { 
      id: currentNodeRecord.id, 
      node_order: currentNodeRecord.node_order,
      approver_ids: currentNodeRecord.approver_ids 
    });

    // 3. 检查当前用户是否有权限审批
    const approverIds = currentNodeRecord.approver_ids || [];
    const approvedBy = currentNodeRecord.approved_by || [];
    const approvedUserIds = approvedBy.map((a: any) => a.userId || a.user_id);

    if (!approverIds.includes(user.id)) {
      return NextResponse.json({
        success: false,
        error: '您没有权限审批此申请',
      }, { status: 403 });
    }

    if (approvedUserIds.includes(user.id)) {
      return NextResponse.json({
        success: false,
        error: '您已经审批过了',
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newApproval = {
      userId: user.id,
      userName: user.name,
      action,
      comment,
      time: now,
    };

    // 4. 根据操作类型处理
    if (action === 'approve') {
      // 通过审批
      if (currentNodeRecord.node_type === 'or_sign') {
        // 或签：任一人通过即可
        await handleOrSignApprove(instance, currentNodeRecord, newApproval, now);
      } else if (currentNodeRecord.node_type === 'countersign') {
        // 会签：所有人都要通过
        await handleCountersignApprove(instance, currentNodeRecord, newApproval, now);
      } else {
        // 单人审批
        await handleSingleApprove(instance, currentNodeRecord, newApproval, now);
      }
    } else if (action === 'reject') {
      // 驳回 - 直接结束流程，退回申请人
      await handleReject(instance, currentNodeRecord, newApproval, now);
    } else if (action === 'return') {
      // 退回 - 直接退回申请人重新编辑
      await handleReturn(instance, currentNodeRecord, newApproval, now);
    } else if (action === 'withdraw') {
      // 撤回 - 只有申请人可以撤回
      if (instance.applicant_id !== user.id) {
        return NextResponse.json({
          success: false,
          error: '只有申请人可以撤回',
        }, { status: 403 });
      }
      await handleWithdraw(instance, now);
    }

    return NextResponse.json({
      success: true,
      message: getActionMessage(action),
    });

  } catch (error) {
    console.error('Approval action error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '审批操作失败',
    }, { status: 500 });
  }
}

/**
 * 或签审批通过
 */
async function handleOrSignApprove(
  instance: any,
  nodeRecord: any,
  approval: any,
  now: string
) {
  const supabase = getSupabaseClient();
  // 更新节点记录
  await supabase
    .from('approval_node_records')
    .update({
      status: 'approved',
      approved_by: [...nodeRecord.approved_by, approval],
      final_approver_id: approval.userId,
      final_approver_name: approval.userName,
      action: 'approved',
      comment: approval.comment,
      finished_at: now,
      updated_at: now,
    })
    .eq('id', nodeRecord.id);

  // 进入下一个节点或完成
  await moveToNextNode(instance, now);
}

/**
 * 会签审批通过
 */
async function handleCountersignApprove(
  instance: any,
  nodeRecord: any,
  approval: any,
  now: string
) {
  const supabase = getSupabaseClient();
  const newApprovedBy = [...nodeRecord.approved_by, approval];
  const allApproverIds = nodeRecord.approver_ids || [];
  
  // 检查是否所有人都已审批
  const approvedUserIds = newApprovedBy.map((a: any) => a.userId || a.user_id);
  const allApproved = allApproverIds.every((id: string) => approvedUserIds.includes(id));

  if (allApproved) {
    // 所有人都已通过
    await supabase
      .from('approval_node_records')
      .update({
        status: 'approved',
        approved_by: newApprovedBy,
        action: 'approved',
        finished_at: now,
        updated_at: now,
      })
      .eq('id', nodeRecord.id);

    // 进入下一个节点或完成
    await moveToNextNode(instance, now);
  } else {
    // 还有人未审批，只更新审批记录
    await supabase
      .from('approval_node_records')
      .update({
        approved_by: newApprovedBy,
        updated_at: now,
      })
      .eq('id', nodeRecord.id);
  }
}

/**
 * 单人审批通过
 */
async function handleSingleApprove(
  instance: any,
  nodeRecord: any,
  approval: any,
  now: string
) {
  const supabase = getSupabaseClient();
  // 更新节点记录
  await supabase
    .from('approval_node_records')
    .update({
      status: 'approved',
      approved_by: [...nodeRecord.approved_by, approval],
      action: 'approved',
      comment: approval.comment,
      finished_at: now,
      updated_at: now,
    })
    .eq('id', nodeRecord.id);

  // 进入下一个节点或完成
  await moveToNextNode(instance, now);
}

/**
 * 进入下一个节点或完成审批
 */
async function moveToNextNode(instance: any, now: string) {
  const supabase = getSupabaseClient();
  // 获取下一个节点
  const { data: nextNode } = await supabase
    .from('approval_node_records')
    .select('*')
    .eq('instance_id', instance.id)
    .gt('node_order', instance.current_node_order)
    .order('node_order', { ascending: true })
    .limit(1)
    .single();

  if (nextNode) {
    // 还有下一个节点
    await supabase
      .from('approval_instances')
      .update({
        current_node_order: nextNode.node_order,
        updated_at: now,
      })
      .eq('id', instance.id);

    // 发送通知给下一节点的审批人
    await sendApprovalNotification(instance.id, nextNode.approver_ids, instance.title, instance.applicant_name);
  } else {
    // 没有下一个节点，审批完成
    await completeApproval(instance, now);
  }
}

/**
 * 完成审批
 */
async function completeApproval(instance: any, now: string) {
  const supabase = getSupabaseClient();
  // 更新审批实例状态
  await supabase
    .from('approval_instances')
    .update({
      status: 'approved',
      finish_at: now,
      updated_at: now,
    })
    .eq('id', instance.id);

  // 根据业务类型更新对应表
  if (instance.business_type === 'leave_request') {
    // 更新请假申请状态
    await supabase
      .from('leave_requests')
      .update({
        status: 'approved',
        approved_at: now,
        updated_at: now,
      })
      .eq('id', instance.business_id);
    
    // 发送通知给申请人
    await supabase.from('messages').insert({
      id: crypto.randomUUID(),
      title: `【审批通过】${instance.title}`,
      content: '您的请假申请已通过。',
      type: 'approval',
      priority: 'high',
      recipient_id: instance.applicant_id,
      is_read: false,
      metadata: { instance_id: instance.id },
    });
    
    // TODO: 如果需要调课，通知年段长
  } else {
    // 默认处理公告类型
    await supabase
      .from('announcements')
      .update({
        status: 'published',
        publish_status: 'published',
        published_at: now,
      })
      .eq('id', instance.business_id);

    // 发送通知给申请人
    await supabase.from('messages').insert({
      id: crypto.randomUUID(),
      title: `【审批通过】${instance.title}`,
      content: '您的审批申请已通过，内容已发布。',
      type: 'approval',
      priority: 'high',
      recipient_id: instance.applicant_id,
      is_read: false,
      metadata: { instance_id: instance.id },
    });

    // TODO: 发布到外部学校主页
    // 这里需要调用外部API
  }
}

/**
 * 驳回审批
 */
async function handleReject(
  instance: any,
  nodeRecord: any,
  approval: any,
  now: string
) {
  const supabase = getSupabaseClient();
  // 更新节点记录
  await supabase
    .from('approval_node_records')
    .update({
      status: 'rejected',
      approved_by: [...nodeRecord.approved_by, approval],
      final_approver_id: approval.userId,
      final_approver_name: approval.userName,
      action: 'rejected',
      comment: approval.comment,
      finished_at: now,
      updated_at: now,
    })
    .eq('id', nodeRecord.id);

  // 更新审批实例状态
  await supabase
    .from('approval_instances')
    .update({
      status: 'rejected',
      finish_at: now,
      updated_at: now,
    })
    .eq('id', instance.id);

  // 根据业务类型更新对应表
  if (instance.business_type === 'leave_request') {
    // 更新请假申请状态
    await supabase
      .from('leave_requests')
      .update({
        status: 'rejected',
        rejected_at: now,
        reject_reason: approval.comment,
        updated_at: now,
      })
      .eq('id', instance.business_id);
  } else {
    // 默认处理公告类型
    await supabase
      .from('announcements')
      .update({
        status: 'rejected',
      })
      .eq('id', instance.business_id);
  }

  // 发送通知给申请人
  await supabase.from('messages').insert({
    id: crypto.randomUUID(),
    title: `【审批驳回】${instance.title}`,
    content: `您的审批申请已被驳回。原因：${approval.comment || '无'}`,
    type: 'approval',
    priority: 'high',
    recipient_id: instance.applicant_id,
    is_read: false,
    metadata: { instance_id: instance.id },
  });
}

/**
 * 退回审批
 */
async function handleReturn(
  instance: any,
  nodeRecord: any,
  approval: any,
  now: string
) {
  const supabase = getSupabaseClient();
  // 更新节点记录
  await supabase
    .from('approval_node_records')
    .update({
      status: 'rejected',
      approved_by: [...nodeRecord.approved_by, approval],
      action: 'returned',
      comment: approval.comment,
      finished_at: now,
      updated_at: now,
    })
    .eq('id', nodeRecord.id);

  // 更新审批实例状态
  await supabase
    .from('approval_instances')
    .update({
      status: 'returned',
      finish_at: now,
      updated_at: now,
    })
    .eq('id', instance.id);

  // 根据业务类型更新对应表
  if (instance.business_type === 'leave_request') {
    // 更新请假申请状态
    await supabase
      .from('leave_requests')
      .update({
        status: 'returned',
        returned_at: now,
        return_reason: approval.comment,
        updated_at: now,
      })
      .eq('id', instance.business_id);
  } else {
    // 默认处理公告类型
    await supabase
      .from('announcements')
      .update({
        status: 'draft',
      })
      .eq('id', instance.business_id);
  }

  // 发送通知给申请人
  await supabase.from('messages').insert({
    id: crypto.randomUUID(),
    title: `【审批退回】${instance.title}`,
    content: `您的审批申请已被退回。原因：${approval.comment || '无'}，请修改后重新提交。`,
    type: 'approval',
    priority: 'high',
    recipient_id: instance.applicant_id,
    is_read: false,
    metadata: { instance_id: instance.id },
  });
}

/**
 * 撤回审批
 */
async function handleWithdraw(instance: any, now: string) {
  const supabase = getSupabaseClient();
  // 更新审批实例状态
  await supabase
    .from('approval_instances')
    .update({
      status: 'withdrawn',
      finish_at: now,
      updated_at: now,
    })
    .eq('id', instance.id);

  // 根据业务类型更新对应表
  if (instance.business_type === 'leave_request') {
    // 更新请假申请状态
    await supabase
      .from('leave_requests')
      .update({
        status: 'cancelled',
        cancelled_at: now,
        updated_at: now,
      })
      .eq('id', instance.business_id);
  } else {
    // 默认处理公告类型
    await supabase
      .from('announcements')
      .update({
        status: 'draft',
      })
      .eq('id', instance.business_id);
  }
}

/**
 * 发送审批通知
 */
async function sendApprovalNotification(
  instanceId: string,
  approverIds: string[],
  title: string,
  applicantName: string
) {
  const supabase = getSupabaseClient();
  if (!approverIds || approverIds.length === 0) return;

  const messages = approverIds.map((userId: string) => ({
    id: crypto.randomUUID(),
    title: `【审批待办】${title}`,
    content: `${applicantName}提交的审批申请需要您审批`,
    type: 'approval',
    priority: 'high',
    recipient_id: userId,
    is_read: false,
    metadata: { instance_id: instanceId },
  }));

  await supabase.from('messages').insert(messages);
}

/**
 * 获取操作消息
 */
function getActionMessage(action: string): string {
  switch (action) {
    case 'approve':
      return '审批通过';
    case 'reject':
      return '已驳回';
    case 'return':
      return '已退回';
    case 'withdraw':
      return '已撤回';
    default:
      return '操作成功';
  }
}
