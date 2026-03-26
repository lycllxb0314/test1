/**
 * 审批服务 - 完整版
 * 
 * 负责所有审批相关的业务逻辑
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { 
  approvalRepository, 
  ApprovalInstance,
  Announcement,
  ApprovalRepository 
} from '@/repositories/approval.repository';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// ============================================
// 类型定义
// ============================================

export interface SubmitApprovalParams {
  title: string;
  summary?: string;
  content?: string;
  type: 'announcement' | 'news' | 'internal_notice' | 'parent_notice';
  category?: string;
  mediaLevel?: string;
  department?: string;
  coverImage?: string;
  images?: string[];
  attachments?: any[];
  isExternal?: boolean;
  scheduledPublishAt?: string;
  autoUnpublish?: boolean;
  autoUnpublishAt?: string;
  isPinned?: boolean;
  recipients?: Recipients;
  customFlow?: { skipDepartmentDirector?: boolean };
}

export interface Recipients {
  type: 'all' | 'role' | 'class' | 'individual' | 'group';
  roles?: string[];
  classIds?: string[];
  userIds?: string[];
  groupIds?: string[];
}

export interface ApprovalListParams {
  type: 'my' | 'pending' | 'processed';
  status?: string;
  department?: string;
  page?: number;
  pageSize?: number;
}

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
  ): Promise<PaginatedServiceResult<ApprovalInstance>> {
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
  ): Promise<PaginatedServiceResult<ApprovalInstance>> {
    // 1. 查询审批实例
    const result = await this.repository.findMyApplications(userId, options);

    // 2. 查询直接发布的通知（无需审批）
    const directAnnouncements = await this.repository.findDirectAnnouncements(userId);

    // 3. 获取关联的公告数据
    const announcementIds = result.data
      .filter(i => ['announcement', 'news', 'internal_notice', 'parent_notice'].includes(i.businessType))
      .map(i => i.businessId);
    
    const announcements = await this.repository.getAnnouncements(announcementIds);

    // 4. 合并公告数据
    const instancesWithBusiness = result.data.map(instance => ({
      ...instance,
      business: announcements[instance.businessId],
    }));

    // 5. 转换直接发布的通知为伪审批实例格式
    const directInstances: ApprovalInstance[] = directAnnouncements.map(a => ({
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
      status: 'approved' as const,
      submitAt: a.createdAt,
      finishAt: a.createdAt,
      createdAt: a.createdAt || '',
      updatedAt: a.updatedAt || '',
      nodeRecords: [],
      business: a,
    }));

    // 6. 合并并排序
    let allInstances = [...instancesWithBusiness, ...directInstances]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 7. 部门过滤
    if (options.department) {
      allInstances = allInstances.filter(instance => {
        const businessDept = this.repository.getBusinessDepartment(
          instance.businessType,
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
  ): Promise<PaginatedServiceResult<ApprovalInstance>> {
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
  ): Promise<PaginatedServiceResult<ApprovalInstance>> {
    const result = await this.repository.findProcessedApprovals(userId, options);

    // 获取关联业务数据
    return this.enrichWithBusinessData(result);
  }

  /**
   * 为审批实例填充业务数据
   */
  private async enrichWithBusinessData(
    result: { data: ApprovalInstance[]; total: number; page: number; pageSize: number; totalPages: number }
  ): Promise<PaginatedServiceResult<ApprovalInstance>> {
    if (!result.data.length) {
      return { success: true, data: [], pagination: result };
    }

    // 分离不同类型的业务ID
    const announcementIds = result.data
      .filter(i => ['announcement', 'news', 'internal_notice', 'parent_notice'].includes(i.businessType))
      .map(i => i.businessId);

    const leaveIds = result.data
      .filter(i => i.businessType === 'leave_request')
      .map(i => i.businessId);

    // 获取关联数据
    const [announcements, leaveRequests] = await Promise.all([
      this.repository.getAnnouncements(announcementIds),
      this.repository.getLeaveRequests(leaveIds),
    ]);

    // 合并数据
    const enrichedData = result.data.map(instance => {
      let business = null;
      if (['announcement', 'news', 'internal_notice', 'parent_notice'].includes(instance.businessType)) {
        business = announcements[instance.businessId];
      } else if (instance.businessType === 'leave_request') {
        business = leaveRequests[instance.businessId];
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
    nodes: any[],
    instanceId: string,
    userId: string,
    userName: string,
    customFlow?: { skipDepartmentDirector?: boolean }
  ): Promise<Array<{
    instanceId: string;
    nodeOrder: number;
    nodeName: string;
    nodeType: string;
    approverIds: string[];
    status: string;
    approvedBy?: any[];
  }>> {
    const records: any[] = [];

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

    const accountIds = [...new Set((parents || []).map((p: any) => p.account_id).filter(Boolean))];
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
    const { data: users } = await this.client
      .from('users')
      .select('id')
      .neq('id', authorId);

    if (!users?.length) return;

    await this.repository.createMessages(
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
      return [...new Set((parents || []).map((p: any) => p.account_id).filter(Boolean))];
    }

    if (recipients.type === 'individual' && recipients.userIds?.length) {
      return recipients.userIds;
    }

    return [];
  }
}

// 导出单例
export const approvalService = new ApprovalService();
