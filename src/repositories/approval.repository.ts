/**
 * 审批 Repository - 完整版
 * 
 * 负责所有审批相关的数据访问操作
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';

// ============================================
// 类型定义
// ============================================

export interface ApprovalInstance {
  id: string;
  flowId?: string;
  flowName?: string;
  businessType: string;
  businessId: string;
  title: string;
  applicantId: string;
  applicantName: string;
  applicantDepartment?: string;
  currentNodeOrder: number;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled';
  submitAt?: string;
  finishAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  nodeRecords?: ApprovalNodeRecord[];
  business?: any;
}

export interface ApprovalNodeRecord {
  id: string;
  instanceId: string;
  nodeOrder: number;
  nodeName: string;
  nodeType: string;
  status: string;
  approverIds: string[];
  approvedBy: Array<{
    userId?: string;
    userName?: string;
    action: string;
    comment?: string;
    time: string;
  }>;
  finalApproverId?: string;
  finalApproverName?: string;
  action?: string;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
  finishedAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  type: string;
  category?: string;
  mediaLevel?: string;
  authorId?: string;
  authorName?: string;
  department?: string;
  coverImage?: string;
  images?: string[];
  attachments?: any[];
  isExternal?: boolean;
  publishStatus?: string;
  publishedAt?: string;
  scheduledPublishAt?: string;
  unpublishedAt?: string;
  autoUnpublish?: boolean;
  autoUnpublishAt?: string;
  externalId?: string;
  status?: string;
  viewCount?: number;
  isPinned?: boolean;
  pinOrder?: number;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveRequestInfo {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  duration: number;
  durationUnit: string;
  reason: string;
  needAdjustment?: boolean;
  affectedSlots?: any[];
  attachments?: any[];
  status: string;
  createdAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// Repository 类
// ============================================

export class ApprovalRepository {
  private get client() {
    return getSupabaseClient();
  }

  // ==================== 查询操作 ====================

  /**
   * 查询用户发起的审批实例
   */
  async findMyApplications(
    applicantId: string,
    options: { status?: string; page?: number; pageSize?: number } = {}
  ): Promise<PaginatedResult<ApprovalInstance>> {
    const { status, page = 1, pageSize = 10 } = options;
    const offset = (page - 1) * pageSize;

    let query = this.client
      .from('approval_instances')
      .select('*, node_records:approval_node_records(*)', { count: 'exact' })
      .eq('applicant_id', applicantId);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[ApprovalRepository] findMyApplications error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    return {
      data: (data || []).map(item => this.mapInstance(item)),
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * 查询用户直接发布的通知（无需审批）
   */
  async findDirectAnnouncements(
    authorId: string,
    types: string[] = ['parent_notice', 'internal_notice']
  ): Promise<Announcement[]> {
    const { data, error } = await this.client
      .from('announcements')
      .select('*')
      .eq('author_id', authorId)
      .in('type', types)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ApprovalRepository] findDirectAnnouncements error:', error.message);
      return [];
    }

    return (data || []).map(a => this.mapAnnouncement(a));
  }

  /**
   * 查询待审批的实例
   */
  async findPendingApprovals(
    userId: string,
    options: { department?: string; page?: number; pageSize?: number } = {}
  ): Promise<PaginatedResult<ApprovalInstance>> {
    const { department, page = 1, pageSize = 10 } = options;

    // 获取所有进行中和待审批的实例
    const { data: instances, error } = await this.client
      .from('approval_instances')
      .select('*')
      .in('status', ['in_progress', 'pending']);

    if (error || !instances?.length) {
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    // 筛选出真正待当前用户审批的实例
    const pendingIds: string[] = [];

    for (const instance of instances) {
      // 部门过滤
      if (department) {
        const businessDept = this.getBusinessDepartment(
          instance.business_type,
          instance.applicant_department
        );
        if (businessDept !== department) continue;
      }

      // 检查节点记录
      const isPending = await this.checkUserPendingApproval(instance.id, userId, instance.current_node_order);
      if (isPending) {
        pendingIds.push(instance.id);
      }
    }

    // 分页
    const offset = (page - 1) * pageSize;
    const paginatedIds = pendingIds.slice(offset, offset + pageSize);

    if (paginatedIds.length === 0) {
      return { data: [], total: pendingIds.length, page, pageSize, totalPages: Math.ceil(pendingIds.length / pageSize) };
    }

    // 获取详细信息
    const { data: details } = await this.client
      .from('approval_instances')
      .select('*, node_records:approval_node_records(*)')
      .in('id', paginatedIds);

    return {
      data: (details || []).map(item => this.mapInstance(item)),
      total: pendingIds.length,
      page,
      pageSize,
      totalPages: Math.ceil(pendingIds.length / pageSize),
    };
  }

  /**
   * 查询用户已处理的审批
   */
  async findProcessedApprovals(
    userId: string,
    options: { department?: string; page?: number; pageSize?: number } = {}
  ): Promise<PaginatedResult<ApprovalInstance>> {
    const { department, page = 1, pageSize = 10 } = options;

    // 查找节点记录中包含当前用户审批记录的实例
    const { data: allRecords, error } = await this.client
      .from('approval_node_records')
      .select('instance_id, approved_by');

    if (error) {
      console.error('[ApprovalRepository] findProcessedApprovals error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    const processedIds = [...new Set(
      (allRecords || [])
        .filter((r: any) => {
          const approvedBy = r.approved_by || [];
          return approvedBy.some((a: any) => a.userId === userId || a.user_id === userId);
        })
        .map((r: any) => r.instance_id)
    )];

    // 部门过滤
    let filteredIds = processedIds;
    if (department && processedIds.length > 0) {
      const { data: instancesForFilter } = await this.client
        .from('approval_instances')
        .select('id, business_type, applicant_department')
        .in('id', processedIds);

      filteredIds = (instancesForFilter || [])
        .filter((inst: any) => {
          const businessDept = this.getBusinessDepartment(inst.business_type, inst.applicant_department);
          return businessDept === department;
        })
        .map((inst: any) => inst.id);
    }

    // 分页
    const offset = (page - 1) * pageSize;
    const paginatedIds = filteredIds.slice(offset, offset + pageSize);

    if (paginatedIds.length === 0) {
      return { data: [], total: filteredIds.length, page, pageSize, totalPages: Math.ceil(filteredIds.length / pageSize) };
    }

    const { data: details } = await this.client
      .from('approval_instances')
      .select('*, node_records:approval_node_records(*)')
      .in('id', paginatedIds)
      .order('created_at', { ascending: false });

    return {
      data: (details || []).map(item => this.mapInstance(item)),
      total: filteredIds.length,
      page,
      pageSize,
      totalPages: Math.ceil(filteredIds.length / pageSize),
    };
  }

  /**
   * 检查用户是否有待审批的节点
   */
  private async checkUserPendingApproval(
    instanceId: string,
    userId: string,
    currentNodeOrder: number
  ): Promise<boolean> {
    const { data: nodeRecord, error } = await this.client
      .from('approval_node_records')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('node_order', currentNodeOrder)
      .eq('status', 'pending')
      .single();

    if (error || !nodeRecord) return false;

    const approverIds = nodeRecord.approver_ids || [];
    const approvedBy = nodeRecord.approved_by || [];
    const approvedUserIds = approvedBy.map((a: any) => a.userId || a.user_id);

    // 如果审批人列表为空，任何部门成员都可以审批
    if (approverIds.length === 0) {
      return !approvedUserIds.includes(userId);
    }

    return approverIds.includes(userId) && !approvedUserIds.includes(userId);
  }

  // ==================== 业务数据查询 ====================

  /**
   * 获取关联的公告数据
   */
  async getAnnouncements(ids: string[]): Promise<Record<string, Announcement>> {
    if (!ids.length) return {};

    const { data, error } = await this.client
      .from('announcements')
      .select('*')
      .in('id', ids);

    if (error) {
      console.error('[ApprovalRepository] getAnnouncements error:', error.message);
      return {};
    }

    const result: Record<string, Announcement> = {};
    (data || []).forEach(a => {
      result[a.id] = this.mapAnnouncement(a);
    });
    return result;
  }

  /**
   * 获取关联的请假数据
   */
  async getLeaveRequests(ids: string[]): Promise<Record<string, LeaveRequestInfo>> {
    if (!ids.length) return {};

    const { data, error } = await this.client
      .from('leave_requests')
      .select('*')
      .in('id', ids);

    if (error) {
      console.error('[ApprovalRepository] getLeaveRequests error:', error.message);
      return {};
    }

    const result: Record<string, LeaveRequestInfo> = {};
    (data || []).forEach(lr => {
      result[lr.id] = {
        id: lr.id,
        type: lr.type,
        startDate: lr.start_date,
        endDate: lr.end_date,
        duration: lr.duration,
        durationUnit: lr.duration_unit,
        reason: lr.reason,
        needAdjustment: lr.need_adjustment,
        affectedSlots: lr.affected_slots,
        attachments: lr.attachments,
        status: lr.status,
        createdAt: lr.created_at,
      };
    });
    return result;
  }

  // ==================== 创建操作 ====================

  /**
   * 创建公告
   */
  async createAnnouncement(data: any): Promise<string | null> {
    const id = crypto.randomUUID();
    
    const { error } = await this.client
      .from('announcements')
      .insert({
        id,
        title: data.title,
        summary: data.summary,
        content: data.content,
        type: data.type,
        category: data.category,
        media_level: data.mediaLevel,
        author_id: data.authorId,
        author_name: data.authorName,
        department: data.department,
        cover_image: data.coverImage,
        images: data.images || [],
        attachments: data.attachments || [],
        is_external: data.isExternal,
        status: data.status || 'draft',
        publish_status: data.publishStatus || 'pending',
        scheduled_publish_at: data.scheduledPublishAt,
        auto_unpublish: data.autoUnpublish || false,
        auto_unpublish_at: data.autoUnpublishAt,
        is_pinned: data.isPinned || false,
        recipients: data.recipients,
      });

    if (error) {
      console.error('[ApprovalRepository] createAnnouncement error:', error.message);
      return null;
    }

    return id;
  }

  /**
   * 创建审批实例
   */
  async createInstance(data: {
    flowId?: string;
    flowName?: string;
    businessType: string;
    businessId: string;
    title: string;
    applicantId: string;
    applicantName: string;
    applicantDepartment?: string;
  }): Promise<string | null> {
    const id = crypto.randomUUID();

    const { error } = await this.client
      .from('approval_instances')
      .insert({
        id,
        flow_id: data.flowId,
        flow_name: data.flowName,
        business_type: data.businessType,
        business_id: data.businessId,
        title: data.title,
        applicant_id: data.applicantId,
        applicant_name: data.applicantName,
        applicant_department: data.applicantDepartment,
        current_node_order: 1,
        status: 'in_progress',
      });

    if (error) {
      console.error('[ApprovalRepository] createInstance error:', error.message);
      return null;
    }

    return id;
  }

  /**
   * 创建审批节点记录
   */
  async createNodeRecords(records: Array<{
    instanceId: string;
    nodeOrder: number;
    nodeName: string;
    nodeType: string;
    approverIds: string[];
    status: string;
    approvedBy?: any[];
  }>): Promise<boolean> {
    const nodeRecords = records.map(r => ({
      id: crypto.randomUUID(),
      instance_id: r.instanceId,
      node_order: r.nodeOrder,
      node_name: r.nodeName,
      node_type: r.nodeType,
      status: r.status,
      approver_ids: r.approverIds,
      approved_by: r.approvedBy || [],
    }));

    const { error } = await this.client
      .from('approval_node_records')
      .insert(nodeRecords);

    if (error) {
      console.error('[ApprovalRepository] createNodeRecords error:', error.message);
      return false;
    }

    return true;
  }

  // ==================== 消息发送 ====================

  /**
   * 批量创建消息
   */
  async createMessages(messages: Array<{
    title: string;
    content: string;
    type: string;
    priority?: string;
    senderId?: string;
    senderName?: string;
    recipientId: string;
    recipientType?: string;
    metadata?: any;
  }>): Promise<boolean> {
    const records = messages.map(m => ({
      id: crypto.randomUUID(),
      title: m.title,
      content: m.content,
      type: m.type,
      priority: m.priority || 'normal',
      sender_id: m.senderId,
      sender_name: m.senderName,
      recipient_id: m.recipientId,
      recipient_type: m.recipientType || 'individual',
      is_read: false,
      metadata: m.metadata,
    }));

    const { error } = await this.client
      .from('messages')
      .insert(records);

    if (error) {
      console.error('[ApprovalRepository] createMessages error:', error.message);
      return false;
    }

    return true;
  }

  // ==================== 流程查询 ====================

  /**
   * 获取审批流程
   */
  async getApprovalFlow(type: string, department: string): Promise<any | null> {
    const { data, error } = await this.client
      .from('approval_flows')
      .select('*, nodes:approval_flow_nodes(*)')
      .eq('type', type)
      .eq('department', department)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('[ApprovalRepository] getApprovalFlow error:', error.message);
      return null;
    }

    return data;
  }

  /**
   * 根据角色获取用户
   */
  async getUsersByRoles(roles: string[]): Promise<string[]> {
    const { data, error } = await this.client
      .from('users')
      .select('id')
      .in('role', roles);

    if (error) {
      console.error('[ApprovalRepository] getUsersByRoles error:', error.message);
      return [];
    }

    return (data || []).map(u => u.id);
  }

  /**
   * 获取群组成员
   */
  async getGroupMembers(groupType: string): Promise<string[]> {
    const { data, error } = await this.client
      .from('group_members')
      .select('user_id')
      .eq('group_type', groupType);

    if (error) {
      console.error('[ApprovalRepository] getGroupMembers error:', error.message);
      return [];
    }

    return (data || []).map(m => m.user_id).filter(Boolean);
  }

  // ==================== 工具方法 ====================

  /**
   * 业务类型到部门的映射
   */
  getBusinessDepartment(businessType: string, applicantDepartment?: string): string | null {
    const businessDeptMap: Record<string, string> = {
      'room_booking': 'academic',
      'activity_approval': 'moral',
      'repair_approval': 'general',
      'asset_approval': 'general',
    };

    if (businessDeptMap[businessType]) {
      return businessDeptMap[businessType];
    }

    if (businessType === 'announcement' || businessType === 'news') {
      if (applicantDepartment?.includes('教务')) return 'academic';
      if (applicantDepartment?.includes('德育')) return 'moral';
      if (applicantDepartment?.includes('总务')) return 'general';
    }

    if (businessType === 'leave_request') {
      return null;
    }

    return null;
  }

  /**
   * 映射审批实例
   */
  private mapInstance(item: any): ApprovalInstance {
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
      nodeRecords: item.node_records?.map((nr: any) => this.mapNodeRecord(nr)),
    };
  }

  /**
   * 映射节点记录
   */
  private mapNodeRecord(nr: any): ApprovalNodeRecord {
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

  /**
   * 映射公告数据
   */
  private mapAnnouncement(a: any): Announcement {
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
}

// 导出单例
export const approvalRepository = new ApprovalRepository();
