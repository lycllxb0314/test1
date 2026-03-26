/**
 * 消息类型定义
 * 
 * @module types/message
 */

// ==================== 消息类型 ====================

/** 消息类型 */
export type MessageType = 
  | 'notification'    // 系统通知
  | 'approval'        // 审批消息
  | 'schedule'        // 日程消息
  | 'announcement'    // 公告
  | 'reminder'        // 提醒
  | 'chat';           // 聊天消息

/** 消息类型标签 */
export const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  notification: '系统通知',
  approval: '审批消息',
  schedule: '日程消息',
  announcement: '公告',
  reminder: '提醒',
  chat: '聊天消息',
};

// ==================== 消息状态 ====================

/** 消息阅读状态 */
export type MessageReadStatus = 'unread' | 'read';

/** 消息优先级 */
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

// ==================== 消息 ====================

/** 消息基础信息 */
export interface Message {
  id: string;
  type: MessageType;
  title: string;
  content: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  receiverId: string;
  readStatus: MessageReadStatus;
  priority: MessagePriority;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: string;
  createdAt: string;
  readAt?: string;
}

/** 消息详情 */
export interface MessageDetail extends Message {
  attachments?: MessageAttachment[];
  relatedEntity?: {
    type: string;
    id: string;
    name: string;
  };
}

/** 消息附件 */
export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

// ==================== 消息模板 ====================

/** 消息模板 */
export interface MessageTemplate {
  id: string;
  type: MessageType;
  code: string;
  title: string;
  contentTemplate: string;
  variables: string[];
  actionUrlTemplate?: string;
  actionText?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 创建消息请求 */
export interface CreateMessageRequest {
  type: MessageType;
  title: string;
  content: string;
  receiverId: string;
  senderId?: string;
  priority?: MessagePriority;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, unknown>;
}

// ==================== 消息统计 ====================

/** 消息统计 */
export interface MessageStatistics {
  userId: string;
  total: number;
  unread: number;
  read: number;
  byType: Record<MessageType, { total: number; unread: number }>;
  byPriority: Record<MessagePriority, number>;
}

// ==================== 会话 ====================

/** 会话（聊天） */
export interface Conversation {
  id: string;
  type: 'private' | 'group';
  name?: string;
  avatar?: string;
  participants: ConversationParticipant[];
  lastMessage?: ConversationMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

/** 会话参与者 */
export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'owner' | 'admin' | 'member';
  lastReadAt?: string;
  joinedAt: string;
}

/** 会话消息 */
export interface ConversationMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachments?: MessageAttachment[];
  replyTo?: string;
  createdAt: string;
}

// ==================== 消息筛选 ====================

/** 消息筛选条件 */
export interface MessageFilters {
  type?: MessageType | 'all';
  readStatus?: MessageReadStatus | 'all';
  priority?: MessagePriority | 'all';
  startDate?: string;
  endDate?: string;
}
