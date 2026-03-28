/**
 * 对话存储 Repository
 * 
 * 处理对话和消息的数据库操作
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import type {
  Conversation as ChatConversation,
  ConversationDetail,
  ConversationMessage,
  ConversationListItem,
  CreateConversationRequest,
  UpdateConversationRequest,
  CreateMessageRequest,
  ConversationQueryParams,
} from '@/types/conversation.types';

// 获取 supabase 客户端
const supabase = getSupabaseClient();

// ==================== 字段映射 ====================

const CONVERSATION_FIELDS = {
  id: 'id',
  teacherId: 'teacher_id',
  title: 'title',
  subject: 'subject',
  lastMessageAt: 'last_message_at',
  messageCount: 'message_count',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

const MESSAGE_FIELDS = {
  id: 'id',
  conversationId: 'conversation_id',
  role: 'role',
  content: 'content',
  createdAt: 'created_at',
};

// ==================== Repository ====================

export const conversationRepository = {
  // ==================== 对话操作 ====================

  /** 获取对话列表 */
  async getList(params: ConversationQueryParams = {}): Promise<ConversationListItem[]> {
    const { subject, page = 1, pageSize = 20 } = params;
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('conversations')
      .select(`
        id,
        title,
        subject,
        last_message_at,
        message_count
      `)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (subject) {
      query = query.eq('subject', subject);
    }

    const { data, error } = await query;
    if (error) throw error;

    // 映射字段名
    const conversations: ConversationListItem[] = (data || []).map((item: Record<string, unknown>) => ({
      id: item.id as string,
      title: item.title as string,
      subject: item.subject as string,
      lastMessageAt: item.last_message_at as string,
      messageCount: item.message_count as number,
    }));
    
    if (conversations.length > 0) {
      const ids = conversations.map(c => c.id);
      const { data: lastMessages } = await supabase
        .from('conversation_messages')
        .select('conversation_id, content')
        .in('conversation_id', ids)
        .order('created_at', { ascending: false });

      if (lastMessages) {
        const messageMap = new Map<string, string>();
        lastMessages.forEach((m: Record<string, unknown>) => {
          const convId = m.conversation_id as string;
          if (!messageMap.has(convId)) {
            messageMap.set(convId, (m.content as string).slice(0, 50));
          }
        });
        
        conversations.forEach(c => {
          c.preview = messageMap.get(c.id);
        });
      }
    }

    return conversations;
  },

  /** 获取对话详情（包含消息） */
  async getById(id: string): Promise<ConversationDetail | null> {
    // 获取对话信息
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (convError || !conversation) return null;

    // 获取消息列表
    const { data: messages, error: msgError } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

    return {
      id: conversation.id as string,
      teacherId: conversation.teacher_id as string,
      title: conversation.title as string,
      subject: conversation.subject as ChatConversation['subject'],
      lastMessageAt: conversation.last_message_at as string,
      messageCount: conversation.message_count as number,
      createdAt: conversation.created_at as string,
      updatedAt: conversation.updated_at as string,
      messages: (messages || []).map((m: Record<string, unknown>) => ({
        id: m.id as string,
        conversationId: m.conversation_id as string,
        role: m.role as 'user' | 'assistant',
        content: m.content as string,
        createdAt: m.created_at as string,
      })),
    };
  },

  /** 创建对话 */
  async create(teacherId: string, data: CreateConversationRequest): Promise<ChatConversation> {
    const { data: result, error } = await supabase
      .from('conversations')
      .insert({
        teacher_id: teacherId,
        title: data.title || '新对话',
        subject: data.subject || 'chinese',
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: result.id,
      teacherId: result.teacher_id,
      title: result.title,
      subject: result.subject,
      lastMessageAt: result.last_message_at,
      messageCount: result.message_count,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  },

  /** 更新对话 */
  async update(id: string, data: UpdateConversationRequest): Promise<ChatConversation> {
    const { data: result, error } = await supabase
      .from('conversations')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: result.id,
      teacherId: result.teacher_id,
      title: result.title,
      subject: result.subject,
      lastMessageAt: result.last_message_at,
      messageCount: result.message_count,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  },

  /** 删除对话 */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ==================== 消息操作 ====================

  /** 添加消息 */
  async addMessage(conversationId: string, data: CreateMessageRequest): Promise<ConversationMessage> {
    // 添加消息
    const { data: message, error: msgError } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        role: data.role,
        content: data.content,
      })
      .select()
      .single();

    if (msgError) throw msgError;

    // 更新对话的最后消息时间和消息计数
    const { error: updateError } = await supabase.rpc('increment_message_count', {
      conv_id: conversationId,
    });

    // 如果 RPC 不存在，使用普通更新
    if (updateError) {
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      // 手动更新计数
      const { count } = await supabase
        .from('conversation_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId);

      if (count !== null) {
        await supabase
          .from('conversations')
          .update({ message_count: count })
          .eq('id', conversationId);
      }
    }

    return {
      id: message.id,
      conversationId: message.conversation_id,
      role: message.role,
      content: message.content,
      createdAt: message.created_at,
    };
  },

  /** 批量添加消息（用于保存完整对话） */
  async addMessages(conversationId: string, messages: CreateMessageRequest[]): Promise<ConversationMessage[]> {
    const results: ConversationMessage[] = [];

    for (const msg of messages) {
      const result = await this.addMessage(conversationId, msg);
      results.push(result);
    }

    return results;
  },

  /** 获取对话消息 */
  async getMessages(conversationId: string): Promise<ConversationMessage[]> {
    const { data, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((m: Record<string, unknown>) => ({
      id: m.id as string,
      conversationId: m.conversation_id as string,
      role: m.role as 'user' | 'assistant',
      content: m.content as string,
      createdAt: m.created_at as string,
    }));
  },

  /** 根据第一条消息生成标题 */
  async generateTitleFromFirstMessage(content: string): Promise<string> {
    // 取前20个字符作为标题
    const title = content.slice(0, 20);
    return title.length < content.length ? `${title}...` : title;
  },
};
