/**
 * 对话存储 Service
 * 
 * 业务逻辑层
 */

import { conversationRepository } from '@/repositories/conversation.repository';
import type {
  Conversation as ChatConversation,
  ConversationDetail,
  ConversationListItem,
  ConversationMessage,
  CreateConversationRequest,
  UpdateConversationRequest,
  CreateMessageRequest,
  ConversationQueryParams,
} from '@/types/conversation.types';

// ==================== Service ====================

export const conversationService = {
  /** 获取对话列表 */
  async getList(teacherId: string, params?: ConversationQueryParams): Promise<ConversationListItem[]> {
    return conversationRepository.getList(params);
  },

  /** 获取对话详情 */
  async getById(id: string): Promise<ConversationDetail | null> {
    return conversationRepository.getById(id);
  },

  /** 创建新对话 */
  async create(teacherId: string, data?: CreateConversationRequest): Promise<ChatConversation> {
    const conversation = await conversationRepository.create(teacherId, data || {});
    
    // 如果有第一条消息，添加并更新标题
    if (data?.firstMessage) {
      await conversationRepository.addMessage(conversation.id, {
        role: 'user',
        content: data.firstMessage,
      });

      // 根据第一条消息生成标题
      const title = await conversationRepository.generateTitleFromFirstMessage(data.firstMessage);
      await conversationRepository.update(conversation.id, { title });
    }

    return conversation;
  },

  /** 更新对话标题 */
  async updateTitle(id: string, title: string): Promise<ChatConversation> {
    return conversationRepository.update(id, { title });
  },

  /** 删除对话 */
  async delete(id: string): Promise<void> {
    return conversationRepository.delete(id);
  },

  /** 添加用户消息 */
  async addUserMessage(conversationId: string, content: string): Promise<ConversationMessage> {
    return conversationRepository.addMessage(conversationId, {
      role: 'user',
      content,
    });
  },

  /** 添加助手消息 */
  async addAssistantMessage(conversationId: string, content: string): Promise<ConversationMessage> {
    return conversationRepository.addMessage(conversationId, {
      role: 'assistant',
      content,
    });
  },

  /** 保存完整对话（用户消息 + 助手回复） */
  async saveConversation(
    conversationId: string,
    userMessage: string,
    assistantMessage: string,
  ): Promise<{ userMsg: ConversationMessage; assistantMsg: ConversationMessage }> {
    const userMsg = await this.addUserMessage(conversationId, userMessage);
    const assistantMsg = await this.addAssistantMessage(conversationId, assistantMessage);
    
    return { userMsg, assistantMsg };
  },

  /** 获取对话消息历史 */
  async getMessages(conversationId: string): Promise<ConversationMessage[]> {
    return conversationRepository.getMessages(conversationId);
  },

  /** 自动生成对话标题（基于第一条用户消息） */
  async autoGenerateTitle(conversationId: string): Promise<string> {
    const messages = await this.getMessages(conversationId);
    const firstUserMessage = messages.find(m => m.role === 'user');
    
    if (firstUserMessage) {
      const title = await conversationRepository.generateTitleFromFirstMessage(firstUserMessage.content);
      await this.updateTitle(conversationId, title);
      return title;
    }
    
    return '新对话';
  },
};
