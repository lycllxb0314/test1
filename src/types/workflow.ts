/**
 * 工作流类型定义
 * 
 * @module types/workflow
 */

import type { UserRole, AdministrativeRole } from './user';

// ==================== 工作流配置 ====================

/** 工作流状态 */
export type WorkflowStatus = 
  | 'draft'        // 草稿
  | 'pending'      // 待审批
  | 'approved'     // 已通过
  | 'rejected'     // 已拒绝
  | 'cancelled';   // 已取消

/** 工作流类型 */
export type WorkflowType = 'leave' | 'repair' | 'purchase' | 'course_adjust';

/** 节点类型 */
export type NodeType = 'start' | 'approval' | 'condition' | 'parallel' | 'course_adjust' | 'sync' | 'end';

/** 拒绝处理方式 */
export type RejectAction = 
  | 'return_to_applicant'
  | 'return_to_previous'
  | 'return_to_specific'
  | 'end_process';

/** 条件操作符 */
export type ConditionOperator = 
  | 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in';

/** 条件规则 */
export interface ConditionRule {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string | number | string[];
  label?: string;
}

/** 条件分支 */
export interface ConditionBranch {
  id: string;
  name: string;
  conditionType: 'all' | 'any' | 'expression';
  rules: ConditionRule[];
  nextNodeId: string;
}

/** 工作流节点配置 */
export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  description?: string;
  
  // 审批节点配置
  approverType?: 'role' | 'specific' | 'applicant_leader';
  approverRole?: UserRole | AdministrativeRole;
  approverId?: string;
  approverName?: string;
  
  // 审批设置
  isRequired?: boolean;
  allowTransfer?: boolean;
  timeout?: number;
  timeoutAction?: 'auto_approve' | 'auto_reject' | 'escalate';
  
  // 拒绝处理
  rejectAction?: RejectAction;
  rejectReturnNodeId?: string;
  
  // 附件配置
  attachmentConfig?: {
    enabled: boolean;
    required: boolean;
    description?: string;
    maxFiles?: number;
    acceptTypes?: string[];
  };
  
  // 条件节点配置
  branches?: ConditionBranch[];
  defaultBranchId?: string;
  
  // 并行节点配置
  parallelNodes?: string[];
  mergeType?: 'all' | 'any';
  
  // 调课节点配置
  courseAdjustConfig?: {
    assigneeType?: 'grade_leader' | 'academic_staff' | 'specific';
    assigneeId?: string;
    assigneeName?: string;
    adjustTypes?: ('substitute' | 'swap' | 'cancel' | 'makeup')[];
    substituteMode?: 'auto_recommend' | 'manual_select' | 'both';
    allowAnyTeacher?: boolean;
    restrictBySubject?: boolean;
    preferSameGrade?: boolean;
    allowCrossWeek?: boolean;
    maxAdvanceDays?: number;
    deadlineBeforeClass?: number;
    syncTargets?: {
      teacherSchedule?: boolean;
      academicSchedule?: boolean;
      classSchedule?: boolean;
      electronicBoard?: boolean;
      teacherAttendance?: boolean;
    };
    notifySubstituteTeacher?: boolean;
    notifyOriginalTeacher?: boolean;
    notifyClassStudents?: boolean;
    notifyClassParents?: boolean;
    notifyHeadTeacher?: boolean;
    requireReason?: boolean;
    requireApproval?: boolean;
  };
}

/** 工作流配置 */
export interface WorkflowConfig {
  id: string;
  type: WorkflowType;
  name: string;
  description?: string;
  isActive: boolean;
  nodes: WorkflowNode[];
  startNodeId: string;
  endNodeId: string;
  formFields?: WorkflowFormField[];
  version: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

/** 表单字段 */
export interface WorkflowFormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'file' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean;
  options?: { label: string; value: string | number }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// ==================== 工作流实例 ====================

/** 审批节点 */
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

/** 工作流实例 */
export interface WorkflowInstance {
  id: string;
  type: WorkflowType;
  configId: string;
  applicantId: string;
  applicantName: string;
  applicantRole: UserRole;
  title: string;
  content: Record<string, unknown>;
  status: WorkflowStatus;
  approvalFlow: ApprovalNode[];
  currentNodeId?: string;
  currentStep: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** 审批记录 */
export interface ApprovalRecord {
  id: string;
  instanceId: string;
  workflowType: WorkflowType;
  nodeId: string;
  nodeName: string;
  approverId: string;
  approverName: string;
  approverRole: string;
  action: 'approve' | 'reject' | 'transfer' | 'withdraw' | 'submit';
  comment?: string;
  returnToNodeId?: string;
  createdAt: string;
}
