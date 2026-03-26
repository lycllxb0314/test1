/**
 * 审批操作 API
 * 
 * PUT: 执行审批操作（通过/驳回/退回）
 */

import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { ok, fail, serverError, unauthorized, notFound, forbidden } from '@/lib/api-utils';
import { ApprovalActionRequest } from '@/types/approval';

/**
 * 执行审批操作
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const user = await getUserFromSession(request);
    if (!user) {
      return unauthorized('未登录，请先登录');
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
      return notFound('审批实例不存在');
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
      return fail('未找到待审批的节点');
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

    console.log('[Approval Action] Permission check:', { 
      approverIds, 
      approvedUserIds, 
      currentUserId: user.id,
      isEmptyApproverIds: approverIds.length === 0
    });

    // 教室预约审批特殊处理：approver_ids 为空时，任何部门成员都可以审批
    const isRoomBooking = instance.business_type === 'room_booking';
    const canApprove = approverIds.length === 0 
      ? isRoomBooking  // 教室预约且审批人为空，任何人都可审批
      : approverIds.includes(user.id);  // 否则需要在审批人列表中

    if (!canApprove) {
      return forbidden('您没有权限审批此申请');
    }

    if (approvedUserIds.includes(user.id)) {
      return fail('您已经审批过了');
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
        return forbidden('只有申请人可以撤回');
      }
      await handleWithdraw(instance, now);
    }

    return ok({ message: getActionMessage(action) });

  } catch (error) {
    console.error('Approval action error:', error);
    return serverError(error instanceof Error ? error.message : '审批操作失败');
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
  console.log('=== moveToNextNode 开始 ===');
  console.log('instance.id:', instance.id);
  console.log('instance.current_node_order:', instance.current_node_order);
  
  // 获取下一个节点
  const { data: nextNode, error: nextNodeError } = await supabase
    .from('approval_node_records')
    .select('*')
    .eq('instance_id', instance.id)
    .gt('node_order', instance.current_node_order)
    .order('node_order', { ascending: true })
    .limit(1)
    .single();

  console.log('nextNode query result:', { nextNode, error: nextNodeError });

  if (nextNode) {
    // 还有下一个节点
    console.log('有下一个节点:', nextNode.node_order);
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
    console.log('没有下一个节点，调用 completeApproval');
    await completeApproval(instance, now);
  }
}

/**
 * 完成审批
 */
async function completeApproval(instance: any, now: string) {
  const supabase = getSupabaseClient();
  
  console.log('=== completeApproval 开始 ===');
  console.log('instance.business_type:', instance.business_type);
  console.log('instance.business_id:', instance.business_id);
  console.log('instance.metadata:', JSON.stringify(instance.metadata, null, 2));
  
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
    // 检查是否需要调课
    const needAdjustment = instance.metadata?.needAdjustment || instance.metadata?.need_adjustment;
    const affectedSlots = instance.metadata?.affectedSlots || instance.metadata?.affected_slots || [];
    
    console.log('needAdjustment:', needAdjustment);
    console.log('affectedSlots:', JSON.stringify(affectedSlots, null, 2));
    console.log('affectedSlots.length:', affectedSlots.length);
    
    // 更新请假申请状态
    const updateData: any = {
      status: 'approved',
      approved_at: now,
      updated_at: now,
      current_step: 2, // 进入调课阶段
    };
    
    // 如果需要调课，设置调课状态
    if (needAdjustment && affectedSlots.length > 0) {
      updateData.adjustment_status = 'pending';
    }
    
    await supabase
      .from('leave_requests')
      .update(updateData)
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
    
    // 如果需要调课，创建调课记录并通知年段长
    if (needAdjustment && affectedSlots.length > 0) {
      console.log('调用 createCourseAdjustmentsAndNotify...');
      await createCourseAdjustmentsAndNotify(instance, supabase);
    } else {
      console.log('不需要调课，跳过创建调课记录');
    }
  } else if (instance.business_type === 'room_booking') {
    // 教室预约审批通过
    await supabase
      .from('room_bookings')
      .update({
        status: 'approved',
        updated_at: now,
      })
      .eq('id', instance.business_id);

    // 发送通知给申请人
    await supabase.from('messages').insert({
      id: crypto.randomUUID(),
      title: `【审批通过】${instance.title}`,
      content: `您的教室预约申请已通过。\n\n预约详情：\n- 教室：${instance.metadata?.room_name || '未知'}\n- 时间：${instance.metadata?.booking_date || ''} ${instance.metadata?.start_time || ''}-${instance.metadata?.end_time || ''}\n- 用途：${instance.metadata?.purpose || '未知'}`,
      type: 'approval',
      priority: 'high',
      recipient_id: instance.applicant_id,
      is_read: false,
      metadata: { instance_id: instance.id, booking_id: instance.business_id },
    });
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
  } else if (instance.business_type === 'room_booking') {
    // 教室预约驳回
    await supabase
      .from('room_bookings')
      .update({
        status: 'rejected',
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
  const content = instance.business_type === 'room_booking' 
    ? `您的教室预约申请已被驳回。原因：${approval.comment || '无'}`
    : `您的审批申请已被驳回。原因：${approval.comment || '无'}`;
    
  await supabase.from('messages').insert({
    id: crypto.randomUUID(),
    title: `【审批驳回】${instance.title}`,
    content,
    type: 'approval',
    priority: 'high',
    recipient_id: instance.applicant_id,
    is_read: false,
    metadata: { instance_id: instance.id, booking_id: instance.business_id },
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
 * 创建调课记录并通知年段长
 */
async function createCourseAdjustmentsAndNotify(instance: any, supabase: any) {
  console.log('=== createCourseAdjustmentsAndNotify 开始 ===');
  console.log('instance.business_id:', instance.business_id);
  
  try {
    // 1. 获取请假申请详情
    console.log('查询请假申请...');
    const { data: leaveRequest, error: leaveError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', instance.business_id)
      .single();

    if (leaveError || !leaveRequest) {
      console.error('获取请假申请失败:', leaveError);
      return;
    }
    
    console.log('请假申请获取成功:', leaveRequest.id, leaveRequest.applicant_name);
    console.log('affected_slots:', JSON.stringify(leaveRequest.affected_slots, null, 2));

    // 2. 检查是否已有调课记录
    const { data: existingAdjustments } = await supabase
      .from('course_adjustments')
      .select('id')
      .eq('leave_request_id', instance.business_id);

    if (existingAdjustments && existingAdjustments.length > 0) {
      console.log('调课记录已存在，跳过创建');
      return;
    }

    // 3. 解析调课信息
    const affectedSlots = leaveRequest.affected_slots || [];
    if (affectedSlots.length === 0) {
      console.log('没有需要调课的课程');
      return;
    }

    // 4. 创建调课记录
    console.log('准备创建调课记录，数量:', affectedSlots.length);
    const adjustmentRecords = affectedSlots.map((slot: any) => ({
      id: crypto.randomUUID(),
      leave_request_id: instance.business_id,
      applicant_id: leaveRequest.applicant_id,
      applicant_name: leaveRequest.applicant_name,
      adjust_type: 'substitute',
      original_slot: {
        teacherId: slot.teacherId,
        teacherName: slot.teacherName || leaveRequest.applicant_name,
        employeeId: slot.employeeId || leaveRequest.applicant_id,
      },
      status: 'pending',
      effective_week: slot.weekStartDate || leaveRequest.start_date,
      class_id: slot.classId,
      class_name: slot.className,
      grade: slot.grade || leaveRequest.applicant_grade,
      week_day: slot.weekDay,
      period_index: slot.periodIndex,
      subject: slot.subject,
      reason: leaveRequest.reason,
      reason_type: mapLeaveTypeToReasonType(leaveRequest.type),
      created_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from('course_adjustments')
      .insert(adjustmentRecords);

    if (insertError) {
      console.error('创建调课记录失败:', insertError);
      return;
    }

    console.log('创建调课记录成功:', adjustmentRecords.length);

    // 5. 通知年段长
    // 获取年级（从第一个调课记录）
    const grade = affectedSlots[0]?.grade || leaveRequest.applicant_grade;
    console.log('准备通知年段长，年级:', grade, '类型:', typeof grade);
    
    if (grade) {
      // 查找负责该年级的年段长 - 使用更可靠的查询方式
      // 先查询所有年段长，然后在代码中过滤
      const { data: allGradeLeaders, error: queryError } = await supabase
        .from('users')
        .select('id, name, additional_roles, managed_grades')
        .not('additional_roles', 'is', null);

      console.log('查询用户结果:', { 
        count: allGradeLeaders?.length, 
        error: queryError,
        users: allGradeLeaders?.map((u: any) => ({ 
          name: u.name, 
          additional_roles: u.additional_roles,
          managed_grades: u.managed_grades 
        }))
      });

      // 手动过滤年段长
      const gradeLeaders = (allGradeLeaders || []).filter((user: any) => {
        const hasGradeLeaderRole = Array.isArray(user.additional_roles) && 
          user.additional_roles.includes('grade_leader');
        const managesGrade = Array.isArray(user.managed_grades) && 
          user.managed_grades.some((g: any) => String(g) === String(grade));
        console.log(`用户 ${user.name}: hasGradeLeaderRole=${hasGradeLeaderRole}, managesGrade=${managesGrade}, managed_grades=${JSON.stringify(user.managed_grades)}`);
        return hasGradeLeaderRole && managesGrade;
      });

      console.log('过滤后的年段长:', gradeLeaders);

      if (gradeLeaders && gradeLeaders.length > 0) {
        const notifications = gradeLeaders.map((leader: any) => ({
          id: crypto.randomUUID(),
          title: `【调课待办】${instance.title}`,
          content: `${leaveRequest.applicant_name}因${leaveRequest.type}需要调课，请安排代课教师。

班级：${affectedSlots.map((s: any) => s.className).join('、')}
时间：${affectedSlots.map((s: any) => `周${['一', '二', '三', '四', '五', '六', '日'][s.weekDay - 1]} 第${s.periodIndex + 1}节`).join('、')}
科目：${affectedSlots.map((s: any) => s.subject).join('、')}
原因：${leaveRequest.reason}`,
          type: 'course_adjustment',
          priority: 'high',
          recipient_id: leader.id,
          recipient_type: 'individual',
          is_read: false,
          metadata: {
            instance_id: instance.id,
            leave_request_id: instance.business_id,
            grade: grade,
          },
          created_at: new Date().toISOString(),
        }));

        const { error: notifyError } = await supabase
          .from('messages')
          .insert(notifications);

        if (notifyError) {
          console.error('通知年段长失败:', notifyError);
        } else {
          console.log('通知年段长成功:', notifications.length);
        }
      }
    }
  } catch (error) {
    console.error('创建调课记录失败:', error);
  }
}

/**
 * 将中文请假类型映射为数据库约束允许的英文值
 */
function mapLeaveTypeToReasonType(leaveType: string): string {
  const typeMap: Record<string, string> = {
    '病假': 'leave',
    '事假': 'personal',
    '公假': 'training',
    '婚假': 'personal',
    '产假': 'leave',
    '丧假': 'personal',
  };
  return typeMap[leaveType] || 'other';
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
