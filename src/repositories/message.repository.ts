/**
 * 消息 Repository
 */

import { BaseRepository, PaginatedResult } from './base.repository';
import type { MessageEvent, MessagePriority } from '@/types/messages';

/**
 * 消息类型定义（数据库行）
 * 
 * 列名映射（数据库实际列名）：
 * - user_ids: 目标用户ID数组
 * - class_ids: 目标班级ID数组
 * - roles: 目标角色数组
 * - grades: 目标年级数组
 */
export type MessageRow = {
  id: string;
  title: string;
  content: string;
  type: string;
  event?: string;
  priority?: string;
  sender_id?: string;
  sender_name?: string;
  sender_avatar?: string;
  /** 目标用户ID数组 */
  user_ids?: string[];
  /** 目标角色数组 */
  roles?: string[];
  /** 目标班级ID数组 */
  class_ids?: string[];
  /** 目标年级数组 */
  grades?: string[];
  /** 接收者ID（单条消息） */
  recipient_id?: string;
  /** 接收者类型 */
  recipient_type?: string;
  related_id?: string;
  related_type?: string;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, unknown>;
  status?: string;
  sent_at?: string;
  created_at?: string;
  updated_at?: string;
  is_read?: boolean;
  is_archived?: boolean;
};

/**
 * 消息类型（向后兼容）
 * @deprecated 使用 MessageRow 代替
 */
export type Message = MessageRow;

/**
 * 消息查询筛选
 */
export interface MessageFilters {
  type?: string;
  event?: MessageEvent;
  priority?: MessagePriority;
  senderId?: string;
  targetGroup?: string;
  isRead?: boolean;
}

/**
 * 消息 Repository
 */
export class MessageRepository extends BaseRepository<MessageRow> {
  constructor() {
    super('messages');
  }
  
  /**
   * 查询用户收到的消息
   * 
   * 查询条件（在数据库层面过滤）：
   * 1. recipient_id 等于当前用户ID（个人消息）
   * 2. 或者 user_ids 包含用户ID
   */
  async findReceived(
    userId: string,
    options: { type?: string; event?: string; page?: number; pageSize?: number } = {}
  ): Promise<PaginatedResult<MessageRow>> {
    const { type, event, page = 1, pageSize = 20 } = options;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // 使用 Supabase 的 or 条件在数据库层面过滤
    // recipient_id.eq.{userId} OR user_ids.cs.["{userId}"]
    let query = this.client
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .or(`recipient_id.eq.${userId},user_ids.cs.{${userId}}`);
    
    if (type) {
      query = query.eq('type', type);
    }
    
    if (event) {
      query = query.eq('event', event);
    }
    
    query = query.order('created_at', { ascending: false }).range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('[MessageRepository] findReceived error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
    
    return {
      data: (data || []) as MessageRow[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }
  
  /**
   * 查询用户发送的消息
   */
  async findSent(
    senderId: string,
    options: { page?: number; pageSize?: number } = {}
  ): Promise<PaginatedResult<MessageRow>> {
    const { page = 1, pageSize = 20 } = options;
    
    return this.findPaginated({
      filters: { sender_id: senderId },
      orderBy: { column: 'created_at', ascending: false },
      pagination: { page, pageSize },
    }) as Promise<PaginatedResult<MessageRow>>;
  }
  
  /**
   * 查询未读消息
   * 
   * 查询条件：用户收到的消息中未标记为已读的
   */
  async findUnread(userId: string): Promise<MessageRow[]> {
    // 使用数据库层面的过滤获取用户的消息
    const { data: messages, error: msgError } = await this.client
      .from(this.tableName)
      .select('id')
      .or(`recipient_id.eq.${userId},user_ids.cs.{${userId}}`);
    
    if (msgError || !messages?.length) {
      return [];
    }
    
    const messageIds = messages.map(m => m.id);
    
    // 查询已读记录
    const { data: reads, error: readError } = await this.client
      .from('message_reads')
      .select('message_id')
      .eq('user_id', userId)
      .in('message_id', messageIds);
    
    if (readError) {
      console.error('[MessageRepository] findUnread error:', readError.message);
      return [];
    }
    
    const readIds = new Set((reads || []).map(r => r.message_id));
    const unreadIds = messageIds.filter(id => !readIds.has(id));
    
    if (!unreadIds.length) {
      return [];
    }
    
    // 获取未读消息详情
    const { data: unreadMessages, error: detailError } = await this.client
      .from(this.tableName)
      .select('*')
      .in('id', unreadIds)
      .order('created_at', { ascending: false });
    
    if (detailError) {
      console.error('[MessageRepository] findUnread detail error:', detailError.message);
      return [];
    }
    
    return (unreadMessages || []) as MessageRow[];
  }
  
  /**
   * 统计未读消息数
   */
  async countUnread(userId: string): Promise<number> {
    const unreadMessages = await this.findUnread(userId);
    return unreadMessages.length;
  }
  
  /**
   * 获取用户已读消息 ID 列表
   */
  async findReadMessageIds(userId: string): Promise<string[]> {
    const { data: reads, error } = await this.client
      .from('message_reads')
      .select('message_id')
      .eq('user_id', userId);
    
    if (error) {
      console.error('[MessageRepository] findReadMessageIds error:', error.message);
      return [];
    }
    
    return (reads || []).map(r => r.message_id);
  }
  
  /**
   * 获取用户归档消息 ID 列表
   */
  async findArchivedMessageIds(userId: string): Promise<string[]> {
    const { data: archives, error } = await this.client
      .from('message_reads')
      .select('message_id')
      .eq('user_id', userId)
      .eq('archived', true);
    
    if (error) {
      console.error('[MessageRepository] findArchivedMessageIds error:', error.message);
      return [];
    }
    
    return (archives || []).map(r => r.message_id);
  }
  
  /**
   * 标记消息为已读
   */
  async markAsRead(messageId: string, userId: string): Promise<boolean> {
    const { error } = await this.client
      .from('message_reads')
      .insert({
        message_id: messageId,
        user_id: userId,
        read_at: new Date().toISOString(),
      });
    
    // 忽略重复插入错误
    if (error && !error.message.includes('duplicate')) {
      console.error('[MessageRepository] markAsRead error:', error.message);
      return false;
    }
    
    return true;
  }
  
  /**
   * 批量标记已读
   */
  async markAllAsRead(userId: string, messageIds?: string[]): Promise<number> {
    // 获取用户未读消息
    const unreadMessages = await this.findUnread(userId);
    const toMark = messageIds 
      ? unreadMessages.filter(m => messageIds.includes(m.id))
      : unreadMessages;
    
    if (!toMark.length) return 0;
    
    const records = toMark.map(m => ({
      message_id: m.id,
      user_id: userId,
      read_at: new Date().toISOString(),
    }));
    
    const { error } = await this.client
      .from('message_reads')
      .upsert(records, { onConflict: 'message_id,user_id' });
    
    if (error) {
      console.error('[MessageRepository] markAllAsRead error:', error.message);
      return 0;
    }
    
    return toMark.length;
  }
  
  /**
   * 标记消息为未读（删除已读记录）
   */
  async markAsUnread(messageId: string, userId: string): Promise<boolean> {
    const { error } = await this.client
      .from('message_reads')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('[MessageRepository] markAsUnread error:', error.message);
      return false;
    }
    
    return true;
  }
  
  /**
   * 归档消息（插入到 message_archives 表或更新状态）
   */
  async archive(messageId: string, userId: string): Promise<boolean> {
    // 简单实现：在 message_reads 表中添加 archived 标记
    // 或者可以创建单独的 message_archives 表
    const { error } = await this.client
      .from('message_reads')
      .upsert({
        message_id: messageId,
        user_id: userId,
        read_at: new Date().toISOString(),
        archived: true,
      }, { onConflict: 'message_id,user_id' });
    
    if (error) {
      console.error('[MessageRepository] archive error:', error.message);
      return false;
    }
    
    return true;
  }
  
  /**
   * 发送消息
   */
  async sendMessage(message: Partial<MessageRow>): Promise<MessageRow | null> {
    return this.create({
      ...message,
      status: 'sent',
      sent_at: new Date().toISOString(),
    }) as Promise<MessageRow | null>;
  }
  
  /**
   * 发送系统通知
   */
  async sendSystemNotification(
    title: string,
    content: string,
    targetUsers: string[]
  ): Promise<MessageRow | null> {
    return this.create({
      title,
      content,
      type: 'system',
      user_ids: targetUsers,  // 使用正确的列名
      sender_id: 'system',
      sender_name: '系统通知',
      status: 'sent',
      sent_at: new Date().toISOString(),
    });
  }
}

// 导出单例
export const messageRepository = new MessageRepository();
