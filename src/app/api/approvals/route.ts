/**
 * 审批实例 API
 * 
 * GET: 获取审批列表（我发起的/待我审批的）
 * POST: 提交新的审批申请
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { 
  ApprovalInstance, 
  ApprovalFlow, 
  ApprovalFlowNode,
  Announcement,
  SubmitApprovalRequest 
} from '@/types/approval';

/**
 * 获取审批列表
 * 
 * Query params:
 * - type: 'my' (我发起的) | 'pending' (待我审批的) | 'processed' (我已处理的)
 * - status: 筛选状态
 * - page: 页码
 * - pageSize: 每页数量
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'pending';
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('approval_instances')
      .select('*, node_records:approval_node_records(*)', { count: 'exact' });

    if (type === 'my') {
      // 我发起的
      query = query.eq('applicant_id', user.id);
    } else if (type === 'pending') {
      // 待我审批的 - 需要检查当前节点是否包含当前用户
      // 先获取所有进行中的实例
      const { data: instances, error } = await supabase
        .from('approval_instances')
        .select('*')
        .eq('status', 'in_progress');

      if (error) throw error;

      // 过滤出需要当前用户审批的实例
      const pendingInstanceIds: string[] = [];
      
      for (const instance of instances || []) {
        // 获取当前节点的记录
        const { data: nodeRecord } = await supabase
          .from('approval_node_records')
          .select('*')
          .eq('instance_id', instance.id)
          .eq('node_order', instance.current_node_order)
          .eq('status', 'pending')
          .single();

        if (nodeRecord) {
          // 检查当前用户是否在审批人列表中且尚未审批
          const approverIds = nodeRecord.approver_ids || [];
          const approvedBy = nodeRecord.approved_by || [];
          const approvedUserIds = approvedBy.map((a: any) => a.user_id);
          
          if (approverIds.includes(user.id) && !approvedUserIds.includes(user.id)) {
            pendingInstanceIds.push(instance.id);
          }
        }
      }

      query = query.in('id', pendingInstanceIds.length > 0 ? pendingInstanceIds : ['00000000-0000-0000-0000-000000000000']);
    } else if (type === 'processed') {
      // 我已处理的 - 查找在 approved_by 中包含当前用户 ID 的记录
      const { data: records, error } = await supabase
        .from('approval_node_records')
        .select('instance_id')
        .contains('approved_by', [{ user_id: user.id }]);

      if (error) throw error;

      const instanceIds = [...new Set(records?.map((r: any) => r.instance_id) || [])];
      query = query.in('id', instanceIds.length > 0 ? instanceIds : ['00000000-0000-0000-0000-000000000000']);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // 排序和分页
    query = query.order('created_at', { ascending: false });
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // 获取关联的公告信息
    const announcements: Record<string, Announcement> = {};
    if (data && data.length > 0) {
      const businessIds = data.map((d: any) => d.business_id);
      const { data: announcementData } = await supabase
        .from('announcements')
        .select('*')
        .in('id', businessIds);

      announcementData?.forEach((a: any) => {
        announcements[a.id] = {
          id: a.id,
          title: a.title,
          summary: a.summary,
          content: a.content,
          type: a.type,
          category: a.category,
          mediaLevel: a.media_level,
          authorId: a.author_id,
          authorName: a.author_name,
          department: a.department,
          coverImage: a.cover_image,
          images: a.images || [],
          attachments: a.attachments || [],
          isExternal: a.is_external,
          publishStatus: a.publish_status,
          publishedAt: a.published_at,
          scheduledPublishAt: a.scheduled_publish_at,
          unpublishedAt: a.unpublished_at,
          autoUnpublish: a.auto_unpublish,
          autoUnpublishAt: a.auto_unpublish_at,
          externalId: a.external_id,
          status: a.status,
          viewCount: a.view_count,
          isPinned: a.is_pinned,
          pinOrder: a.pin_order,
          metadata: a.metadata,
          createdAt: a.created_at,
          updatedAt: a.updated_at,
        };
      });
    }

    const instances: ApprovalInstance[] = (data || []).map((item: any) => ({
      id: item.id,
      flowId: item.flow_id,
      flowName: item.flow_name,
      businessType: item.business_type,
      businessId: item.business_id,
      title: item.title,
      applicantId: item.applicant_id,
      applicantName: item.applicant_name,
      applicantDepartment: item.applicant_department,
      currentNodeOrder: item.current_node_order,
      status: item.status,
      submitAt: item.submit_at,
      finishAt: item.finish_at,
      metadata: item.metadata,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      nodeRecords: item.node_records?.map((nr: any) => ({
        id: nr.id,
        instanceId: nr.instance_id,
        nodeOrder: nr.node_order,
        nodeName: nr.node_name,
        nodeType: nr.node_type,
        status: nr.status,
        approverIds: nr.approver_ids || [],
        approvedBy: nr.approved_by || [],
        finalApproverId: nr.final_approver_id,
        finalApproverName: nr.final_approver_name,
        action: nr.action,
        comment: nr.comment,
        createdAt: nr.created_at,
        updatedAt: nr.updated_at,
        finishedAt: nr.finished_at,
      })),
      business: announcements[item.business_id],
    }));

    return NextResponse.json({
      success: true,
      data: instances,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });

  } catch (error) {
    console.error('Get approvals error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取审批列表失败',
    }, { status: 500 });
  }
}

/**
 * 提交审批申请
 * 
 * 支持三种类型：
 * - announcement: 校园公告 - 需审批，发布到学校主页
 * - news: 新闻动态 - 需审批，发布到学校主页
 * - internal_notice: 内部通知 - 无需审批，仅内部可见
 */
export async function POST(request: NextRequest) {
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

    const body: SubmitApprovalRequest = await request.json();
    const { 
      title, 
      summary,
      content, 
      type, 
      category,
      mediaLevel,
      department, 
      coverImage, 
      images,
      attachments,
      isExternal,
      scheduledPublishAt,
      autoUnpublish,
      autoUnpublishAt,
      isPinned,
      recipients,
      customFlow 
    } = body;

    // 1. 创建公告/新闻/通知
    const announcementId = crypto.randomUUID();
    
    // 确定初始状态
    let initialStatus = 'draft';
    let publishStatus = 'pending';
    
    // 内部通知不需要审批，直接发布
    if (type === 'internal_notice') {
      initialStatus = 'published';
      publishStatus = 'published';
    } else if (scheduledPublishAt) {
      // 定时发布
      initialStatus = 'approved';
      publishStatus = 'scheduled';
    }

    const { error: announcementError } = await supabase
      .from('announcements')
      .insert({
        id: announcementId,
        title,
        summary,
        content,
        type,
        category,
        media_level: mediaLevel,
        author_id: user.id,
        author_name: user.name,
        department,
        cover_image: coverImage,
        images: images || [],
        attachments: attachments || [],
        is_external: isExternal,
        status: initialStatus,
        publish_status: publishStatus,
        scheduled_publish_at: scheduledPublishAt,
        auto_unpublish: autoUnpublish || false,
        auto_unpublish_at: autoUnpublishAt,
        is_pinned: isPinned || false,
        recipients: recipients,
      });

    if (announcementError) throw announcementError;

    // 2. 内部通知：直接发送给指定接收者
    if (type === 'internal_notice') {
      await sendInternalNotification(supabase, announcementId, title, content, user.id, user.name, recipients);
      
      return NextResponse.json({
        success: true,
        data: {
          announcementId,
          status: 'published',
          message: '内部通知发布成功',
        },
      });
    }

    // 3. 获取审批流程
    const flowType = type === 'announcement' ? 'announcement_approval' : 'news_approval';
    
    // 检查是否需要审批（校长室不需要）
    const needsApproval = department !== 'principal_office';

    if (!needsApproval) {
      // 校长室直接发布
      const now = new Date().toISOString();
      await supabase
        .from('announcements')
        .update({ 
          status: scheduledPublishAt ? 'approved' : 'published', 
          publish_status: scheduledPublishAt ? 'scheduled' : 'published',
          published_at: scheduledPublishAt ? undefined : now,
        })
        .eq('id', announcementId);

      // 发送通知给相关人员
      await sendNotifications(user.id, title, summary || content, department);

      return NextResponse.json({
        success: true,
        data: {
          announcementId,
          status: scheduledPublishAt ? 'scheduled' : 'published',
          message: scheduledPublishAt ? '已设置定时发布' : '发布成功',
        },
      });
    }

    // 4. 获取审批流程
    const { data: flow, error: flowError } = await supabase
      .from('approval_flows')
      .select('*, nodes:approval_flow_nodes(*)')
      .eq('type', flowType)
      .eq('department', department)
      .eq('is_active', true)
      .single();

    if (flowError || !flow) {
      // 如果没有找到对应部门的流程，使用默认流程
      return NextResponse.json({
        success: false,
        error: '未找到对应的审批流程',
      }, { status: 400 });
    }

    // 4. 创建审批实例
    const instanceId = crypto.randomUUID();
    const { error: instanceError } = await supabase
      .from('approval_instances')
      .insert({
        id: instanceId,
        flow_id: flow.id,
        flow_name: flow.name,
        business_type: type,
        business_id: announcementId,
        title,
        applicant_id: user.id,
        applicant_name: user.name,
        applicant_department: department,
        current_node_order: 1,
        status: 'in_progress',
      });

    if (instanceError) throw instanceError;

    // 5. 创建审批节点记录
    const nodes = flow.nodes || [];
    const nodeRecords: any[] = [];

    for (const node of nodes) {
      // 根据自定义流程跳过某些节点
      if (customFlow?.skipDepartmentDirector && node.node_order === 2 && node.node_type === 'approve') {
        continue;
      }

      // 获取审批人ID列表
      let approverIds: string[] = [];
      if (node.approver_type === 'role') {
        // 根据角色查找用户
        const roles = node.approver_roles || [];
        const { data: roleUsers } = await supabase
          .from('users')
          .select('id')
          .in('role', roles);

        approverIds = roleUsers?.map((u: any) => u.id) || [];

        // 还需要检查兼任职务
        for (const role of roles) {
          const { data: additionalRoleUsers } = await supabase
            .from('users')
            .select('id')
            .contains('additional_roles', [role]);
          
          if (additionalRoleUsers) {
            approverIds.push(...additionalRoleUsers.map((u: any) => u.id));
          }
        }
      } else if (node.approver_type === 'user') {
        approverIds = node.approver_user_ids || [];
      }

      // 去重
      approverIds = [...new Set(approverIds)];

      nodeRecords.push({
        id: crypto.randomUUID(),
        instance_id: instanceId,
        node_order: node.node_order,
        node_name: node.node_name,
        node_type: node.node_type,
        status: node.node_type === 'submit' ? 'approved' : 'pending',
        approver_ids: approverIds,
        approved_by: node.node_type === 'submit' 
          ? [{ user_id: user.id, user_name: user.name, action: 'approved', time: new Date().toISOString() }]
          : [],
      });
    }

    if (nodeRecords.length > 0) {
      const { error: recordsError } = await supabase
        .from('approval_node_records')
        .insert(nodeRecords);

      if (recordsError) throw recordsError;
    }

    // 6. 更新当前节点（跳过提交节点）
    const firstApprovalNode = nodeRecords.find(n => n.node_type !== 'submit');
    if (firstApprovalNode) {
      await supabase
        .from('approval_instances')
        .update({ current_node_order: firstApprovalNode.node_order })
        .eq('id', instanceId);

      // 发送通知给审批人
      await sendApprovalNotification(instanceId, firstApprovalNode.approver_ids, title, user.name);
    }

    return NextResponse.json({
      success: true,
      data: {
        announcementId,
        instanceId,
        status: 'pending_approval',
        message: '已提交审批',
      },
    });

  } catch (error) {
    console.error('Submit approval error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '提交审批失败',
    }, { status: 500 });
  }
}

/**
 * 发送通知给相关人员
 */
async function sendNotifications(
  authorId: string, 
  title: string, 
  content: string, 
  department: string
) {
  const supabase = getSupabaseClient();
  // 根据部门确定通知范围
  // 这里简化处理，实际应该根据具体业务逻辑
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .neq('id', authorId);

  if (users && users.length > 0) {
    const messages = users.map((u: any) => ({
      id: crypto.randomUUID(),
      title: `【新公告】${title}`,
      content: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
      type: 'announcement',
      priority: 'high',
      sender_id: authorId,
      sender_name: department,
      recipient_id: u.id,
      is_read: false,
    }));

    await supabase.from('messages').insert(messages);
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
  if (approverIds.length === 0) return;

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
 * 发送内部通知
 */
async function sendInternalNotification(
  supabase: ReturnType<typeof getSupabaseClient>,
  announcementId: string,
  title: string,
  content: string,
  authorId: string,
  authorName: string,
  recipients?: SubmitApprovalRequest['recipients']
) {
  if (!recipients) return;

  let userIds: string[] = [];

  if (recipients.type === 'all') {
    // 发送给所有人
    const { data: users } = await supabase
      .from('users')
      .select('id');
    userIds = users?.map((u: any) => u.id) || [];
  } else if (recipients.type === 'role' && recipients.roles) {
    // 按角色发送
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .in('role', recipients.roles);
    userIds = users?.map((u: any) => u.id) || [];
  } else if (recipients.type === 'class' && recipients.classIds) {
    // 按班级发送（发送给学生和家长）
    const { data: students } = await supabase
      .from('students')
      .select('id, parent_id')
      .in('class_id', recipients.classIds);
    
    userIds = students?.flatMap((s: any) => [s.id, s.parent_id].filter(Boolean)) || [];
  } else if (recipients.type === 'individual' && recipients.userIds) {
    // 发送给指定用户
    userIds = recipients.userIds;
  } else if (recipients.type === 'group' && recipients.groupIds) {
    // 按群组发送
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .in('group_id', recipients.groupIds);
    userIds = members?.map((m: any) => m.user_id) || [];
  }

  // 去重
  userIds = [...new Set(userIds)];

  if (userIds.length === 0) return;

  // 创建消息
  const messages = userIds.map((userId: string) => ({
    id: crypto.randomUUID(),
    title: `【内部通知】${title}`,
    content: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
    type: 'internal_notice',
    priority: 'normal',
    sender_id: authorId,
    sender_name: authorName,
    recipient_id: userId,
    is_read: false,
    metadata: { announcement_id: announcementId },
  }));

  await supabase.from('messages').insert(messages);
}
