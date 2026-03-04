/**
 * 消息系统类型定义
 * 
 * 支持多种通知场景：
 * - 全员通知：通知所有角色
 * - 角色通知：通知特定角色（班主任、科任、家长等）
 * - 班级通知：通知特定班级的所有成员（教师+家长+学生）
 * - 个人通知：通知特定个人
 */

// ==================== 消息类型 ====================

/** 消息事件类型 */
export type MessageEvent = 
  // === 系统通知 ===
  | 'system_announcement'      // 系统公告
  | 'maintenance_notice'       // 维护通知
  | 'policy_update'           // 政策更新
  // === 教务通知 ===
  | 'schedule_change'          // 调课通知
  | 'exam_notice'             // 考试通知
  | 'grade_publish'           // 成绩发布
  | 'homework_assign'         // 作业布置
  // === 德育通知 ===
  | 'activity_notice'          // 活动通知
  | 'honor_notice'            // 荣誉通知
  | 'moral_evaluation'        // 德育评价
  // === 家校沟通 ===
  | 'parent_meeting'          // 家长会通知
  | 'student_absence'         // 学生缺勤通知
  | 'habit_record'            // 习惯记录提醒
  | 'leave_approval'          // 请假审批
  // === 总务通知 ===
  | 'repair_notice'           // 报修通知
  | 'asset_notice'            // 资产通知
  | 'safety_alert'            // 安全警报
  // === 个人消息 ===
  | 'personal_message'        // 个人消息
  | 'task_assign'             // 任务分配
  | 'task_reminder';          // 任务提醒

/** 消息优先级 */
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

/** 消息状态 */
export type MessageStatus = 'unread' | 'read' | 'archived';

/** 接收者类型 */
export type RecipientType = 
  | 'all'           // 全员
  | 'role'          // 按角色
  | 'class'         // 按班级
  | 'grade'         // 按年级
  | 'individual';   // 指定个人

// ==================== 消息实体 ====================

/** 接收者配置 */
export interface MessageRecipient {
  /** 接收者类型 */
  type: RecipientType;
  /** 角色列表（type=role时） */
  roles?: string[];
  /** 班级ID列表（type=class时） */
  classIds?: string[];
  /** 年级列表（type=grade时） */
  grades?: number[];
  /** 用户ID列表（type=individual时） */
  userIds?: string[];
}

/** 消息主体 */
export interface Message {
  id: string;
  /** 消息标题 */
  title: string;
  /** 消息内容 */
  content: string;
  /** 消息事件类型 */
  event: MessageEvent;
  /** 优先级 */
  priority: MessagePriority;
  /** 发送者ID */
  senderId: string;
  /** 发送者名称 */
  senderName: string;
  /** 发送者角色 */
  senderRole?: string;
  /** 接收者配置 */
  recipients: MessageRecipient;
  /** 附加数据（JSON格式，用于不同事件类型的扩展数据） */
  metadata?: Record<string, unknown>;
  /** 创建时间 */
  createdAt: string;
  /** 发送时间 */
  sentAt?: string;
  /** 过期时间 */
  expiresAt?: string;
}

/** 用户消息（用户收到的消息，包含阅读状态） */
export interface UserMessage extends Message {
  /** 用户阅读状态 */
  status: MessageStatus;
  /** 阅读时间 */
  readAt?: string;
  /** 是否置顶 */
  isPinned?: boolean;
}

// ==================== API 请求/响应类型 ====================

/** 发送消息请求 */
export interface SendMessageRequest {
  title: string;
  content: string;
  event: MessageEvent;
  priority?: MessagePriority;
  recipients: MessageRecipient;
  metadata?: Record<string, unknown>;
  scheduledAt?: string;  // 定时发送
}

/** 消息列表查询参数 */
export interface MessageQueryParams {
  /** 事件类型筛选 */
  event?: MessageEvent;
  /** 状态筛选 */
  status?: MessageStatus;
  /** 优先级筛选 */
  priority?: MessagePriority;
  /** 搜索关键词 */
  search?: string;
  /** 是否只看未读 */
  unreadOnly?: boolean;
  /** 分页 */
  page?: number;
  pageSize?: number;
}

/** 消息统计数据 */
export interface MessageStatistics {
  total: number;
  unread: number;
  read: number;
  archived: number;
  byEvent: Record<MessageEvent, number>;
  byPriority: Record<MessagePriority, number>;
}

// ==================== 事件配置 ====================

/** 事件类型配置 */
export interface MessageEventConfig {
  event: MessageEvent;
  name: string;
  description: string;
  defaultPriority: MessagePriority;
  icon: string;
  color: string;
}

/** 事件类型配置表 */
export const MESSAGE_EVENT_CONFIGS: Record<MessageEvent, MessageEventConfig> = {
  // === 系统通知 ===
  system_announcement: {
    event: 'system_announcement',
    name: '系统公告',
    description: '系统级别的重要公告',
    defaultPriority: 'high',
    icon: 'Megaphone',
    color: 'text-red-600 bg-red-50',
  },
  maintenance_notice: {
    event: 'maintenance_notice',
    name: '维护通知',
    description: '系统维护相关通知',
    defaultPriority: 'normal',
    icon: 'Wrench',
    color: 'text-orange-600 bg-orange-50',
  },
  policy_update: {
    event: 'policy_update',
    name: '政策更新',
    description: '学校政策更新通知',
    defaultPriority: 'normal',
    icon: 'FileText',
    color: 'text-blue-600 bg-blue-50',
  },
  // === 教务通知 ===
  schedule_change: {
    event: 'schedule_change',
    name: '调课通知',
    description: '课程调整通知',
    defaultPriority: 'high',
    icon: 'Calendar',
    color: 'text-purple-600 bg-purple-50',
  },
  exam_notice: {
    event: 'exam_notice',
    name: '考试通知',
    description: '考试安排通知',
    defaultPriority: 'high',
    icon: 'FileCheck',
    color: 'text-indigo-600 bg-indigo-50',
  },
  grade_publish: {
    event: 'grade_publish',
    name: '成绩发布',
    description: '学生成绩发布通知',
    defaultPriority: 'normal',
    icon: 'BarChart',
    color: 'text-green-600 bg-green-50',
  },
  homework_assign: {
    event: 'homework_assign',
    name: '作业布置',
    description: '作业布置通知',
    defaultPriority: 'normal',
    icon: 'BookOpen',
    color: 'text-cyan-600 bg-cyan-50',
  },
  // === 德育通知 ===
  activity_notice: {
    event: 'activity_notice',
    name: '活动通知',
    description: '校园活动通知',
    defaultPriority: 'normal',
    icon: 'CalendarDays',
    color: 'text-pink-600 bg-pink-50',
  },
  honor_notice: {
    event: 'honor_notice',
    name: '荣誉通知',
    description: '荣誉表彰通知',
    defaultPriority: 'normal',
    icon: 'Award',
    color: 'text-amber-600 bg-amber-50',
  },
  moral_evaluation: {
    event: 'moral_evaluation',
    name: '德育评价',
    description: '德育评价相关通知',
    defaultPriority: 'normal',
    icon: 'Heart',
    color: 'text-rose-600 bg-rose-50',
  },
  // === 家校沟通 ===
  parent_meeting: {
    event: 'parent_meeting',
    name: '家长会通知',
    description: '家长会安排通知',
    defaultPriority: 'high',
    icon: 'Users',
    color: 'text-teal-600 bg-teal-50',
  },
  student_absence: {
    event: 'student_absence',
    name: '缺勤通知',
    description: '学生缺勤通知',
    defaultPriority: 'high',
    icon: 'UserX',
    color: 'text-red-600 bg-red-50',
  },
  habit_record: {
    event: 'habit_record',
    name: '习惯记录',
    description: '习惯养成记录提醒',
    defaultPriority: 'low',
    icon: 'Star',
    color: 'text-yellow-600 bg-yellow-50',
  },
  leave_approval: {
    event: 'leave_approval',
    name: '请假审批',
    description: '请假审批相关通知',
    defaultPriority: 'normal',
    icon: 'Clock',
    color: 'text-orange-600 bg-orange-50',
  },
  // === 总务通知 ===
  repair_notice: {
    event: 'repair_notice',
    name: '报修通知',
    description: '设施报修相关通知',
    defaultPriority: 'normal',
    icon: 'Wrench',
    color: 'text-slate-600 bg-slate-50',
  },
  asset_notice: {
    event: 'asset_notice',
    name: '资产通知',
    description: '资产管理相关通知',
    defaultPriority: 'normal',
    icon: 'Package',
    color: 'text-gray-600 bg-gray-50',
  },
  safety_alert: {
    event: 'safety_alert',
    name: '安全警报',
    description: '校园安全警报',
    defaultPriority: 'urgent',
    icon: 'AlertTriangle',
    color: 'text-red-600 bg-red-50',
  },
  // === 个人消息 ===
  personal_message: {
    event: 'personal_message',
    name: '个人消息',
    description: '个人私信',
    defaultPriority: 'normal',
    icon: 'Mail',
    color: 'text-blue-600 bg-blue-50',
  },
  task_assign: {
    event: 'task_assign',
    name: '任务分配',
    description: '任务分配通知',
    defaultPriority: 'normal',
    icon: 'ListTodo',
    color: 'text-violet-600 bg-violet-50',
  },
  task_reminder: {
    event: 'task_reminder',
    name: '任务提醒',
    description: '任务截止提醒',
    defaultPriority: 'high',
    icon: 'Bell',
    color: 'text-orange-600 bg-orange-50',
  },
};
