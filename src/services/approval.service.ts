/**
 * 审批服务 - 完整版
 * 
 * 负责所有审批相关的业务逻辑
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { 
  approvalRepository, 
  ApprovalInstanceSimple,
} from '@/repositories/approval.repository';
import type { ApprovalInstance, Announcement } from '@/types/approval';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// ============================================
// 类型定义
// ============================================

export type SubmitApprovalParams = {
  title: string;
  summary?: string;
  content?: string;
  type: 'announcement' | 'news' | 'internal_notice' | 'parent_notice';
  category?: string;
  mediaLevel?: string;
  department?: string;
  coverImage?: string;
  images?: string[];
  attachments?: Array<{ name: string; url: string; size?: number; type?: string }>;
  isExternal?: boolean;
  scheduledPublishAt?: string;
  autoUnpublish?: boolean;
  autoUnpublishAt?: string;
  isPinned?: boolean;
  recipients?: Recipients;
  customFlow?: { skipDepartmentDirector?: boolean };
};

export type Recipients = {
  type: 'all' | 'role' | 'class' | 'individual' | 'group';
  roles?: string[];
  classIds?: string[];
  userIds?: string[];
  groupIds?: string[];
};

export type ApprovalListParams = {
  type: 'my' | 'pending' | 'processed';
  status?: string;
  department?: string;
  page?: number;
  pageSize?: number;
};

// 审批节点类型
type ApprovalNode = {
  node_order: number;
  node_name: string;
  node_type: string;
  approver_type?: string;
  approver_roles?: string[];
  approver_user_ids?: string[];
  approver_ids?: string[];
};

// 审批记录类型
type ApprovalRecord = {
  instanceId: string;
  nodeOrder: number;
  nodeName: string;
  nodeType: string;
  approverIds: string[];
  status: string;
  approvedBy: ApprovalAction[];
};

// 审批动作类型
type ApprovalAction = {
  userId: string;
  userName: string;
  action: string;
  time: string;
};

// 家长行类型
type ParentRow = {
  account_id: string | null;
  has_account: boolean;
};

// ============================================
// 服务类
// ============================================

export class ApprovalService extends BaseService {
  private repository = approvalRepository;
  private get client() {
    return getSupabaseClient();
  }

  // ==================== 查询服务 ====================

  /**
   * 获取审批列表（统一入口）
   */
  async getApprovalList(
    userId: string,
    params: ApprovalListParams
  ): Promise<PaginatedServiceResult<ApprovalInstanceSimple>> {
    const { type, status, department, page = 1, pageSize = 10 } = params;

    switch (type) {
      case 'my':
        return this.getMyApplications(userId, { status, department, page, pageSize });
      case 'pending':
        return this.getPendingApprovals(userId, { department, page, pageSize });
      case 'processed':
        return this.getProcessedApprovals(userId, { department, page, pageSize });
      default:
        return this.fail('无效的查询类型');
    }
  }

  /**
   * 获取我发起的审批
   */
  private async getMyApplications(
    userId: string,
    options: { status?: string; department?: string; page: number; pageSize: number }
  ): Promise<PaginatedServiceResult<ApprovalInstanceSimple>> {
    // 1. 查询审批实例
    const result = await this.repository.findMyApplications(userId, options);

    // 2. 查询直接发布的通知（无需审批）
    const directAnnouncements = await this.repository.findDirectAnnouncements(userId);

    // 3. 获取关联的公告数据
    const announcementIds = result.data
      .filter(i => ['announcement', 'news', 'internal_notice', 'parent_notice'].includes(i.businessType || ''))
      .map(i => i.businessId)
      .filter((id): id is string => id !== undefined);
    
    const announcements = await this.repository.getAnnouncements(announcementIds);

    // 4. 合并公告数据
    const instancesWithBusiness = result.data.map(instance => ({
      ...instance,
      business: instance.businessId ? announcements[instance.businessId] : undefined,
    }));

    // 5. 转换直接发布的通知为伪审批实例格式
    const directInstances: ApprovalInstanceSimple[] = directAnnouncements.map(a => ({
      id: `direct-${a.id}`,
      flowId: undefined,
      flowName: a.type === 'parent_notice' ? '家长通知' : '内部通知',
      businessType: a.type || 'internal_notice',
      businessId: a.id,
      title: a.title || '',
      applicantId: a.authorId || '',
      applicantName: a.authorName || '',
      applicantDepartment: a.department,
      currentNodeOrder: 0,
      status: 'approved',
      submitAt: a.createdAt,
      finishAt: a.createdAt,
      createdAt: a.createdAt || '',
      updatedAt: a.updatedAt || '',
      nodeRecords: [],
      business: a,
    }));

    // 6. 合并并排序
    let allInstances = [...instancesWithBusiness, ...directInstances]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    // 7. 部门过滤
    if (options.department) {
      allInstances = allInstances.filter(instance => {
        const businessDept = this.repository.getBusinessDepartment(
          instance.businessType || '',
          instance.applicantDepartment
        );
        return businessDept === options.department;
      });
    }

    // 8. 分页
    const offset = (options.page - 1) * options.pageSize;
    const paginatedInstances = allInstances.slice(offset, offset + options.pageSize);

    return {
      success: true,
      data: paginatedInstances,
      pagination: {
        page: options.page,
        pageSize: options.pageSize,
        total: allInstances.length,
        totalPages: Math.ceil(allInstances.length / options.pageSize),
      },
    };
  }

  /**
   * 获取待审批的申请
   */
  private async getPendingApprovals(
    userId: string,
    options: { department?: string; page: number; pageSize: number }
  ): Promise<PaginatedServiceResult<ApprovalInstanceSimple>> {
    const result = await this.repository.findPendingApprovals(userId, options);

    // 获取关联业务数据
    return this.enrichWithBusinessData(result);
  }

  /**
   * 获取已处理的审批
   */
  private async getProcessedApprovals(
    userId: string,
    options: { department?: string; page: number; pageSize: number }
  ): Promise<PaginatedServiceResult<ApprovalInstanceSimple>> {
    const result = await this.repository.findProcessedApprovals(userId, options);

    // 获取关联业务数据
    return this.enrichWithBusinessData(result);
  }

  /**
   * 为审批实例填充业务数据
   */
  private async enrichWithBusinessData(
    result: { data: ApprovalInstanceSimple[]; total: number; page: number; pageSize: number; totalPages: number }
  ): Promise<PaginatedServiceResult<ApprovalInstanceSimple>> {
    if (!result.data.length) {
      return { success: true, data: [], pagination: result };
    }

    // 分离不同类型的业务ID
    const announcementIds = result.data
      .filter(i => ['announcement', 'news', 'internal_notice', 'parent_notice'].includes(i.businessType || ''))
      .map(i => i.businessId)
      .filter((id): id is string => id !== undefined);

    const leaveIds = result.data
      .filter(i => i.businessType === 'leave_request')
      .map(i => i.businessId)
      .filter((id): id is string => id !== undefined);

    const roomBookingIds = result.data
      .filter(i => i.businessType === 'room_booking')
      .map(i => i.businessId)
      .filter((id): id is string => id !== undefined);

    // 获取关联数据
    const [announcements, leaveRequests, roomBookings] = await Promise.all([
      this.repository.getAnnouncements(announcementIds),
      this.repository.getLeaveRequests(leaveIds),
      this.repository.getRoomBookings(roomBookingIds),
    ]);

    // 合并数据
    const enrichedData = result.data.map(instance => {
      let business = null;
      if (['announcement', 'news', 'internal_notice', 'parent_notice'].includes(instance.businessType || '') && instance.businessId) {
        business = announcements[instance.businessId];
      } else if (instance.businessType === 'leave_request' && instance.businessId) {
        business = leaveRequests[instance.businessId];
      } else if (instance.businessType === 'room_booking' && instance.businessId) {
        business = roomBookings[instance.businessId];
      }
      return { ...instance, business };
    });

    return {
      success: true,
      data: enrichedData,
      pagination: result,
    };
  }

  // ==================== 提交服务 ====================

  /**
   * 提交审批申请
   */
  async submitApproval(
    userId: string,
    userName: string,
    params: SubmitApprovalParams
  ): Promise<ServiceResult<{ announcementId: string; instanceId?: string; status: string; message: string }>> {
    const { type, department, scheduledPublishAt } = params;

    // 1. 创建公告/通知
    const announcementId = await this.repository.createAnnouncement({
      title: params.title,
      summary: params.summary,
      content: params.content,
      type,
      category: params.category,
      mediaLevel: params.mediaLevel,
      authorId: userId,
      authorName: userName,
      department,
      coverImage: params.coverImage,
      images: params.images,
      attachments: params.attachments,
      isExternal: params.isExternal,
      status: type === 'internal_notice' || type === 'parent_notice' ? 'published' : 'draft',
      publishStatus: type === 'internal_notice' || type === 'parent_notice' ? 'published' : 
                     scheduledPublishAt ? 'scheduled' : 'pending',
      scheduledPublishAt,
      autoUnpublish: params.autoUnpublish,
      autoUnpublishAt: params.autoUnpublishAt,
      isPinned: params.isPinned,
      recipients: params.recipients,
    });

    if (!announcementId) {
      return this.fail('创建公告失败');
    }

    // 2. 内部通知和家长通知：直接发送，无需审批
    if (type === 'internal_notice') {
      await this.sendInternalNotification(announcementId, params, userId, userName);
      return this.ok({
        announcementId,
        status: 'published',
        message: '内部通知发布成功',
      });
    }

    if (type === 'parent_notice') {
      await this.sendParentNotification(announcementId, params, userId, userName);
      return this.ok({
        announcementId,
        status: 'published',
        message: '家长通知发布成功',
      });
    }

    // 3. 校长室直接发布
    if (department === 'principal_office') {
      const now = new Date().toISOString();
      await this.client
        .from('announcements')
        .update({
          status: scheduledPublishAt ? 'approved' : 'published',
          publish_status: scheduledPublishAt ? 'scheduled' : 'published',
          published_at: scheduledPublishAt ? undefined : now,
        })
        .eq('id', announcementId);

      await this.sendNotifications(userId, params.title, params.summary || params.content || '', department);
      
      return this.ok({
        announcementId,
        status: scheduledPublishAt ? 'scheduled' : 'published',
        message: scheduledPublishAt ? '已设置定时发布' : '发布成功',
      });
    }

    // 4. 获取审批流程
    const flowType = type === 'announcement' ? 'announcement_approval' : 'news_approval';
    const flow = await this.repository.getApprovalFlow(flowType, department || '');

    if (!flow) {
      return this.fail('未找到对应的审批流程');
    }

    // 5. 创建审批实例
    const instanceId = await this.repository.createInstance({
      flowId: flow.id,
      flowName: flow.name,
      businessType: type,
      businessId: announcementId,
      title: params.title,
      applicantId: userId,
      applicantName: userName,
      applicantDepartment: department,
    });

    if (!instanceId) {
      return this.fail('创建审批实例失败');
    }

    // 6. 创建审批节点记录
    const nodeRecords = await this.buildNodeRecords(flow.nodes || [], instanceId, userId, userName, params.customFlow);
    await this.repository.createNodeRecords(nodeRecords);

    // 7. 发送审批通知
    const firstApprovalNode = nodeRecords.find(n => n.nodeType !== 'submit' && n.status === 'pending');
    if (firstApprovalNode && firstApprovalNode.approverIds.length > 0) {
      await this.repository.createMessages(
        firstApprovalNode.approverIds.map(approverId => ({
          title: `【审批待办】${params.title}`,
          content: `${userName}提交的审批申请需要您审批`,
          type: 'approval',
          priority: 'high',
          recipientId: approverId,
          metadata: { instance_id: instanceId },
        }))
      );
    }

    return this.ok({
      announcementId,
      instanceId,
      status: 'pending_approval',
      message: '已提交审批',
    });
  }

  /**
   * 构建审批节点记录
   */
  private async buildNodeRecords(
    nodes: ApprovalNode[],
    instanceId: string,
    userId: string,
    userName: string,
    customFlow?: { skipDepartmentDirector?: boolean }
  ): Promise<ApprovalRecord[]> {
    const records: ApprovalRecord[] = [];

    for (const node of nodes) {
      // 根据自定义流程跳过某些节点
      if (customFlow?.skipDepartmentDirector && node.node_order === 2 && node.node_type === 'approve') {
        continue;
      }

      // 获取审批人ID列表
      let approverIds: string[] = [];
      if (node.approver_type === 'role') {
        const roles = node.approver_roles || [];
        approverIds = await this.repository.getUsersByRoles(roles);
      } else if (node.approver_type === 'user') {
        approverIds = node.approver_user_ids || [];
      }

      // 去重
      approverIds = [...new Set(approverIds)];

      records.push({
        instanceId,
        nodeOrder: node.node_order,
        nodeName: node.node_name,
        nodeType: node.node_type,
        approverIds,
        status: node.node_type === 'submit' ? 'approved' : 'pending',
        approvedBy: node.node_type === 'submit'
          ? [{ userId, userName, action: 'approved', time: new Date().toISOString() }]
          : [],
      });
    }

    return records;
  }

  // ==================== 通知服务 ====================

  /**
   * 发送内部通知
   */
  private async sendInternalNotification(
    announcementId: string,
    params: SubmitApprovalParams,
    authorId: string,
    authorName: string
  ): Promise<void> {
    const recipients = params.recipients;
    if (!recipients) return;

    // 群组通知特殊处理
    if (recipients.type === 'group' && recipients.groupIds?.length) {
      await this.sendGroupNotifications(announcementId, params, authorId, authorName, recipients.groupIds);
      return;
    }

    // 获取目标用户
    const userIds = await this.resolveRecipients(recipients);
    if (!userIds.length) return;

    // 发送消息
    await this.repository.createMessages(
      userIds.map(userId => ({
        title: `【内部通知】${params.title}`,
        content: (params.content || '').substring(0, 200),
        type: 'internal_notice',
        senderId: authorId,
        senderName: authorName,
        recipientId: userId,
        metadata: { announcement_id: announcementId },
      }))
    );
  }

  /**
   * 发送群组通知
   */
  private async sendGroupNotifications(
    announcementId: string,
    params: SubmitApprovalParams,
    authorId: string,
    authorName: string,
    groupIds: string[]
  ): Promise<void> {
    const groupDeptMap: Record<string, string> = {
      'principal_office': 'principal',
      'academic_office': 'academic',
      'moral_office': 'moral',
      'general_office': 'general',
    };

    for (const groupId of groupIds) {
      const targetDept = groupDeptMap[groupId];
      
      // 校长室：发给成员个人
      if (groupId === 'principal_office') {
        const members = await this.repository.getGroupMembers(groupId);
        if (members.length) {
          await this.repository.createMessages(
            members.map(userId => ({
              title: `【校长室通知】${params.title}`,
              content: (params.content || '').substring(0, 200),
              type: 'internal_notice',
              priority: 'high',
              senderId: authorId,
              senderName: authorName,
              recipientId: userId,
              metadata: { announcement_id: announcementId, group_type: groupId },
            }))
          );
        }
      } else {
        // 其他部门：发部门广播
        await this.repository.createMessages([{
          title: `【内部通知】${params.title}`,
          content: (params.content || '').substring(0, 200),
          type: 'department_notice',
          senderId: authorId,
          senderName: authorName,
          recipientId: authorId, // 部门广播用发送者ID占位
          recipientType: 'department',
          metadata: { announcement_id: announcementId, group_type: groupId, target_department: targetDept },
        }]);
      }
    }
  }

  /**
   * 发送家长通知
   */
  private async sendParentNotification(
    announcementId: string,
    params: SubmitApprovalParams,
    authorId: string,
    authorName: string
  ): Promise<void> {
    const recipients = params.recipients;
    if (!recipients?.classIds?.length) return;

    // 获取班级学生的家长账号
    const { data: parents } = await this.client
      .from('parents')
      .select('account_id')
      .in('class_id', recipients.classIds)
      .eq('has_account', true)
      .not('account_id', 'is', null);

    const accountIds = [...new Set((parents as ParentRow[] || []).map((p) => p.account_id).filter(Boolean))] as string[];
    if (!accountIds.length) return;

    // 发送消息
    await this.repository.createMessages(
      accountIds.map(userId => ({
        title: `【家长通知】${params.title}`,
        content: (params.content || '').substring(0, 200),
        type: 'parent_notice',
        senderId: authorId,
        senderName: authorName,
        recipientId: userId,
        metadata: { announcement_id: announcementId },
      }))
    );
  }

  /**
   * 发送公告通知
   */
  private async sendNotifications(
    authorId: string,
    title: string,
    content: string,
    department?: string
  ): Promise<void> {
    console.log('[sendNotifications] Starting with:', { authorId, title, department });
    
    const { data: users } = await this.client
      .from('users')
      .select('id')
      .neq('id', authorId);

    if (!users?.length) {
      console.log('[sendNotifications] No users found');
      return;
    }

    console.log('[sendNotifications] Sending to', users.length, 'users');
    
    const result = await this.repository.createMessages(
      users.map(u => ({
        title: `【新公告】${title}`,
        content: content.substring(0, 200),
        type: 'announcement',
        priority: 'high',
        senderId: authorId,
        senderName: department || '',
        recipientId: u.id,
      }))
    );
    
    console.log('[sendNotifications] Result:', result);
  }

  /**
   * 解析接收者列表
   */
  private async resolveRecipients(recipients: Recipients): Promise<string[]> {
    if (recipients.type === 'all') {
      const { data: users } = await this.client.from('users').select('id');
      return (users || []).map(u => u.id);
    }

    if (recipients.type === 'role' && recipients.roles?.length) {
      return this.repository.getUsersByRoles(recipients.roles);
    }

    if (recipients.type === 'class' && recipients.classIds?.length) {
      const { data: parents } = await this.client
        .from('parents')
        .select('account_id')
        .in('class_id', recipients.classIds)
        .eq('has_account', true)
        .not('account_id', 'is', null);
      return [...new Set((parents as ParentRow[] || []).map((p) => p.account_id).filter(Boolean))] as string[];
    }

    if (recipients.type === 'individual' && recipients.userIds?.length) {
      return recipients.userIds;
    }

    return [];
  }

  // ==================== 审批操作服务 ====================

  /**
   * 执行审批操作
   */
  async executeAction(params: {
    instanceId: string;
    action: 'approve' | 'reject' | 'return' | 'withdraw';
    comment?: string;
    userId: string;
    userName: string;
  }): Promise<ServiceResult<{ message: string }>> {
    const { instanceId, action, comment, userId, userName } = params;

    // 1. 获取审批实例
    const instance = await this.repository.findInstanceById(instanceId);
    if (!instance) {
      return this.fail('审批实例不存在', 'NOT_FOUND');
    }

    // 撤回操作特殊处理
    if (action === 'withdraw') {
      if (instance.applicantId !== userId) {
        return this.fail('只有申请人可以撤回', 'FORBIDDEN');
      }
      return this.handleWithdraw(instance);
    }

    // 2. 获取当前审批节点记录
    const currentNodeOrder = instance.currentNodeOrder || 1;
    const currentNodeRecord = await this.repository.findCurrentNodeRecord(instanceId, currentNodeOrder);

    if (!currentNodeRecord) {
      return this.fail('未找到待审批的节点');
    }

    // 3. 检查权限
    const approverIds = currentNodeRecord.approverIds || [];
    const approvedBy = currentNodeRecord.approvedBy || [];
    const approvedUserIds = approvedBy.map(a => a.userId);

    // 教室预约审批特殊处理：approverIds 为空时，任何部门成员都可以审批
    const isRoomBooking = instance.businessType === 'room_booking';
    const canApprove = approverIds.length === 0
      ? isRoomBooking
      : approverIds.includes(userId);

    if (!canApprove) {
      return this.fail('您没有权限审批此申请', 'FORBIDDEN');
    }

    if (approvedUserIds.includes(userId)) {
      return this.fail('您已经审批过了');
    }

    const now = new Date().toISOString();
    const newApproval = {
      userId,
      userName,
      action,
      comment,
      time: now,
    };

    // 4. 根据操作类型处理
    switch (action) {
      case 'approve':
        return this.handleApprove(instance, currentNodeRecord, newApproval, now);
      case 'reject':
        return this.handleReject(instance, currentNodeRecord, newApproval, now);
      case 'return':
        return this.handleReturn(instance, currentNodeRecord, newApproval, now);
      default:
        return this.fail('无效的操作类型');
    }
  }

  /**
   * 处理审批通过
   */
  private async handleApprove(
    instance: ApprovalInstanceSimple,
    nodeRecord: { id: string; nodeType?: string; approverIds?: string[]; approvedBy?: Array<{ userId?: string; userName?: string; action?: string; comment?: string; time?: string }> },
    approval: { userId: string; userName: string; action: string; comment?: string; time: string },
    now: string
  ): Promise<ServiceResult<{ message: string }>> {
    const newApprovedBy = [...(nodeRecord.approvedBy || []), approval];

    // 或签：任一人通过即可
    if (nodeRecord.nodeType === 'or_sign') {
      await this.repository.updateNodeRecord(nodeRecord.id, {
        status: 'approved',
        approvedBy: newApprovedBy,
        finalApproverId: approval.userId,
        finalApproverName: approval.userName,
        action: 'approved',
        comment: approval.comment,
        finishedAt: now,
      });

      return this.moveToNextNode(instance, now);
    }

    // 会签：所有人都要通过
    if (nodeRecord.nodeType === 'countersign') {
      const allApproverIds = nodeRecord.approverIds || [];
      const approvedUserIds = newApprovedBy.map(a => a.userId);
      const allApproved = allApproverIds.every(id => approvedUserIds.includes(id));

      if (allApproved) {
        await this.repository.updateNodeRecord(nodeRecord.id, {
          status: 'approved',
          approvedBy: newApprovedBy,
          action: 'approved',
          finishedAt: now,
        });

        return this.moveToNextNode(instance, now);
      } else {
        // 还有人未审批
        await this.repository.updateNodeRecord(nodeRecord.id, {
          approvedBy: newApprovedBy,
        });

        return this.ok({ message: '审批已记录，等待其他审批人审批' });
      }
    }

    // 单人审批
    await this.repository.updateNodeRecord(nodeRecord.id, {
      status: 'approved',
      approvedBy: newApprovedBy,
      action: 'approved',
      comment: approval.comment,
      finishedAt: now,
    });

    return this.moveToNextNode(instance, now);
  }

  /**
   * 进入下一个节点或完成审批
   */
  private async moveToNextNode(
    instance: ApprovalInstanceSimple,
    now: string
  ): Promise<ServiceResult<{ message: string }>> {
    const currentNodeOrder = instance.currentNodeOrder || 1;
    const nextNode = await this.repository.findNextNodeRecord(instance.id, currentNodeOrder);

    if (nextNode) {
      // 还有下一个节点
      await this.repository.updateInstanceStatus(instance.id, {
        currentNodeOrder: nextNode.nodeOrder,
      });

      // 发送通知给下一节点的审批人
      if (nextNode.approverIds && nextNode.approverIds.length > 0) {
        await this.repository.createMessages(
          nextNode.approverIds.map(approverId => ({
            title: `【审批待办】${instance.title}`,
            content: `${instance.applicantName}提交的审批申请需要您审批`,
            type: 'approval',
            priority: 'high',
            recipientId: approverId,
            metadata: { instance_id: instance.id },
          }))
        );
      }

      return this.ok({ message: '审批通过，已进入下一审批环节' });
    } else {
      // 没有下一个节点，审批完成
      return this.completeApproval(instance, now);
    }
  }

  /**
   * 完成审批
   */
  private async completeApproval(
    instance: ApprovalInstanceSimple,
    now: string
  ): Promise<ServiceResult<{ message: string }>> {
    // 更新审批实例状态
    await this.repository.updateInstanceStatus(instance.id, {
      status: 'approved',
      finishAt: now,
    });

    // 根据业务类型更新对应表
    if (instance.businessType === 'leave_request' && instance.businessId) {
      await this.handleLeaveRequestApproval(instance, now);
    } else if (instance.businessType === 'room_booking' && instance.businessId) {
      await this.handleRoomBookingApproval(instance, now);
    } else if (instance.businessId) {
      // 默认处理公告类型
      await this.repository.updateAnnouncementStatus(instance.businessId, {
        status: 'published',
        publishStatus: 'published',
        publishedAt: now,
      });
      // 只对非 room_booking 类型发送通用通知（room_booking 在 handleRoomBookingApproval 中发送详细通知）
      await this.repository.createMessages([{
        title: `【审批通过】${instance.title}`,
        content: '您的审批申请已通过。',
        type: 'approval',
        priority: 'high',
        recipientId: instance.applicantId,
        metadata: { instance_id: instance.id },
      }]);
    }

    return this.ok({ message: '审批通过' });
  }

  /**
   * 处理请假审批通过后的逻辑
   */
  private async handleLeaveRequestApproval(
    instance: ApprovalInstanceSimple,
    now: string
  ): Promise<void> {
    if (!instance.businessId) return;

    const metadata = instance.metadata as {
      needAdjustment?: boolean;
      need_adjustment?: boolean;
      affectedSlots?: Array<{
        teacherId?: string;
        teacherName?: string;
        employeeId?: string;
        classId?: string;
        className?: string;
        grade?: number;
        weekDay?: number;
        periodIndex?: number;
        subject?: string;
        weekStartDate?: string;
      }>;
      affected_slots?: Array<{
        teacherId?: string;
        teacherName?: string;
        employeeId?: string;
        classId?: string;
        className?: string;
        grade?: number;
        weekDay?: number;
        periodIndex?: number;
        subject?: string;
        weekStartDate?: string;
      }>;
    } | undefined;

    const needAdjustment = metadata?.needAdjustment || metadata?.need_adjustment;
    const affectedSlots = metadata?.affectedSlots || metadata?.affected_slots || [];

    // 更新请假申请状态
    const updateData: { status: string; approvedAt: string; currentStep: number; adjustmentStatus?: string } = {
      status: 'approved',
      approvedAt: now,
      currentStep: 2,
    };

    if (needAdjustment && affectedSlots.length > 0) {
      updateData.adjustmentStatus = 'pending';
    }

    await this.repository.updateLeaveRequestStatus(instance.businessId, updateData);

    // 如果需要调课，创建调课记录
    if (needAdjustment && affectedSlots.length > 0) {
      await this.createCourseAdjustmentsForLeave(instance, affectedSlots, now);
    }
  }

  /**
   * 创建调课记录并通知年段长
   */
  private async createCourseAdjustmentsForLeave(
    instance: ApprovalInstanceSimple,
    affectedSlots: Array<{
      teacherId?: string;
      teacherName?: string;
      employeeId?: string;
      classId?: string;
      className?: string;
      grade?: number;
      weekDay?: number;
      periodIndex?: number;
      subject?: string;
      weekStartDate?: string;
    }>,
    now: string
  ): Promise<void> {
    if (!instance.businessId) return;

    // 检查是否已有调课记录
    const hasExisting = await this.repository.hasCourseAdjustments(instance.businessId);
    if (hasExisting) return;

    // 创建调课记录
    const adjustmentRecords = affectedSlots.map(slot => ({
      leaveRequestId: instance.businessId!,
      applicantId: instance.applicantId,
      applicantName: instance.applicantName,
      adjustType: 'substitute',
      originalSlot: {
        teacherId: slot.teacherId,
        teacherName: slot.teacherName || instance.applicantName,
        employeeId: slot.employeeId || instance.applicantId,
      },
      status: 'pending',
      effectiveWeek: slot.weekStartDate || '',
      classId: slot.classId,
      className: slot.className,
      grade: slot.grade,
      weekDay: slot.weekDay,
      periodIndex: slot.periodIndex,
      subject: slot.subject,
    }));

    await this.repository.createCourseAdjustments(adjustmentRecords);

    // TODO: 通知年段长
  }

  /**
   * 处理教室预约审批通过
   */
  private async handleRoomBookingApproval(
    instance: ApprovalInstanceSimple,
    now: string
  ): Promise<void> {
    if (!instance.businessId) return;

    await this.repository.updateRoomBookingStatus(instance.businessId, {
      status: 'approved',
    });

    // 发送通知
    const metadata = instance.metadata as {
      room_name?: string;
      booking_date?: string;
      start_time?: string;
      end_time?: string;
      purpose?: string;
    } | undefined;

    await this.repository.createMessages([{
      title: `【审批通过】${instance.title}`,
      content: `您的教室预约申请已通过。\n\n预约详情：\n- 教室：${metadata?.room_name || '未知'}\n- 时间：${metadata?.booking_date || ''} ${metadata?.start_time || ''}-${metadata?.end_time || ''}\n- 用途：${metadata?.purpose || '未知'}`,
      type: 'approval',
      priority: 'high',
      recipientId: instance.applicantId,
      metadata: { instance_id: instance.id, booking_id: instance.businessId },
    }]);
  }

  /**
   * 处理驳回
   */
  private async handleReject(
    instance: ApprovalInstanceSimple,
    nodeRecord: { id: string; approvedBy?: Array<{ userId?: string; userName?: string; action?: string; comment?: string; time?: string }> },
    approval: { userId: string; userName: string; action: string; comment?: string; time: string },
    now: string
  ): Promise<ServiceResult<{ message: string }>> {
    // 更新节点记录
    await this.repository.updateNodeRecord(nodeRecord.id, {
      status: 'rejected',
      approvedBy: [...(nodeRecord.approvedBy || []), approval],
      finalApproverId: approval.userId,
      finalApproverName: approval.userName,
      action: 'rejected',
      comment: approval.comment,
      finishedAt: now,
    });

    // 更新审批实例状态
    await this.repository.updateInstanceStatus(instance.id, {
      status: 'rejected',
      finishAt: now,
    });

    // 根据业务类型更新对应表
    if (instance.businessType === 'leave_request' && instance.businessId) {
      await this.repository.updateLeaveRequestStatus(instance.businessId, {
        status: 'rejected',
        rejectedAt: now,
        rejectReason: approval.comment,
      });
    } else if (instance.businessType === 'room_booking' && instance.businessId) {
      await this.repository.updateRoomBookingStatus(instance.businessId, {
        status: 'rejected',
        rejectReason: approval.comment,
      });
    } else if (instance.businessId) {
      await this.repository.updateAnnouncementStatus(instance.businessId, {
        status: 'rejected',
      });
    }

    // 发送通知
    await this.repository.createMessages([{
      title: `【审批驳回】${instance.title}`,
      content: `您的审批申请已被驳回。原因：${approval.comment || '无'}`,
      type: 'approval',
      priority: 'high',
      recipientId: instance.applicantId,
      metadata: { instance_id: instance.id, booking_id: instance.businessId },
    }]);

    return this.ok({ message: '已驳回' });
  }

  /**
   * 处理退回
   */
  private async handleReturn(
    instance: ApprovalInstanceSimple,
    nodeRecord: { id: string; approvedBy?: Array<{ userId?: string; userName?: string; action?: string; comment?: string; time?: string }> },
    approval: { userId: string; userName: string; action: string; comment?: string; time: string },
    now: string
  ): Promise<ServiceResult<{ message: string }>> {
    // 更新节点记录
    await this.repository.updateNodeRecord(nodeRecord.id, {
      status: 'rejected',
      approvedBy: [...(nodeRecord.approvedBy || []), approval],
      action: 'returned',
      comment: approval.comment,
      finishedAt: now,
    });

    // 更新审批实例状态
    await this.repository.updateInstanceStatus(instance.id, {
      status: 'returned',
      finishAt: now,
    });

    // 根据业务类型更新对应表
    if (instance.businessType === 'leave_request' && instance.businessId) {
      await this.repository.updateLeaveRequestStatus(instance.businessId, {
        status: 'returned',
        returnedAt: now,
        returnReason: approval.comment,
      });
    } else if (instance.businessType === 'room_booking' && instance.businessId) {
      // 更新教室预约状态为 returned
      await this.repository.updateRoomBookingStatus(instance.businessId, {
        status: 'returned',
        rejectReason: approval.comment,
      });
    } else if (instance.businessId) {
      await this.repository.updateAnnouncementStatus(instance.businessId, {
        status: 'draft',
      });
    }

    // 发送通知
    await this.repository.createMessages([{
      title: `【审批退回】${instance.title}`,
      content: `您的审批申请已被退回。原因：${approval.comment || '无'}，请修改后重新提交。`,
      type: 'approval',
      priority: 'high',
      recipientId: instance.applicantId,
      metadata: { instance_id: instance.id },
    }]);

    return this.ok({ message: '已退回' });
  }

  /**
   * 处理撤回
   */
  private async handleWithdraw(
    instance: ApprovalInstanceSimple
  ): Promise<ServiceResult<{ message: string }>> {
    const now = new Date().toISOString();

    // 更新审批实例状态
    await this.repository.updateInstanceStatus(instance.id, {
      status: 'withdrawn',
      finishAt: now,
    });

    // 根据业务类型更新对应表
    if (instance.businessType === 'leave_request' && instance.businessId) {
      await this.repository.updateLeaveRequestStatus(instance.businessId, {
        status: 'cancelled',
        cancelledAt: now,
      });
    } else if (instance.businessId) {
      await this.repository.updateAnnouncementStatus(instance.businessId, {
        status: 'draft',
      });
    }

    return this.ok({ message: '已撤回' });
  }
}

// 导出单例
export const approvalService = new ApprovalService();
