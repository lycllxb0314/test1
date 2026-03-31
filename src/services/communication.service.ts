/**
 * 通信管理服务
 * 
 * 处理消息、通知、群组等业务逻辑
 */

import { BaseService, ServiceResult } from './base.service';
import {
  messageRepository,
  groupRepository,
  communicationRepository,
  MessageRecord,
  GroupRecord,
  CommunicationRecord,
  MessageQueryParams,
  GroupQueryParams,
} from '@/repositories/communication.repository';
import { PaginatedResult } from '@/repositories/base.repository';

// ==================== 消息服务 ====================

export class MessageService extends BaseService {
  async getList(params: MessageQueryParams): Promise<ServiceResult<PaginatedResult<MessageRecord>>> {
    try {
      const data = await messageRepository.findByParams(params);
      return this.ok(data);
    } catch (error) {
      console.error('[MessageService] getList error:', error);
      return this.fail('获取消息列表失败');
    }
  }

  async getById(id: string): Promise<ServiceResult<MessageRecord>> {
    try {
      const data = await messageRepository.findById(id);
      if (!data) {
        return this.fail('消息不存在');
      }
      return this.ok(data);
    } catch (error) {
      console.error('[MessageService] getById error:', error);
      return this.fail('获取消息详情失败');
    }
  }

  async create(data: Partial<MessageRecord>): Promise<ServiceResult<MessageRecord>> {
    try {
      const record = await messageRepository.create({
        ...data,
        id: data.id || `msg-${Date.now()}`,
        status: data.status || 'draft',
      });
      if (!record) {
        return this.fail('创建消息失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[MessageService] create error:', error);
      return this.fail('创建消息失败');
    }
  }

  async send(id: string): Promise<ServiceResult<MessageRecord>> {
    try {
      const record = await messageRepository.markAsSent(id);
      if (!record) {
        return this.fail('发送消息失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[MessageService] send error:', error);
      return this.fail('发送消息失败');
    }
  }

  async markAsRead(id: string): Promise<ServiceResult<MessageRecord>> {
    try {
      const record = await messageRepository.markAsRead(id);
      if (!record) {
        return this.fail('标记已读失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[MessageService] markAsRead error:', error);
      return this.fail('标记已读失败');
    }
  }

  async findUnread(receiverId: string): Promise<ServiceResult<MessageRecord[]>> {
    try {
      const data = await messageRepository.findUnread(receiverId);
      return this.ok(data);
    } catch (error) {
      console.error('[MessageService] findUnread error:', error);
      return this.fail('获取未读消息失败');
    }
  }

  async countUnread(receiverId: string): Promise<ServiceResult<number>> {
    try {
      const count = await messageRepository.countUnread(receiverId);
      return this.ok(count);
    } catch (error) {
      console.error('[MessageService] countUnread error:', error);
      return this.fail('获取未读数量失败');
    }
  }

  async delete(id: string): Promise<ServiceResult<boolean>> {
    try {
      const success = await messageRepository.delete(id);
      return this.ok(success);
    } catch (error) {
      console.error('[MessageService] delete error:', error);
      return this.fail('删除消息失败');
    }
  }
}

// ==================== 群组服务 ====================

export class GroupService extends BaseService {
  async getList(params: GroupQueryParams): Promise<ServiceResult<GroupRecord[]>> {
    try {
      const data = await groupRepository.findByParams(params);
      return this.ok(data);
    } catch (error) {
      console.error('[GroupService] getList error:', error);
      return this.fail('获取群组列表失败');
    }
  }

  async getById(id: string): Promise<ServiceResult<GroupRecord>> {
    try {
      const data = await groupRepository.findById(id);
      if (!data) {
        return this.fail('群组不存在');
      }
      return this.ok(data);
    } catch (error) {
      console.error('[GroupService] getById error:', error);
      return this.fail('获取群组详情失败');
    }
  }

  async create(data: Partial<GroupRecord>): Promise<ServiceResult<GroupRecord>> {
    try {
      const record = await groupRepository.create({
        ...data,
        id: data.id || `group-${Date.now()}`,
        members: data.members || [],
      });
      if (!record) {
        return this.fail('创建群组失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[GroupService] create error:', error);
      return this.fail('创建群组失败');
    }
  }

  async update(id: string, data: Partial<GroupRecord>): Promise<ServiceResult<GroupRecord>> {
    try {
      const record = await groupRepository.update(id, data);
      if (!record) {
        return this.fail('更新群组失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[GroupService] update error:', error);
      return this.fail('更新群组失败');
    }
  }

  async addMember(id: string, memberId: string): Promise<ServiceResult<GroupRecord>> {
    try {
      const record = await groupRepository.addMember(id, memberId);
      if (!record) {
        return this.fail('添加成员失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[GroupService] addMember error:', error);
      return this.fail('添加成员失败');
    }
  }

  async removeMember(id: string, memberId: string): Promise<ServiceResult<GroupRecord>> {
    try {
      const record = await groupRepository.removeMember(id, memberId);
      if (!record) {
        return this.fail('移除成员失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[GroupService] removeMember error:', error);
      return this.fail('移除成员失败');
    }
  }

  async delete(id: string): Promise<ServiceResult<boolean>> {
    try {
      const success = await groupRepository.delete(id);
      return this.ok(success);
    } catch (error) {
      console.error('[GroupService] delete error:', error);
      return this.fail('删除群组失败');
    }
  }
}

// ==================== 通信记录服务 ====================

export class CommunicationService extends BaseService {
  async getList(params: { type?: string; status?: string; page?: number; pageSize?: number }): Promise<ServiceResult<PaginatedResult<CommunicationRecord>>> {
    try {
      const data = await communicationRepository.findByParams(params);
      return this.ok(data);
    } catch (error) {
      console.error('[CommunicationService] getList error:', error);
      return this.fail('获取通信记录失败');
    }
  }

  async create(data: Partial<CommunicationRecord>): Promise<ServiceResult<CommunicationRecord>> {
    try {
      const record = await communicationRepository.create({
        ...data,
        id: data.id || `comm-${Date.now()}`,
        status: data.status || 'draft',
        recipients: data.recipients || [],
      });
      if (!record) {
        return this.fail('创建通信记录失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[CommunicationService] create error:', error);
      return this.fail('创建通信记录失败');
    }
  }
}

// 导出单例
export const messageService = new MessageService();
export const groupService = new GroupService();
export const communicationService = new CommunicationService();
