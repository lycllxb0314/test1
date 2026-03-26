/**
 * 审批 Repository
 */

import { BaseRepository, PaginatedResult } from './base.repository';
import type { ApprovalInstance, ApprovalFlow, ApprovalNodeRecord } from '@/types/approval';

/**
 * 审批实例查询筛选
 */
export interface ApprovalFilters {
  applicantId?: string;
  status?: string;
  businessType?: string;
  currentNodeOrder?: number;
}

/**
 * 审批 Repository
 */
export class ApprovalRepository extends BaseRepository<ApprovalInstance> {
  constructor() {
    super('approval_instances');
  }
  
  /**
   * 查询审批实例（包含节点记录）
   */
  async findByIdWithNodes(id: string): Promise<{
    instance: ApprovalInstance | null;
    nodeRecords: ApprovalNodeRecord[];
  }> {
    const [instanceResult, nodesResult] = await Promise.all([
      this.findById(id),
      this.client
        .from('approval_node_records')
        .select('*')
        .eq('instance_id', id)
        .order('node_order', { ascending: true })
    ]);
    
    return {
      instance: instanceResult,
      nodeRecords: (nodesResult.data || []) as ApprovalNodeRecord[],
    };
  }
  
  /**
   * 查询我发起的审批
   */
  async findMyApplications(
    applicantId: string,
    options: { status?: string; page?: number; pageSize?: number } = {}
  ): Promise<PaginatedResult<ApprovalInstance>> {
    const { status, page = 1, pageSize = 10 } = options;
    
    let query = this.client
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .eq('applicant_id', applicantId);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('[ApprovalRepository] findMyApplications error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
    
    return {
      data: (data || []) as ApprovalInstance[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }
  
  /**
   * 查询待我审批的申请
   */
  async findPendingApprovals(
    approverId: string,
    options: { page?: number; pageSize?: number } = {}
  ): Promise<PaginatedResult<ApprovalInstance>> {
    const { page = 1, pageSize = 10 } = options;
    
    // 通过节点记录表查询待审批的实例
    const { data: nodeRecords, error: nodeError } = await this.client
      .from('approval_node_records')
      .select('instance_id')
      .eq('status', 'pending')
      .contains('approver_ids', [approverId]);
    
    if (nodeError || !nodeRecords?.length) {
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
    
    const instanceIds = [...new Set(nodeRecords.map(n => n.instance_id))];
    
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error, count } = await this.client
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .in('id', instanceIds)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error('[ApprovalRepository] findPendingApprovals error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
    
    return {
      data: (data || []) as ApprovalInstance[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }
  
  /**
   * 查询我已处理的审批
   */
  async findProcessedApprovals(
    approverId: string,
    options: { page?: number; pageSize?: number } = {}
  ): Promise<PaginatedResult<ApprovalInstance>> {
    const { page = 1, pageSize = 10 } = options;
    
    // 查询我已处理的节点记录
    const { data: nodeRecords, error: nodeError } = await this.client
      .from('approval_node_records')
      .select('instance_id')
      .neq('status', 'pending')
      .contains('approved_by', [{ userId: approverId }]);
    
    if (nodeError || !nodeRecords?.length) {
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
    
    const instanceIds = [...new Set(nodeRecords.map(n => n.instance_id))];
    
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error, count } = await this.client
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .in('id', instanceIds)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error('[ApprovalRepository] findProcessedApprovals error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
    
    return {
      data: (data || []) as ApprovalInstance[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }
  
  /**
   * 创建审批实例（同时创建节点记录）
   */
  async createWithNodes(
    instance: Partial<ApprovalInstance>,
    nodes: Partial<ApprovalNodeRecord>[]
  ): Promise<ApprovalInstance | null> {
    // 创建实例
    const newInstance = await this.create(instance);
    if (!newInstance) return null;
    
    // 创建节点记录
    const nodeRecords = nodes.map(node => ({
      ...node,
      instance_id: newInstance.id,
    }));
    
    const { error } = await this.client
      .from('approval_node_records')
      .insert(nodeRecords);
    
    if (error) {
      console.error('[ApprovalRepository] createWithNodes error:', error.message);
      // 回滚：删除已创建的实例
      await this.delete(newInstance.id);
      return null;
    }
    
    return newInstance;
  }
  
  /**
   * 更新节点状态
   */
  async updateNodeStatus(
    nodeId: string,
    status: string,
    approvedBy: { userId: string; userName: string; action: string; comment?: string }
  ): Promise<boolean> {
    // 先获取当前节点
    const { data: node, error: fetchError } = await this.client
      .from('approval_node_records')
      .select('*')
      .eq('id', nodeId)
      .single();
    
    if (fetchError || !node) {
      console.error('[ApprovalRepository] updateNodeStatus fetch error:', fetchError?.message);
      return false;
    }
    
    const approvedByList = node.approved_by || [];
    approvedByList.push({
      ...approvedBy,
      time: new Date().toISOString(),
    });
    
    const { error } = await this.client
      .from('approval_node_records')
      .update({
        status,
        approved_by: approvedByList,
        final_approver_id: approvedBy.userId,
        final_approver_name: approvedBy.userName,
        action: approvedBy.action,
        comment: approvedBy.comment,
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', nodeId);
    
    if (error) {
      console.error('[ApprovalRepository] updateNodeStatus error:', error.message);
      return false;
    }
    
    return true;
  }
  
  /**
   * 推进审批流程
   */
  async advanceInstance(
    instanceId: string,
    nextNodeOrder: number | null,
    status: 'pending' | 'approved' | 'rejected' | 'withdrawn'
  ): Promise<boolean> {
    const updateData: any = {
      current_node_order: nextNodeOrder,
      status,
      updated_at: new Date().toISOString(),
    };
    
    if (status !== 'pending') {
      updateData.finished_at = new Date().toISOString();
    }
    
    const { error } = await this.client
      .from(this.tableName)
      .update(updateData)
      .eq('id', instanceId);
    
    if (error) {
      console.error('[ApprovalRepository] advanceInstance error:', error.message);
      return false;
    }
    
    return true;
  }
  
  /**
   * 获取审批统计
   */
  async getStatistics(department?: string): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  }> {
    let baseQuery = this.client
      .from(this.tableName)
      .select('status', { count: 'exact', head: true });
    
    if (department) {
      // 根据申请人部门筛选
      baseQuery = baseQuery.ilike('applicant_department', `%${department}%`);
    }
    
    const [pending, approved, rejected, total] = await Promise.all([
      this.count({ status: 'pending', ...(department && { applicant_department: department }) } as any),
      this.count({ status: 'approved', ...(department && { applicant_department: department }) } as any),
      this.count({ status: 'rejected', ...(department && { applicant_department: department }) } as any),
      department 
        ? this.client.from(this.tableName).select('*', { count: 'exact', head: true }).ilike('applicant_department', `%${department}%`).then(r => r.count || 0)
        : this.count()
    ]);
    
    return { pending, approved, rejected, total };
  }
}

// 导出单例
export const approvalRepository = new ApprovalRepository();
