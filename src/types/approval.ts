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
  | 'in_progress' // 进行中
  | 'approved'    // 已批准
  | 'rejected'    // 已拒绝
  | 'withdrawn'   // 已撤回
  | 'cancelled';  // 已取消

/** 审批状态标签 */
export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  draft: '草稿',
  pending: '待审批',
  in_progress: '进行中',
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
  selectedLeaders?: ApproverLeaderRole[]; // 选择的领导
  approvalMode?: ApprovalMode;        // 审批模式
  submitAt?: string;                  // 提交时间（兼容字段）
  submittedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** 审批节点类型 */
export type ApprovalNodeType = 
  | 'start'           // 开始节点
  | 'approval'        // 审批节点
  | 'condition'       // 条件节点
  | 'parallel'        // 并行节点
  | 'course_adjust'   // 调课节点
  | 'sync'            // 同步节点
  | 'or_sign'         // 或签节点
  | 'countersign'     // 会签节点
  | 'end';            // 结束节点

/** 审批模式 */
export type ApprovalMode = 
  | 'or'              // 或签（任一人审批即可）
  | 'and'             // 会签（所有人都需审批）
  | 'sequence'        // 顺序审批
  | 'or_sign'         // 或签（别名）
  | 'countersign';    // 会签（别名）

/** 审批领导角色 */
export type ApproverLeaderRole = 
  | 'grade_leader'            // 年段长
  | 'director'                // 部门主任
  | 'vice_principal'          // 副校长
  | 'principal'               // 校长
  | 'secretary'               // 书记
  | 'academic_vice_principal' // 教学副校长
  | 'moral_vice_principal'    // 德育副校长
  | 'general_vice_principal'; // 总务副校长

/** 审批节点记录 */
export interface ApprovalNodeRecord {
  id: string;
  nodeId: string;
  nodeName: string;
  nodeOrder: number;
  nodeType?: ApprovalNodeType;
  workflowId?: string;
  workflowType?: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  approverId?: string;
  approverName?: string;
  approverRole?: string;
  approverIds?: string[];             // 多审批人ID
  approvedBy?: Array<{
    userId?: string;
    userName?: string;
    action: string;
    comment?: string;
    time: string;
  }>;                // 实际审批人列表
  comment?: string;
  action?: string;  // 审批动作
  actionAt?: string;
  finishedAt?: string;
}

/** 提交审批请求 */
export interface SubmitApprovalRequest {
  type: ApprovalType | 'announcement' | 'news' | 'internal_notice' | 'parent_notice';
  title: string;
  summary?: string;
  urgentLevel?: 'normal' | 'urgent' | 'very_urgent';
  department?: string;
  content: Record<string, unknown>;
  attachments?: Array<{ name: string; url: string; size: number; type: string }>;
  isExternal?: boolean;
  approvalMode?: ApprovalMode;
  selectedLeaders?: ApproverLeaderRole[];
  category?: string;
  mediaLevel?: string;
  coverImage?: string;
  images?: string[];
  scheduledPublishAt?: string;
  autoUnpublish?: boolean;
  autoUnpublishAt?: string;
  recipients?: {
    type: 'all' | 'role' | 'class' | 'individual' | 'group';
    roles?: string[];
    classIds?: string[];
    userIds?: string[];
    groupIds?: string[];
  };
  customFlow?: {
    skipDepartmentDirector?: boolean;
  };
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

/** 待审批查询参数 */
export interface PendingApprovalQuery {
  userId?: string;
  status?: ApprovalStatus | 'all';
  type?: ApprovalType | 'all';
  department?: string;
  page?: number;
  pageSize?: number;
}

// ==================== 公告相关类型（重新导出） ====================

/** 公告类型 */
export type AnnouncementType = 
  | '通知' 
  | '公告' 
  | '新闻' 
  | '活动'
  | 'announcement'      // 公告（英文）
  | 'news'              // 新闻（英文）
  | 'internal_notice'   // 内部通知
  | 'parent_notice'     // 家长通知
  | 'leave_request'     // 请假通知
  | 'room_booking';     // 场地预约

/** 公告类别 */
export type AnnouncementCategory = '校园公告' | '教务公告' | '德育公告' | '总务公告' | '其他';

/** 新闻类别 */
export type NewsCategory = '学校新闻' | '教务新闻' | '德育新闻' | '总务新闻' | '媒体附小' | '其他';

/** 内部通知类别 */
export type InternalNoticeCategory = '会议通知' | '工作安排' | '制度文件' | '其他';

/** 家长通知类别 */
export type ParentNoticeCategory = '放假通知' | '活动通知' | '缴费通知' | '其他';

/** 媒体级别 */
export type MediaLevel = '校级' | '区级' | '市级' | '省级' | '国家级';

/** 部门信息 */
export interface DepartmentInfo {
  id: string;
  name: string;
  description?: string;
  requiresApproval?: boolean;
}

/** 部门列表 */
export const DEPARTMENTS: DepartmentInfo[] = [
  { id: 'principal_office', name: '校长室', description: '校长办公室', requiresApproval: true },
  { id: 'academic_affairs', name: '教务处', description: '教学管理', requiresApproval: true },
  { id: 'moral_education', name: '德育处', description: '德育管理', requiresApproval: true },
  { id: 'general_affairs', name: '总务处', description: '后勤保障', requiresApproval: true },
  { id: 'grade_1', name: '一年级组', description: '一年级级部' },
  { id: 'grade_2', name: '二年级组', description: '二年级级部' },
  { id: 'grade_3', name: '三年级组', description: '三年级级部' },
  { id: 'grade_4', name: '四年级组', description: '四年级级部' },
  { id: 'grade_5', name: '五年级组', description: '五年级级部' },
  { id: 'grade_6', name: '六年级组', description: '六年级级部' },
];

// ==================== 公告相关类型 ====================

/** 公告 */
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
  attachments?: ApprovalAttachment[];
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
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

/** 请假信息 */
export interface LeaveRequestInfo {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  duration: number;
  durationUnit: string;
  reason: string;
  needAdjustment?: boolean;
  affectedSlots?: Array<{
    date?: string;
    period?: number;
    classId?: string;
    className?: string;
    teacherId?: string;
    teacherName?: string;
    subject?: string;
  }>;
  attachments?: ApprovalAttachment[];
  status: string;
  createdAt: string;
}
