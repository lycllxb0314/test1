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

// ==================== 辅助函数 ====================

/** 映射公告数据 */
function mapAnnouncement(a: any): Announcement {
  return {
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
}

/** 映射节点记录 */
function mapNodeRecord(nr: any): any {
  return {
    id: nr.id,
    instanceId: nr.instance_id,
    nodeOrder: nr.node_order,
    nodeName: nr.node_name,
    nodeType: nr.node_type,
    status: nr.status,
    approverIds: nr.approver_ids || [],
    approvedBy: (nr.approved_by || []).map((a: any) => ({
      userId: a.userId || a.user_id,
      userName: a.userName || a.user_name,
      action: a.action,
      comment: a.comment,
      time: a.time,
    })),
    finalApproverId: nr.final_approver_id,
    finalApproverName: nr.final_approver_name,
    action: nr.action,
    comment: nr.comment,
    createdAt: nr.created_at,
    updatedAt: nr.updated_at,
    finishedAt: nr.finished_at,
  };
}

// ==================== API 处理 ====================

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
      // 我发起的 - 需要合并审批实例和无需审批的通知（如家长通知）
      // 1. 查询审批实例
      const { data: approvalData, error: approvalError, count: approvalCount } = await supabase
        .from('approval_instances')
        .select('*, node_records:approval_node_records(*)', { count: 'exact' })
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false });

      if (approvalError) throw approvalError;

      // 2. 查询无需审批的通知（parent_notice 和 internal_notice）
      const { data: directAnnouncements, error: directError, count: directCount } = await supabase
        .from('announcements')
        .select('*', { count: 'exact' })
        .eq('author_id', user.id)
        .in('type', ['parent_notice', 'internal_notice'])
        .order('created_at', { ascending: false });

      if (directError) throw directError;

      // 3. 获取审批实例关联的公告信息
      const announcements: Record<string, Announcement> = {};
      if (approvalData && approvalData.length > 0) {
        const businessIds = approvalData.map((d: any) => d.business_id);
        const { data: announcementData } = await supabase
          .from('announcements')
          .select('*')
          .in('id', businessIds);

        announcementData?.forEach((a: any) => {
          announcements[a.id] = mapAnnouncement(a);
        });
      }

      // 4. 转换审批实例
      const instances: ApprovalInstance[] = (approvalData || []).map((item: any) => ({
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
        nodeRecords: item.node_records?.map((nr: any) => mapNodeRecord(nr)),
        business: announcements[item.business_id],
      }));

      // 5. 转换无需审批的通知为伪审批实例格式
      const directInstances: ApprovalInstance[] = (directAnnouncements || []).map((a: any) => ({
        id: `direct-${a.id}`,
        flowId: undefined,
        flowName: a.type === 'parent_notice' ? '家长通知' : '内部通知',
        businessType: a.type,
        businessId: a.id,
        title: a.title,
        applicantId: a.author_id,
        applicantName: a.author_name,
        applicantDepartment: a.department,
        currentNodeOrder: 0,
        status: 'approved' as const,
        submitAt: a.created_at,
        finishAt: a.created_at,
        metadata: a.metadata,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
        nodeRecords: [],
        business: mapAnnouncement(a),
      }));

      // 6. 合并并按时间排序
      const allInstances = [...instances, ...directInstances]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // 7. 分页
      const totalCount = (approvalCount || 0) + (directCount || 0);
      const paginatedInstances = allInstances.slice(offset, offset + pageSize);

      return NextResponse.json({
        success: true,
        data: paginatedInstances,
        pagination: {
          page,
          pageSize,
          total: totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      });
    } else if (type === 'pending') {
      // 待我审批的 - 需要检查当前节点是否包含当前用户
      // 1. 获取所有进行中的实例（公告/新闻等）
      const { data: inProgressInstances, error: inProgressError } = await supabase
        .from('approval_instances')
        .select('*')
        .eq('status', 'in_progress');

      if (inProgressError) throw inProgressError;

      // 2. 获取所有待审批的请假实例
      const { data: leaveInstances, error: leaveError } = await supabase
        .from('approval_instances')
        .select('*')
        .eq('status', 'pending')
        .eq('business_type', 'leave_request');

      if (leaveError) throw leaveError;

      const pendingInstanceIds: string[] = [];
      
      // 处理公告/新闻类型的审批（有节点记录）
      for (const instance of inProgressInstances || []) {
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

      // 处理请假类型的审批（审批人信息在 metadata 中）
      for (const instance of leaveInstances || []) {
        const approvers = instance.metadata?.approvers || [];
        // 检查当前用户工号是否在审批人列表中
        const isApprover = approvers.some((a: any) => a.employeeId === user.employeeId);
        
        // 检查是否已经审批过
        const approvedByList = instance.metadata?.approvedByList || [];
        const hasApproved = approvedByList.some((a: any) => a.employeeId === user.employeeId);
        
        if (isApprover && !hasApproved) {
          pendingInstanceIds.push(instance.id);
        }
      }

      query = query.in('id', pendingInstanceIds.length > 0 ? pendingInstanceIds : ['00000000-0000-0000-0000-000000000000']);
    } else if (type === 'processed') {
      // 我已处理的
      const processedInstanceIds: string[] = [];
      
      // 1. 查找公告/新闻类型：在节点记录的 approved_by 中包含当前用户 ID 的记录
      const { data: allRecords, error: recordsError } = await supabase
        .from('approval_node_records')
        .select('instance_id, approved_by');
      
      if (recordsError) throw recordsError;
      
      const nodeRecordInstanceIds = [...new Set(
        (allRecords || [])
          .filter((r: any) => {
            const approvedBy = r.approved_by || [];
            return approvedBy.some((a: any) => a.user_id === user.id);
          })
          .map((r: any) => r.instance_id)
      )];
      processedInstanceIds.push(...nodeRecordInstanceIds);
      
      // 2. 查找请假类型：在 metadata.approvedByList 中包含当前用户工号的记录
      const { data: leaveInstances, error: leaveError } = await supabase
        .from('approval_instances')
        .select('id, metadata')
        .in('status', ['approved', 'rejected'])
        .eq('business_type', 'leave_request');
      
      if (leaveError) throw leaveError;
      
      const leaveInstanceIds = (leaveInstances || [])
        .filter((instance: any) => {
          const approvedByList = instance.metadata?.approvedByList || [];
          return approvedByList.some((a: any) => a.employeeId === user.employeeId);
        })
        .map((instance: any) => instance.id);
      processedInstanceIds.push(...leaveInstanceIds);

      query = query.in('id', processedInstanceIds.length > 0 ? processedInstanceIds : ['00000000-0000-0000-0000-000000000000']);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // 排序和分页
    query = query.order('created_at', { ascending: false });
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // 获取关联的业务数据
    const announcements: Record<string, Announcement> = {};
    const leaveRequests: Record<string, any> = {};
    
    if (data && data.length > 0) {
      // 分离不同类型的业务ID
      const announcementIds = data.filter((d: any) => ['announcement', 'news', 'internal_notice', 'parent_notice'].includes(d.business_type)).map((d: any) => d.business_id);
      const leaveIds = data.filter((d: any) => d.business_type === 'leave_request').map((d: any) => d.business_id);
      
      // 获取公告信息
      if (announcementIds.length > 0) {
        const { data: announcementData } = await supabase
          .from('announcements')
          .select('*')
          .in('id', announcementIds);

        announcementData?.forEach((a: any) => {
          announcements[a.id] = mapAnnouncement(a);
        });
      }
      
      // 获取请假申请信息
      if (leaveIds.length > 0) {
        const { data: leaveData } = await supabase
          .from('leave_requests')
          .select('*')
          .in('id', leaveIds);

        leaveData?.forEach((lr: any) => {
          leaveRequests[lr.id] = {
            id: lr.id,
            type: lr.type,
            startDate: lr.start_date,
            endDate: lr.end_date,
            duration: lr.duration,
            durationUnit: lr.duration_unit,
            reason: lr.reason,
            needAdjustment: lr.need_adjustment,
            affectedSlots: lr.affected_slots,
            status: lr.status,
            createdAt: lr.created_at,
          };
        });
      }
    }

    const instances: ApprovalInstance[] = (data || []).map((item: any) => {
      // 根据业务类型获取关联数据
      let business = null;
      if (['announcement', 'news', 'internal_notice', 'parent_notice'].includes(item.business_type)) {
        business = announcements[item.business_id];
      } else if (item.business_type === 'leave_request') {
        business = leaveRequests[item.business_id];
      }
      
      return {
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
        nodeRecords: item.node_records?.map((nr: any) => mapNodeRecord(nr)),
        business,
      };
    });

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
    
    // 内部通知和家长通知不需要审批，直接发布
    if (type === 'internal_notice' || type === 'parent_notice') {
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

    // 2. 内部通知和家长通知：直接发送给指定接收者，无需审批
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

    // 家长通知：发送给指定班级的家长
    if (type === 'parent_notice') {
      await sendParentNotification(supabase, announcementId, title, content, user.id, user.name, recipients);
      
      return NextResponse.json({
        success: true,
        data: {
          announcementId,
          status: 'published',
          message: '家长通知发布成功',
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
 * 
 * 支持多种接收者类型：
 * - all: 全员通知
 * - role: 按角色通知（检查主角色和兼任角色）
 * - class: 按班级通知（通知班级的家长）
 * - individual: 指定个人
 * - group: 按部门群组通知
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
    // 按角色发送 - 需要检查主角色和兼任角色
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .in('role', recipients.roles);
    userIds = users?.map((u: any) => u.id) || [];
    
    // 还需要检查兼任角色（additional_roles 是数组）
    for (const role of recipients.roles) {
      const { data: additionalRoleUsers } = await supabase
        .from('users')
        .select('id')
        .contains('additional_roles', [role]);
      
      if (additionalRoleUsers) {
        userIds.push(...additionalRoleUsers.map((u: any) => u.id));
      }
    }
    
  } else if (recipients.type === 'class' && recipients.classIds) {
    // 按班级发送：通知该班级学生的家长
    // 1. 获取班级学生的家长 account_id
    const { data: parents } = await supabase
      .from('parents')
      .select('account_id')
      .in('class_id', recipients.classIds)
      .eq('has_account', true)
      .not('account_id', 'is', null);
    
    const accountIds = parents?.map((p: any) => p.account_id).filter(Boolean) || [];
    
    if (accountIds.length > 0) {
      // 2. 通过 account_id 关联 users 表获取用户 UUID
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .in('id::text', accountIds);
      userIds = users?.map((u: any) => u.id) || [];
    }
    
  } else if (recipients.type === 'individual' && recipients.userIds) {
    // 发送给指定用户（直接使用用户ID）
    userIds = recipients.userIds;
    
  } else if (recipients.type === 'group' && recipients.groupIds) {
    // 按群组发送 - group_members.user_id 存的是工号，需要关联 users 表获取 UUID
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .in('group_id', recipients.groupIds);
    
    const employeeIds = members?.map((m: any) => m.user_id).filter(Boolean) || [];
    
    if (employeeIds.length > 0) {
      // 通过工号获取用户 UUID
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .in('employee_id', employeeIds);
      userIds = users?.map((u: any) => u.id) || [];
    }
  }

  // 去重
  userIds = [...new Set(userIds)];

  if (userIds.length === 0) return;

  // 创建消息（为每个接收者创建独立的消息记录）
  const messages = userIds.map((userId: string) => ({
    id: crypto.randomUUID(),
    title: `【内部通知】${title}`,
    content: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
    type: 'internal_notice',
    priority: 'normal',
    sender_id: authorId,
    sender_name: authorName,
    recipient_id: userId,
    recipient_type: 'individual',
    is_read: false,
    metadata: { announcement_id: announcementId },
  }));

  await supabase.from('messages').insert(messages);
}

/**
 * 发送家长通知
 * 
 * 支持接收者类型：
 * - class: 按班级通知（通知班级的家长）
 */
async function sendParentNotification(
  supabase: ReturnType<typeof getSupabaseClient>,
  announcementId: string,
  title: string,
  content: string,
  authorId: string,
  authorName: string,
  recipients?: SubmitApprovalRequest['recipients']
) {
  if (!recipients || !recipients.classIds || recipients.classIds.length === 0) {
    console.log('[sendParentNotification] No recipients or classIds');
    return;
  }

  console.log('[sendParentNotification] Looking for parents in classes:', recipients.classIds);

  // 获取班级学生的家长 account_id
  const { data: parents, error: parentsError } = await supabase
    .from('parents')
    .select('id, name, account_id, class_id')
    .in('class_id', recipients.classIds)
    .eq('has_account', true)
    .not('account_id', 'is', null);
  
  if (parentsError) {
    console.error('[sendParentNotification] Error fetching parents:', parentsError);
    return;
  }

  console.log('[sendParentNotification] Found parents with accounts:', parents?.length || 0);
  
  const accountIds = parents?.map((p: any) => p.account_id).filter(Boolean) || [];
  
  if (accountIds.length === 0) {
    console.log('[sendParentNotification] No account IDs found');
    return;
  }

  console.log('[sendParentNotification] Account IDs:', accountIds);

  // 直接使用 account_id 作为用户 ID（account_id 就是 users 表的 id）
  // account_id 存储的是 UUID 字符串，可以直接用于消息的 recipient_id
  const uniqueUserIds = [...new Set(accountIds)];

  console.log('[sendParentNotification] Unique user IDs:', uniqueUserIds.length);

  if (uniqueUserIds.length === 0) return;

  // 创建消息（为每个接收者创建独立的消息记录）
  const messages = uniqueUserIds.map((userId: string) => ({
    id: crypto.randomUUID(),
    title: `【家长通知】${title}`,
    content: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
    type: 'parent_notice',
    priority: 'normal',
    sender_id: authorId,
    sender_name: authorName,
    recipient_id: userId,
    recipient_type: 'individual',
    is_read: false,
    metadata: { announcement_id: announcementId },
  }));

  const { error: insertError } = await supabase.from('messages').insert(messages);
  
  if (insertError) {
    console.error('[sendParentNotification] Error inserting messages:', insertError);
  } else {
    console.log('[sendParentNotification] Successfully sent', messages.length, 'messages');
  }
}
