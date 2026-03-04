/**
 * 审批流程类型定义
 * 
 * 支持多种审批场景：
 * - 公告审批：部门发布公告需经审批后发布到学校主页
 * - 新闻审批：部门发布新闻需经审批后发布到学校主页
 */

// ==================== 审批流程类型 ====================

/** 审批流程类型 */
export type ApprovalFlowType = 
  | 'announcement_approval'  // 公告审批
  | 'news_approval';         // 新闻审批

/** 审批节点类型 */
export type ApprovalNodeType = 
  | 'submit'       // 提交节点
  | 'approve'      // 单人审批
  | 'or_sign'      // 或签（任一人通过即可）
  | 'countersign'; // 会签（所有人都要通过）

/** 审批人类型 */
export type ApproverType = 
  | 'applicant'    // 申请人自己
  | 'role'         // 按角色审批
  | 'user'         // 指定用户
  | 'group_leader'; // 群组负责人

/** 审批实例状态 */
export type ApprovalStatus = 
  | 'draft'        // 草稿
  | 'pending'      // 待提交
  | 'in_progress'  // 审批中
  | 'approved'     // 已通过
  | 'rejected'     // 已驳回
  | 'withdrawn';   // 已撤回

/** 审批操作 */
export type ApprovalAction = 
  | 'submit'    // 提交
  | 'approve'   // 通过
  | 'reject'    // 驳回
  | 'return'    // 退回
  | 'withdraw'  // 撤回
  | 'skip';     // 跳过

// ==================== 审批实体 ====================

/** 审批流程定义 */
export interface ApprovalFlow {
  id: string;
  name: string;
  description?: string;
  type: ApprovalFlowType;
  department: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  /** 流程节点 */
  nodes?: ApprovalFlowNode[];
}

/** 审批流程节点 */
export interface ApprovalFlowNode {
  id: string;
  flowId: string;
  nodeType: ApprovalNodeType;
  nodeName: string;
  nodeOrder: number;
  approverType: ApproverType;
  approverRoles: string[];
  approverUserIds: string[];
  isRequired: boolean;
  timeoutHours?: number;
  createdAt: string;
}

/** 审批实例 */
export interface ApprovalInstance {
  id: string;
  flowId?: string;
  flowName?: string;
  businessType: 'announcement' | 'news';
  businessId: string;
  title: string;
  applicantId?: string;
  applicantName?: string;
  applicantDepartment?: string;
  currentNodeOrder: number;
  status: ApprovalStatus;
  submitAt?: string;
  finishAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  /** 审批节点记录 */
  nodeRecords?: ApprovalNodeRecord[];
  /** 关联的业务对象 */
  business?: Announcement;
}

/** 审批节点记录 */
export interface ApprovalNodeRecord {
  id: string;
  instanceId: string;
  nodeOrder: number;
  nodeName: string;
  nodeType: ApprovalNodeType;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  /** 所有需要审批的用户ID */
  approverIds: string[];
  /** 已审批的用户 */
  approvedBy: ApprovalActionRecord[];
  /** 最终审批人（或签时） */
  finalApproverId?: string;
  finalApproverName?: string;
  action?: ApprovalAction;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  finishedAt?: string;
}

/** 审批操作记录 */
export interface ApprovalActionRecord {
  userId: string;
  userName: string;
  action: 'approved' | 'rejected' | 'returned';
  comment?: string;
  time: string;
}

// ==================== 公告/新闻 ====================

/** 公告/新闻类型 */
export type AnnouncementType = 'announcement' | 'news';

/** 公告状态 */
export type AnnouncementStatus = 
  | 'draft'           // 草稿
  | 'pending_approval' // 待审批
  | 'approved'        // 已通过
  | 'rejected'        // 已驳回
  | 'published';      // 已发布

/** 公告/新闻 */
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  category?: string;
  authorId?: string;
  authorName?: string;
  department: string; // 发布部门
  coverImage?: string;
  attachments: Attachment[];
  isPublished: boolean;
  isExternal: boolean; // 是否发布到外部学校主页
  publishedAt?: string;
  externalId?: string;
  status: AnnouncementStatus;
  viewCount: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  /** 关联的审批实例 */
  approvalInstance?: ApprovalInstance;
}

/** 附件 */
export interface Attachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

// ==================== API 请求/响应类型 ====================

/** 提交审批请求 */
export interface SubmitApprovalRequest {
  title: string;
  content: string;
  type: AnnouncementType;
  category?: string;
  department: string;
  coverImage?: string;
  attachments?: Attachment[];
  isExternal: boolean; // 是否发布到外部
  /** 自定义审批流程（可选） */
  customFlow?: {
    skipDepartmentDirector?: boolean; // 是否跳过部门主任
    approvalType?: 'or_sign' | 'countersign'; // 校长室审批类型
    specificApprovers?: string[]; // 指定审批人ID
  };
}

/** 审批操作请求 */
export interface ApprovalActionRequest {
  instanceId: string;
  action: 'approve' | 'reject' | 'return' | 'withdraw';
  comment?: string;
}

/** 待审批列表查询参数 */
export interface PendingApprovalQuery {
  status?: ApprovalStatus;
  department?: string;
  page?: number;
  pageSize?: number;
}

/** 发布通知请求 */
export interface PublishNotificationRequest {
  title: string;
  content: string;
  event: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  recipients: {
    type: 'all' | 'role' | 'class' | 'individual' | 'group';
    roles?: string[];
    classIds?: string[];
    userIds?: string[];
    groupIds?: string[];
  };
  /** 是否同时发布到学校主页 */
  publishToExternal?: boolean;
  externalType?: 'announcement' | 'news';
}

// ==================== 部门配置 ====================

/** 部门信息 */
export interface DepartmentConfig {
  id: string;
  name: string;
  shortName: string;
  directorRole: string;
  description: string;
  canPublishExternal: boolean; // 是否可发布到外部
  requiresApproval: boolean; // 发布是否需要审批
}

/** 部门配置列表 */
export const DEPARTMENTS: DepartmentConfig[] = [
  {
    id: 'principal_office',
    name: '校长室',
    shortName: '校长室',
    directorRole: 'principal',
    description: '校级重大事件发布',
    canPublishExternal: true,
    requiresApproval: false,
  },
  {
    id: 'academic_office',
    name: '教务处',
    shortName: '教务处',
    directorRole: 'academic_director',
    description: '教务相关业务发布',
    canPublishExternal: true,
    requiresApproval: true,
  },
  {
    id: 'moral_office',
    name: '德育处',
    shortName: '德育处',
    directorRole: 'moral_director',
    description: '德育相关业务发布',
    canPublishExternal: true,
    requiresApproval: true,
  },
  {
    id: 'general_office',
    name: '总务处',
    shortName: '总务处',
    directorRole: 'general_director',
    description: '总务后勤相关业务发布',
    canPublishExternal: true,
    requiresApproval: true,
  },
];
