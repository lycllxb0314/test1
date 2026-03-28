/**
 * 对话存储类型定义
 * 
 * 用于备课智能体的多对话管理
 */

// ==================== 对话消息 ====================

/** 对话消息 */
export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

/** 创建消息请求 */
export interface CreateMessageRequest {
  role: 'user' | 'assistant';
  content: string;
}

// ==================== 对话 ====================

/** 对话 */
export interface Conversation {
  id: string;
  teacherId: string;
  title: string;
  subject: 'chinese' | 'math' | 'english' | 'science' | 'morality' | 'music' | 'art' | 'pe';
  lastMessageAt: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

/** 对话详情（包含消息） */
export interface ConversationDetail extends Conversation {
  messages: ConversationMessage[];
}

/** 创建对话请求 */
export interface CreateConversationRequest {
  title?: string;
  subject?: 'chinese' | 'math' | 'english' | 'science' | 'morality' | 'music' | 'art' | 'pe';
  firstMessage?: string;
}

/** 更新对话请求 */
export interface UpdateConversationRequest {
  title?: string;
}

/** 对话查询参数 */
export interface ConversationQueryParams {
  subject?: string;
  page?: number;
  pageSize?: number;
}

/** 对话列表项（用于侧边栏展示） */
export interface ConversationListItem {
  id: string;
  title: string;
  subject: string;
  lastMessageAt: string;
  messageCount: number;
  preview?: string; // 最后一条消息预览
}
