/**
 * 消息类型定义
 * 
 * @module types/messages
 */

import type { UserRole } from './user';

// ==================== 消息配置 ====================

/** 消息事件类型 */
export type MessageEvent = 
  // === 系统通知 ===
  | 'system_announcement'      // 系统公告
  | 'maintenance_notice'       // 维护通知
  | 'policy_update'            // 政策更新
  // === 群组通知 ===
  | 'group_notice'             // 群组通知（根据 target_department 分发）
  // === 教务通知 ===
  | 'schedule_change'          // 调课通知
  | 'exam_notice'              // 考试通知
  | 'grade_publish'            // 成绩发布
  | 'homework_assign'          // 作业分配
  // === 德育通知 ===
  | 'activity_notice'          // 活动通知
  | 'honor_notice'             // 荣誉通知
  | 'moral_evaluation'         // 德育评价
  | 'habit_record'             // 习惯记录提醒
  | 'duty_reminder'            // 值日提醒
  | 'routine_score'            // 班级常规评分通知
  // === 教研通知 ===
  | 'research_activity'        // 教研活动通知
  | 'research_invitation'      // 教研活动邀请
  | 'research_reminder'        // 教研活动提醒
  | 'research_result'          // 教研成果通知
  // === 家校沟通 ===
  | 'parent_meeting'           // 家长会通知
  | 'student_absence'          // 学生缺勤
  // === 总务通知 ===
  | 'repair_notice'            // 维修通知
  | 'asset_notice'             // 资产通知
  | 'safety_alert'             // 安全警报
  // === 个人消息 ===
  | 'personal_message'         // 个人消息
  | 'task_assign'              // 任务分配
  | 'task_reminder'            // 任务提醒
  | 'leave_approval';          // 请假审批

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
  | 'individual'    // 指定个人
  | 'department';   // 部门广播

/** 消息收件人 */
export interface MessageRecipient {
  type: RecipientType;
  /** 按角色发送时的角色列表 */
  roles?: string[];
  /** 按班级发送时的班级ID列表 */
  classIds?: string[];
  /** 按年级发送时的年级列表 */
  grades?: number[];
  /** 指定个人时的用户ID列表 */
  userIds?: string[];
  /** 部门广播时的部门列表 */
  departments?: string[];
}

/** 消息事件配置 */
export interface MessageEventConfig {
  event: MessageEvent;
  label: string;
  description: string;
  icon: string;
  color: string;
  defaultPriority: MessagePriority;
  channels: ('in_app' | 'sms' | 'wechat')[];
}

/** 消息事件配置表 */
export const MESSAGE_EVENT_CONFIGS: Record<MessageEvent, MessageEventConfig> = {
  system_announcement: {
    event: 'system_announcement',
    label: '系统公告',
    description: '系统级别的公告通知',
    icon: 'megaphone',
    color: 'blue',
    defaultPriority: 'high',
    channels: ['in_app', 'wechat'],
  },
  maintenance_notice: {
    event: 'maintenance_notice',
    label: '维护通知',
    description: '系统维护、升级等通知',
    icon: 'wrench',
    color: 'orange',
    defaultPriority: 'normal',
    channels: ['in_app'],
  },
  policy_update: {
    event: 'policy_update',
    label: '政策更新',
    description: '学校政策、规章制度更新通知',
    icon: 'file-text',
    color: 'purple',
    defaultPriority: 'normal',
    channels: ['in_app', 'wechat'],
  },
  group_notice: {
    event: 'group_notice',
    label: '群组通知',
    description: '部门群组通知',
    icon: 'users',
    color: 'indigo',
    defaultPriority: 'normal',
    channels: ['in_app'],
  },
  schedule_change: {
    event: 'schedule_change',
    label: '调课通知',
    description: '调课申请通过后通知相关教师和学生',
    icon: 'calendar-sync',
    color: 'blue',
    defaultPriority: 'high',
    channels: ['in_app', 'wechat'],
  },
  exam_notice: {
    event: 'exam_notice',
    label: '考试通知',
    description: '考试安排通知',
    icon: 'clipboard-list',
    color: 'red',
    defaultPriority: 'high',
    channels: ['in_app', 'wechat'],
  },
  grade_publish: {
    event: 'grade_publish',
    label: '成绩发布',
    description: '成绩发布通知',
    icon: 'trophy',
    color: 'green',
    defaultPriority: 'normal',
    channels: ['in_app', 'wechat'],
  },
  homework_assign: {
    event: 'homework_assign',
    label: '作业发布',
    description: '教师发布作业后通知学生和家长',
    icon: 'book-open',
    color: 'green',
    defaultPriority: 'normal',
    channels: ['in_app', 'wechat'],
  },
  activity_notice: {
    event: 'activity_notice',
    label: '活动通知',
    description: '学校活动或班级活动通知',
    icon: 'calendar-days',
    color: 'teal',
    defaultPriority: 'normal',
    channels: ['in_app', 'wechat'],
  },
  honor_notice: {
    event: 'honor_notice',
    label: '荣誉通知',
    description: '荣誉表彰通知',
    icon: 'award',
    color: 'yellow',
    defaultPriority: 'normal',
    channels: ['in_app', 'wechat'],
  },
  moral_evaluation: {
    event: 'moral_evaluation',
    label: '德育评价',
    description: '德育评价相关通知',
    icon: 'heart',
    color: 'pink',
    defaultPriority: 'normal',
    channels: ['in_app'],
  },
  habit_record: {
    event: 'habit_record',
    label: '习惯记录',
    description: '习惯记录提醒通知',
    icon: 'check-circle',
    color: 'cyan',
    defaultPriority: 'normal',
    channels: ['in_app'],
  },
  duty_reminder: {
    event: 'duty_reminder',
    label: '值日提醒',
    description: '值日教师工作提醒',
    icon: 'calendar-check',
    color: 'amber',
    defaultPriority: 'high',
    channels: ['in_app', 'wechat'],
  },
  routine_score: {
    event: 'routine_score',
    label: '班级常规评分',
    description: '班级常规评分通知',
    icon: 'clipboard-list',
    color: 'teal',
    defaultPriority: 'normal',
    channels: ['in_app'],
  },
  research_activity: {
    event: 'research_activity',
    label: '教研活动',
    description: '教研活动相关通知',
    icon: 'book-open',
    color: 'violet',
    defaultPriority: 'normal',
    channels: ['in_app', 'wechat'],
  },
  research_invitation: {
    event: 'research_invitation',
    label: '教研邀请',
    description: '教研活动邀请通知',
    icon: 'user-plus',
    color: 'indigo',
    defaultPriority: 'normal',
    channels: ['in_app', 'wechat'],
  },
  research_reminder: {
    event: 'research_reminder',
    label: '教研提醒',
    description: '教研活动开始前提醒',
    icon: 'bell',
    color: 'orange',
    defaultPriority: 'high',
    channels: ['in_app', 'wechat'],
  },
  research_result: {
    event: 'research_result',
    label: '教研成果',
    description: '教研成果发布通知',
    icon: 'award',
    color: 'green',
    defaultPriority: 'normal',
    channels: ['in_app'],
  },
  parent_meeting: {
    event: 'parent_meeting',
    label: '家长会通知',
    description: '家长会安排通知',
    icon: 'users',
    color: 'purple',
    defaultPriority: 'high',
    channels: ['in_app', 'wechat'],
  },
  student_absence: {
    event: 'student_absence',
    label: '学生缺勤',
    description: '学生缺勤通知',
    icon: 'user-x',
    color: 'red',
    defaultPriority: 'high',
    channels: ['in_app', 'wechat'],
  },
  repair_notice: {
    event: 'repair_notice',
    label: '维修通知',
    description: '设施维修相关通知',
    icon: 'wrench',
    color: 'orange',
    defaultPriority: 'normal',
    channels: ['in_app'],
  },
  asset_notice: {
    event: 'asset_notice',
    label: '资产通知',
    description: '资产管理相关通知',
    icon: 'package',
    color: 'slate',
    defaultPriority: 'normal',
    channels: ['in_app'],
  },
  safety_alert: {
    event: 'safety_alert',
    label: '安全警报',
    description: '安全相关警报通知',
    icon: 'alert-triangle',
    color: 'red',
    defaultPriority: 'urgent',
    channels: ['in_app', 'sms', 'wechat'],
  },
  personal_message: {
    event: 'personal_message',
    label: '个人消息',
    description: '个人消息通知',
    icon: 'mail',
    color: 'gray',
    defaultPriority: 'normal',
    channels: ['in_app'],
  },
  task_assign: {
    event: 'task_assign',
    label: '任务分配',
    description: '任务分配通知',
    icon: 'clipboard',
    color: 'blue',
    defaultPriority: 'normal',
    channels: ['in_app'],
  },
  task_reminder: {
    event: 'task_reminder',
    label: '任务提醒',
    description: '任务截止提醒',
    icon: 'clock',
    color: 'orange',
    defaultPriority: 'high',
    channels: ['in_app'],
  },
  leave_approval: {
    event: 'leave_approval',
    label: '请假审批',
    description: '教师请假需要审批时通知相关人员',
    icon: 'calendar-clock',
    color: 'orange',
    defaultPriority: 'high',
    channels: ['in_app', 'wechat'],
  },
};

// ==================== 消息 ====================

/** 用户消息 */
export interface UserMessage {
  id: string;
  title: string;
  content: string;
  event: MessageEvent;
  priority: MessagePriority;
  status?: MessageStatus;
  senderId?: string;
  senderName?: string;
  senderRole?: string;
  recipientId?: string;
  recipientName?: string;
  recipientRole?: UserRole;
  recipientType?: string; // 接收者类型：individual, department, etc.
  recipients?: MessageRecipient;
  relatedId?: string;
  relatedType?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  readAt?: string;
  archivedAt?: string;
  scheduledAt?: string;
  isPinned?: boolean;
}

/** 发送消息请求 */
export interface SendMessageRequest {
  title: string;
  content: string;
  event: MessageEvent;
  priority?: MessagePriority;
  recipientIds?: string[];
  recipientRoles?: UserRole[];
  recipientGroupIds?: string[];
  recipients?: MessageRecipient;
  relatedId?: string;
  relatedType?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  scheduledAt?: string;
}

/** 消息查询参数 */
export interface MessageQueryParams {
  event?: MessageEvent | 'all';
  status?: MessageStatus | 'all';
  priority?: MessagePriority | 'all';
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
  department?: string;
}

/** 消息统计 */
export interface MessageStatistics {
  total: number;
  unread: number;
  read: number;
  archived: number;
  byEvent: Partial<Record<MessageEvent, number>>;
  byPriority: Partial<Record<MessagePriority, number>>;
}

// ==================== 辅助函数 ====================

/** 获取事件标签 */
export function getMessageEventLabel(event: MessageEvent): string {
  return MESSAGE_EVENT_CONFIGS[event]?.label || event;
}

/** 获取优先级标签 */
export function getMessagePriorityLabel(priority: MessagePriority): string {
  const labels: Record<MessagePriority, string> = {
    low: '低',
    normal: '普通',
    high: '高',
    urgent: '紧急',
  };
  return labels[priority] || priority;
}

/** 获取优先级颜色 */
export function getMessagePriorityColor(priority: MessagePriority): string {
  const colors: Record<MessagePriority, string> = {
    low: 'gray',
    normal: 'blue',
    high: 'orange',
    urgent: 'red',
  };
  return colors[priority] || 'gray';
}

/** 获取状态标签 */
export function getMessageStatusLabel(status: MessageStatus): string {
  const labels: Record<MessageStatus, string> = {
    unread: '未读',
    read: '已读',
    archived: '已归档',
  };
  return labels[status] || status;
}

/** 获取状态颜色 */
export function getMessageStatusColor(status: MessageStatus): string {
  const colors: Record<MessageStatus, string> = {
    unread: 'blue',
    read: 'gray',
    archived: 'slate',
  };
  return colors[status] || 'gray';
}
