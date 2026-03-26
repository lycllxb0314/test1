/**
 * 审批类型定义
 * 
 * @module types/approval
 */

import type { AdministrativeRole, UserRole } from './user';

// ==================== 审批类型 ====================

/** 审批业务类型 */
export type ApprovalType = 
  | 'leave'           // 请假审批
  | 'course_adjust'   // 调课审批
  | 'resource'        // 资源申请
  | 'purchase'        // 采购申请
  | 'repair'          // 维修申请
  | 'reimbursement'   // 报销申请
  | 'other';          // 其他审批

/** 审批类型标签 */
export const APPROVAL_TYPE_LABELS: Record<ApprovalType, string> = {
  leave: '请假审批',
  course_adjust: '调课审批',
  resource: '资源申请',
  purchase: '采购申请',
  repair: '维修申请',
  reimbursement: '报销申请',
  other: '其他审批',
};

// ==================== 审批状态 ====================

/** 审批状态 */
export type ApprovalStatus = 
  | 'draft'       // 草稿
  | 'pending'     // 待审批
  | 'approved'    // 已批准
  | 'rejected'    // 已拒绝
  | 'withdrawn'   // 已撤回
  | 'cancelled';  // 已取消

/** 审批状态标签 */
export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  draft: '草稿',
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝',
  withdrawn: '已撤回',
  cancelled: '已取消',
};

// ==================== 审批流程 ====================

/** 审批步骤状态 */
export type ApprovalStepStatus = 'pending' | 'approved' | 'rejected' | 'skipped';

/** 审批步骤 */
export interface ApprovalStep {
  id: string;
  approvalId: string;
  step: number;
  stepType: ApprovalStepType;
  stepTypeName: string;
  approverId?: string;
  approverName?: string;
  approverRole?: AdministrativeRole | UserRole;
  status: ApprovalStepStatus;
  actionAt?: string;
  comment?: string;
  isCurrent: boolean;
  createdAt: string;
}

/** 审批步骤类型 */
export type ApprovalStepType = 
  | 'submitter'            // 提交人
  | 'head_teacher'         // 班主任
  | 'grade_leader'         // 年段长
  | 'director'             // 部门主任
  | 'vice_principal'       // 副校长
  | 'principal'            // 校长
  | 'finance'              // 财务
  | 'auto_approve';        // 自动审批

/** 审批流程配置 */
export interface ApprovalFlowConfig {
  id: string;
  type: ApprovalType;
  name: string;
  description?: string;
  steps: ApprovalFlowStepConfig[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 审批流程步骤配置 */
export interface ApprovalFlowStepConfig {
  step: number;
  stepType: ApprovalStepType;
  stepTypeName: string;
  requiredRole?: AdministrativeRole;
  autoApproveCondition?: {
    field: string;
    operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'ne';
    value: number | string;
  };
  skipCondition?: {
    field: string;
    operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'ne';
    value: number | string;
  };
}

// ==================== 审批申请 ====================

/** 审批申请基础信息 */
export interface Approval {
  id: string;
  type: ApprovalType;
  typeName: string;
  title: string;
  applicantId: string;
  applicantName: string;
  applicantRole?: UserRole;
  department?: string;
  status: ApprovalStatus;
  currentStep?: number;
  currentApproverId?: string;
  currentApproverName?: string;
  urgentLevel: 'normal' | 'urgent' | 'very_urgent';
  content: Record<string, unknown>;
  attachments?: ApprovalAttachment[];
  steps: ApprovalStep[];
  submittedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** 审批附件 */
export interface ApprovalAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

/** 创建审批申请请求 */
export interface CreateApprovalRequest {
  type: ApprovalType;
  title: string;
  urgentLevel?: 'normal' | 'urgent' | 'very_urgent';
  content: Record<string, unknown>;
  attachments?: Array<{ name: string; url: string; size: number; type: string }>;
}

/** 审批操作请求 */
export interface ApprovalActionRequest {
  approvalId: string;
  instanceId?: string;                // 审批实例ID（兼容旧字段）
  action: 'approve' | 'reject' | 'withdraw' | 'return';
  comment?: string;
}

/** 审批实例（完整审批流程实例） */
export interface ApprovalInstance {
  id: string;
  type: ApprovalType;
  typeName: string;
  businessType?: string;              // 业务类型（兼容字段）
  title: string;
  applicantId: string;
  applicantName: string;
  applicantRole?: UserRole;
  applicantDepartment?: string;       // 申请人部门
  department?: string;
  status: ApprovalStatus;
  currentStep: number;
  currentNodeOrder?: number;          // 当前节点顺序
  currentApproverId?: string;
  currentApproverName?: string;
  urgentLevel: 'normal' | 'urgent' | 'very_urgent';
  content: Record<string, unknown>;
  business?: Record<string, unknown>; // 业务数据
  metadata?: Record<string, unknown>; // 元数据
  attachments?: ApprovalAttachment[];
  steps: ApprovalStep[];
  approvalFlow: ApprovalNode[];
  nodeRecords?: ApprovalNodeRecord[]; // 节点记录
  submittedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** 审批节点记录 */
export interface ApprovalNodeRecord {
  id: string;
  nodeId: string;
  nodeName: string;
  nodeOrder: number;
  status: 'pending' | 'approved' | 'rejected';
  approverId?: string;
  approverName?: string;
  comment?: string;
  actionAt?: string;
}

/** 提交审批请求 */
export interface SubmitApprovalRequest {
  type: ApprovalType;
  title: string;
  urgentLevel?: 'normal' | 'urgent' | 'very_urgent';
  department?: string;
  content: Record<string, unknown>;
  attachments?: Array<{ name: string; url: string; size: number; type: string }>;
}

/** 审批节点（工作流节点） */
export interface ApprovalNode {
  id: string;
  name: string;
  approverRole: UserRole | AdministrativeRole | (UserRole | AdministrativeRole)[];
  approverId?: string;
  approverName?: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  approvedAt?: string;
}

// ==================== 审批统计 ====================

/** 审批统计 */
export interface ApprovalStatistics {
  userId: string;
  asApplicant: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  asApprover: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  byType: Record<ApprovalType, { total: number; pending: number; approved: number }>;
}

// ==================== 审批筛选 ====================

/** 审批筛选条件 */
export interface ApprovalFilters {
  type?: ApprovalType | 'all';
  status?: ApprovalStatus | 'all';
  applicantId?: string;
  approverId?: string;
  urgentLevel?: 'normal' | 'urgent' | 'very_urgent' | 'all';
  startDate?: string;
  endDate?: string;
}
