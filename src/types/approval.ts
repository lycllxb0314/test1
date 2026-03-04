/**
 * 审批流程类型定义
 * 
 * 支持多种审批场景：
 * - 公告审批：部门发布公告需经审批后发布到学校主页
 * - 新闻审批：部门发布新闻需经审批后发布到学校主页
 * - 内部通知：仅内部可见，不发布到学校主页，无需审批
 * 
 * 审批流程支持灵活配置：
 * - 可选择审批人：分管副校长、校长、书记中的任意组合
 * - 可选择审批模式：或签（任一人通过即可）、会签（所有人都要通过）
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
  | 'countersign'  // 会签（所有人都要通过）
  | 'leader_approve'; // 领导审批（动态选择审批人）

/** 审批人类型 */
export type ApproverType = 
  | 'applicant'           // 申请人自己
  | 'role'                // 按角色审批
  | 'user'                // 指定用户
  | 'group_leader'        // 群组负责人
  | 'selected_leaders';   // 选定的领导（从副校长、校长、书记中选择）

/** 可选审批领导角色 */
export type ApproverLeaderRole = 
  | 'principal'                   // 校长
  | 'secretary'                   // 书记
  | 'academic_vice_principal'     // 教学副校长
  | 'moral_vice_principal'        // 德育副校长
  | 'general_vice_principal';     // 总务副校长

/** 审批模式 */
export type ApprovalMode = 
  | 'or_sign'      // 或签：任一人通过即可
  | 'countersign'; // 会签：所有人都要通过

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
  /** 选定的领导角色（用于 leader_approve 类型） */
  selectedLeaderRoles?: ApproverLeaderRole[];
  /** 审批模式：或签/会签 */
  approvalMode?: ApprovalMode;
  isRequired: boolean;
  timeoutHours?: number;
  createdAt: string;
}

/** 审批实例 */
export interface ApprovalInstance {
  id: string;
  flowId?: string;
  flowName?: string;
  businessType: AnnouncementType;
  businessId: string;
  title: string;
  applicantId?: string;
  applicantName?: string;
  applicantDepartment?: string;
  currentNodeOrder: number;
  status: ApprovalStatus;
  submitAt?: string;
  finishAt?: string;
  /** 审批配置：选定的领导角色 */
  selectedLeaders?: ApproverLeaderRole[];
  /** 审批配置：审批模式 */
  approvalMode?: ApprovalMode;
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

// ==================== 公告/新闻/通知 ====================

/** 信息类型 
 * - announcement: 校园公告 - 发布到学校主页门户
 * - news: 新闻动态 - 发布到学校主页门户
 * - internal_notice: 内部通知 - 仅内部可见，不发布到主页
 * - parent_notice: 家长通知 - 班主任/科任教师发给家长
 */
export type AnnouncementType = 'announcement' | 'news' | 'internal_notice' | 'parent_notice';

/** 校园公告分类 */
export type AnnouncementCategory = 
  | '重要通知'
  | '活动预告'
  | '规章制度'
  | '招生信息'
  | '放假通知';

/** 新闻动态分类 */
export type NewsCategory = 
  | '校园新闻'
  | '荣誉喜报' 
  | '教育教学'
  | '媒体附小';

/** 内部通知分类 */
export type InternalNoticeCategory =
  | '会议通知'
  | '工作安排'
  | '通知公告'
  | '培训学习'
  | '其他通知';

/** 家长通知分类（班主任/科任教师发给家长） */
export type ParentNoticeCategory =
  | '班级通知'     // 班级事务、日常安排
  | '作业通知'     // 作业布置、学习任务
  | '活动通知'     // 班级活动、实践活动
  | '考试通知'     // 考试安排、成绩通知
  | '缴费通知'     // 代收费、活动费用等
  | '假期通知'     // 寒暑假、节假日安排
  | '安全提醒'     // 安全教育、注意事项
  | '家校沟通'     // 家长会、沟通交流
  | '其他通知';    // 其他事项

/** 媒体级别（媒体附小分类下使用） */
export type MediaLevel = '国家级' | '省级' | '市级';

/** 信息状态 */
export type AnnouncementStatus = 
  | 'draft'           // 草稿
  | 'pending_approval' // 待审批
  | 'approved'        // 已通过
  | 'rejected'        // 已驳回
  | 'scheduled'       // 已定时（等待定时发布）
  | 'published'       // 已发布
  | 'unpublished';    // 已下架

/** 信息发布状态（用于主页展示） */
export type PublishStatus = 
  | 'pending'         // 待发布
  | 'scheduled'       // 定时发布中
  | 'published'       // 已发布
  | 'unpublished';    // 已下架

/** 公告/新闻/通知 - 与官网首页数据格式对齐 */
export interface Announcement {
  id: string;
  title: string;
  summary?: string; // 摘要，用于首页展示
  content: string;
  type: AnnouncementType;
  category?: AnnouncementCategory | NewsCategory | InternalNoticeCategory;
  mediaLevel?: MediaLevel; // 媒体级别（媒体附小分类下使用）
  authorId?: string;
  authorName?: string;
  department: string; // 发布部门
  /** 封面图 */
  coverImage?: string;
  /** 内容图片列表 */
  images?: string[];
  /** 附件列表 */
  attachments: Attachment[];
  /** 是否发布到学校主页门户（校园公告、新闻动态为 true，内部通知为 false） */
  isExternal: boolean;
  /** 发布状态 */
  publishStatus: PublishStatus;
  /** 发布时间（实际发布时间） */
  publishedAt?: string;
  /** 定时发布时间 */
  scheduledPublishAt?: string;
  /** 下架时间 */
  unpublishedAt?: string;
  /** 是否自动下架 */
  autoUnpublish: boolean;
  /** 自动下架时间 */
  autoUnpublishAt?: string;
  /** 外部系统ID（如果同步到外部网站） */
  externalId?: string;
  /** 审批状态 */
  status: AnnouncementStatus;
  /** 浏览次数 */
  viewCount: number;
  /** 是否置顶 */
  isPinned: boolean;
  /** 置顶排序 */
  pinOrder?: number;
  /** 扩展元数据 */
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  /** 关联的审批实例 */
  approvalInstance?: ApprovalInstance;
}

/** 附件 */
export interface Attachment {
  id?: string;
  name: string;
  url: string;
  size: number;
  type: string; // MIME type
}

/** 图片 */
export interface ImageAttachment {
  id?: string;
  url: string;
  alt?: string;
  caption?: string;
  order?: number;
}

// ==================== API 请求/响应类型 ====================

/** 提交审批请求 */
export interface SubmitApprovalRequest {
  title: string;
  summary?: string; // 摘要
  content: string;
  type: AnnouncementType;
  category?: AnnouncementCategory | NewsCategory | InternalNoticeCategory;
  mediaLevel?: MediaLevel;
  department: string;
  coverImage?: string;
  images?: string[];
  attachments?: Attachment[];
  /** 是否发布到学校主页门户（校园公告、新闻动态为 true，内部通知为 false） */
  isExternal: boolean;
  /** 定时发布时间 */
  scheduledPublishAt?: string;
  /** 是否自动下架 */
  autoUnpublish?: boolean;
  /** 自动下架时间 */
  autoUnpublishAt?: string;
  /** 是否置顶 */
  isPinned?: boolean;
  /** 接收对象配置（内部通知使用） */
  recipients?: {
    type: 'all' | 'role' | 'class' | 'individual' | 'group';
    roles?: string[];
    classIds?: string[];
    userIds?: string[];
    groupIds?: string[];
  };
  /** 自定义审批流程（可选） */
  customFlow?: {
    skipDepartmentDirector?: boolean; // 是否跳过部门主任
    approvalType?: 'or_sign' | 'countersign'; // 校长室审批类型（废弃，使用 approvalMode）
    specificApprovers?: string[]; // 指定审批人ID
    /** 选定的审批领导角色 */
    selectedLeaders?: ApproverLeaderRole[];
    /** 审批模式：或签/会签 */
    approvalMode?: ApprovalMode;
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
