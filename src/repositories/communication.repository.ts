/**
 * 通信管理 Repository
 * 
 * 处理消息、通知、群组等数据访问
 */

import { BaseRepository, PaginatedResult } from './base.repository';

// ==================== 类型定义 ====================

export interface MessageRecord {
  id: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string | null;
  receiver_type: string;
  subject: string;
  content: string;
  type: string;
  priority: string;
  status: string;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
  updated_at?: string;
}

export interface GroupRecord {
  id: string;
  name: string;
  type: string;
  description: string | null;
  members: string[];
  creator_id: string;
  created_at: string;
  updated_at?: string;
}

export interface CommunicationRecord {
  id: string;
  type: string;
  title: string;
  content: string;
  sender: string;
  sender_id: string | null;
  recipients: string[];
  status: string;
  sent_at: string | null;
  created_at: string;
  updated_at?: string;
}

export interface MessageQueryParams {
  senderId?: string;
  receiverId?: string;
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface GroupQueryParams {
  type?: string;
  creatorId?: string;
  memberId?: string;
}

// ==================== 消息 Repository ====================

export class MessageRepository extends BaseRepository<MessageRecord> {
  constructor() {
    super('messages');
  }

  async findByParams(params: MessageQueryParams): Promise<PaginatedResult<MessageRecord>> {
    const { page = 1, pageSize = 20 } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.client
      .from('messages')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params.senderId) query = query.eq('sender_id', params.senderId);
    if (params.receiverId) query = query.eq('receiver_id', params.receiverId);
    if (params.type) query = query.eq('type', params.type);
    if (params.status) query = query.eq('status', params.status);

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error('[MessageRepository] findByParams error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    return {
      data: (data || []) as MessageRecord[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  async markAsRead(id: string): Promise<MessageRecord | null> {
    return this.update(id, {
      status: 'read',
      read_at: new Date().toISOString(),
    } as Partial<MessageRecord>);
  }

  async markAsSent(id: string): Promise<MessageRecord | null> {
    return this.update(id, {
      status: 'sent',
      sent_at: new Date().toISOString(),
    } as Partial<MessageRecord>);
  }

  async findUnread(receiverId: string): Promise<MessageRecord[]> {
    const { data, error } = await this.client
      .from('messages')
      .select('*')
      .eq('receiver_id', receiverId)
      .eq('status', 'unread')
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data || []) as MessageRecord[];
  }

  async countUnread(receiverId: string): Promise<number> {
    return this.count({ receiver_id: receiverId, status: 'unread' });
  }
}

// ==================== 群组 Repository ====================

export class GroupRepository extends BaseRepository<GroupRecord> {
  constructor() {
    super('groups');
  }

  async findByParams(params: GroupQueryParams): Promise<GroupRecord[]> {
    let query = this.client
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (params.type) query = query.eq('type', params.type);
    if (params.creatorId) query = query.eq('creator_id', params.creatorId);

    const { data, error } = await query;
    if (error) {
      console.error('[GroupRepository] findByParams error:', error.message);
      return [];
    }

    let result = (data || []) as GroupRecord[];

    // 按成员过滤
    if (params.memberId) {
      result = result.filter(g => g.members && g.members.includes(params.memberId!));
    }

    return result;
  }

  async addMember(id: string, memberId: string): Promise<GroupRecord | null> {
    const group = await this.findById(id);
    if (!group) return null;

    const members = group.members || [];
    if (members.includes(memberId)) return group;

    return this.update(id, { members: [...members, memberId] } as Partial<GroupRecord>);
  }

  async removeMember(id: string, memberId: string): Promise<GroupRecord | null> {
    const group = await this.findById(id);
    if (!group) return null;

    const members = (group.members || []).filter(m => m !== memberId);
    return this.update(id, { members } as Partial<GroupRecord>);
  }
}

// ==================== 通信记录 Repository ====================

export class CommunicationRepository extends BaseRepository<CommunicationRecord> {
  constructor() {
    super('communications');
  }

  async findByParams(params: { type?: string; status?: string; page?: number; pageSize?: number }): Promise<PaginatedResult<CommunicationRecord>> {
    const { page = 1, pageSize = 20 } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.client
      .from('communications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params.type) query = query.eq('type', params.type);
    if (params.status) query = query.eq('status', params.status);

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error('[CommunicationRepository] findByParams error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    return {
      data: (data || []) as CommunicationRecord[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }
}

// ==================== 导出单例 ====================

import { getSupabaseClient } from '@/storage/database/supabase-client';

export const messageRepository = new MessageRepository();
export const groupRepository = new GroupRepository();
export const communicationRepository = new CommunicationRepository();
