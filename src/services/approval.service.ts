/**
 * 审批服务
 * 
 * 处理审批相关的业务逻辑
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { approvalRepository, ApprovalRepository, messageRepository } from '@/repositories';
import type { ApprovalInstance, ApprovalNodeRecord } from '@/types/approval';

/**
 * 提交审批参数
 */
export interface SubmitApprovalParams {
  flowId: string;
  flowName: string;
  businessType: string;
  businessId: string;
  title: string;
  applicantId: string;
  applicantName: string;
  applicantDepartment?: string;
  nodes: ApprovalNodeParams[];
}

/**
 * 审批节点参数
 */
export interface ApprovalNodeParams {
  nodeOrder: number;
  nodeName: string;
  nodeType: 'single' | 'any' | 'all';
  approverIds: string[];
}

/**
 * 审批动作参数
 */
export interface ApprovalActionParams {
  instanceId: string;
  nodeId: string;
  action: 'approve' | 'reject';
  comment?: string;
  approverId: string;
  approverName: string;
}

/**
 * 审批服务
 */
export class ApprovalService extends BaseService {
  private repository = approvalRepository;
  
  /**
   * 提交审批申请
   */
  async submitApproval(params: SubmitApprovalParams): Promise<ServiceResult<ApprovalInstance>> {
    // 创建审批实例
    const instance = await this.repository.create({
      flow_id: params.flowId,
      flow_name: params.flowName,
      business_type: params.businessType,
      business_id: params.businessId,
      title: params.title,
      applicant_id: params.applicantId,
      applicant_name: params.applicantName,
      applicant_department: params.applicantDepartment,
      current_node_order: 1,
      status: 'pending',
      submit_at: new Date().toISOString(),
    } as any);
    
    if (!instance) {
      return this.fail('提交审批失败', 'SUBMIT_FAILED');
    }
    
    // 创建审批节点记录
    const nodeRecords = params.nodes.map(node => ({
      instance_id: instance.id,
      node_order: node.nodeOrder,
      node_name: node.nodeName,
      node_type: node.nodeType,
      status: node.nodeOrder === 1 ? 'pending' : 'waiting',
      approver_ids: node.approverIds,
      approved_by: [],
    }));
    
    const { error } = await this.repository['client']
      .from('approval_node_records')
      .insert(nodeRecords);
    
    if (error) {
      // 回滚：删除已创建的实例
      await this.repository.delete(instance.id);
      return this.fail('创建审批节点失败', 'NODE_CREATE_FAILED');
    }
    
    // 发送通知给第一节点审批人
    const firstNode = params.nodes[0];
    if (firstNode) {
      await this.sendNotification(
        '新的审批待处理',
        `您有一个新的审批需要处理：${params.title}`,
        firstNode.approverIds,
        { type: 'approval', senderId: params.applicantId, senderName: params.applicantName }
      );
    }
    
    return this.ok(instance);
  }
  
  /**
   * 审批操作（同意/拒绝）
   */
  async processApproval(params: ApprovalActionParams): Promise<ServiceResult<ApprovalInstance>> {
    // 获取审批实例和节点
    const { instance, nodeRecords } = await this.repository.findByIdWithNodes(params.instanceId);
    
    if (!instance) {
      return this.fail('审批实例不存在', 'INSTANCE_NOT_FOUND');
    }
    
    const currentNode = nodeRecords.find(n => n.id === params.nodeId);
    if (!currentNode) {
      return this.fail('审批节点不存在', 'NODE_NOT_FOUND');
    }
    
    // 检查是否有权限审批
    if (!(currentNode as any).approver_ids?.includes(params.approverId)) {
      return this.fail('无权限审批', 'FORBIDDEN');
    }
    
    // 检查是否已审批过
    const approvedBy = (currentNode as any).approved_by || [];
    const hasApproved = approvedBy.some((a: any) => a.userId === params.approverId);
    if (hasApproved) {
      return this.fail('已审批过', 'ALREADY_APPROVED');
    }
    
    // 更新节点状态
    const nodeStatus = params.action === 'approve' ? 'approved' : 'rejected';
    const updateSuccess = await this.repository.updateNodeStatus(
      params.nodeId,
      nodeStatus,
      {
        userId: params.approverId,
        userName: params.approverName,
        action: params.action,
        comment: params.comment,
      }
    );
    
    if (!updateSuccess) {
      return this.fail('更新审批状态失败', 'UPDATE_FAILED');
    }
    
    // 判断是否需要推进流程
    if (params.action === 'reject') {
      // 拒绝：整个审批结束
      await this.repository.advanceInstance(params.instanceId, null, 'rejected');
      
      // 通知申请人
      await this.sendNotification(
        '审批已拒绝',
        `您的审批申请已被拒绝：${instance.title}`,
        [(instance as any).applicant_id],
        { type: 'approval' }
      );
      
      return this.ok({ ...instance, status: 'rejected' } as ApprovalInstance);
    }
    
    // 同意：检查节点是否完成
    const nodeType = (currentNode as any).node_type;
    const allApprovers = (currentNode as any).approver_ids || [];
    
    let nodeComplete = false;
    if (nodeType === 'single') {
      // 单人审批：一人通过即可
      nodeComplete = true;
    } else if (nodeType === 'any') {
      // 任一人通过即可
      nodeComplete = true;
    } else if (nodeType === 'all') {
      // 所有人都需通过
      const approvedCount = approvedBy.length + 1;
      nodeComplete = approvedCount >= allApprovers.length;
    }
    
    if (!nodeComplete) {
      // 节点未完成，等待其他人审批
      return this.ok(instance);
    }
    
    // 节点完成，检查是否有下一节点
    const nextNodeOrder = (instance as any).current_node_order + 1;
    const nextNode = nodeRecords.find(n => (n as any).node_order === nextNodeOrder);
    
    if (!nextNode) {
      // 没有下一节点，审批通过
      await this.repository.advanceInstance(params.instanceId, null, 'approved');
      
      // 通知申请人
      await this.sendNotification(
        '审批已通过',
        `您的审批申请已通过：${instance.title}`,
        [(instance as any).applicant_id],
        { type: 'approval' }
      );
      
      return this.ok({ ...instance, status: 'approved' } as ApprovalInstance);
    }
    
    // 推进到下一节点
    await this.repository.advanceInstance(params.instanceId, nextNodeOrder, 'pending');
    
    // 激活下一节点
    await this.repository['client']
      .from('approval_node_records')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', nextNode.id);
    
    // 通知下一节点审批人
    await this.sendNotification(
      '新的审批待处理',
      `您有一个新的审批需要处理：${instance.title}`,
      (nextNode as any).approver_ids || [],
      { type: 'approval' }
    );
    
    return this.ok(instance);
  }
  
  /**
   * 撤回审批申请
   */
  async withdrawApproval(
    instanceId: string,
    applicantId: string
  ): Promise<ServiceResult> {
    const { instance } = await this.repository.findByIdWithNodes(instanceId);
    
    if (!instance) {
      return this.fail('审批实例不存在', 'INSTANCE_NOT_FOUND');
    }
    
    // 只有申请人可以撤回
    if ((instance as any).applicant_id !== applicantId) {
      return this.fail('只有申请人可以撤回', 'FORBIDDEN');
    }
    
    // 只能撤回待审批的
    if ((instance as any).status !== 'pending') {
      return this.fail('审批已处理，无法撤回', 'ALREADY_PROCESSED');
    }
    
    // 更新状态
    const success = await this.repository.advanceInstance(instanceId, null, 'withdrawn');
    
    if (!success) {
      return this.fail('撤回失败', 'UPDATE_FAILED');
    }
    
    return this.ok();
  }
  
  /**
   * 获取我发起的审批
   */
  async getMyApplications(
    applicantId: string,
    options: { status?: string; page?: number; pageSize?: number } = {}
  ): Promise<PaginatedServiceResult<ApprovalInstance>> {
    const result = await this.repository.findMyApplications(applicantId, options);
    
    return {
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }
  
  /**
   * 获取待我审批的申请
   */
  async getPendingApprovals(
    approverId: string,
    options: { page?: number; pageSize?: number } = {}
  ): Promise<PaginatedServiceResult<ApprovalInstance>> {
    const result = await this.repository.findPendingApprovals(approverId, options);
    
    return {
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }
  
  /**
   * 获取我已处理的审批
   */
  async getProcessedApprovals(
    approverId: string,
    options: { page?: number; pageSize?: number } = {}
  ): Promise<PaginatedServiceResult<ApprovalInstance>> {
    const result = await this.repository.findProcessedApprovals(approverId, options);
    
    return {
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }
  
  /**
   * 获取审批详情
   */
  async getApprovalDetail(
    instanceId: string
  ): Promise<ServiceResult<{ instance: ApprovalInstance | null; nodeRecords: ApprovalNodeRecord[] }>> {
    const result = await this.repository.findByIdWithNodes(instanceId);
    
    if (!result.instance) {
      return this.fail<{ instance: ApprovalInstance | null; nodeRecords: ApprovalNodeRecord[] }>('审批实例不存在', 'INSTANCE_NOT_FOUND');
    }
    
    return this.ok(result);
  }
  
  /**
   * 获取审批统计
   */
  async getStatistics(department?: string): Promise<ServiceResult<{
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  }>> {
    const stats = await this.repository.getStatistics(department);
    return this.ok(stats);
  }
}

// 导出单例
export const approvalService = new ApprovalService();
