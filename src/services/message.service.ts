/**
 * 消息服务
 * 
 * 负责消息发送、查询、状态管理等业务逻辑
 * 
 * @module services/message.service
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { messageRepository, MessageRepository } from '@/repositories/message.repository';
import { userRepository } from '@/repositories/user.repository';
import type { 
  MessageEvent, 
  MessagePriority, 
  MessageStatus,
  SendMessageRequest,
  UserMessage,
  MessageStatistics,
  MessageRecipient,
  MESSAGE_EVENT_CONFIGS,
} from '@/types/messages';

// ============================================
// 类型定义
// ============================================

/** 发送消息参数 */
export type SendMessageParams = {
  title: string;
  content: string;
  event: MessageEvent;
  priority?: MessagePriority;
  recipientIds?: string[];
  recipientRoles?: string[];
  relatedId?: string;
  relatedType?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  senderId?: string;
  senderName?: string;
};

/** 批量发送消息参数 */
export type BatchSendMessageParams = {
  messages: SendMessageParams[];
};

/** 查询消息参数 */
export type QueryMessagesParams = {
  userId: string;
  event?: MessageEvent | 'all';
  status?: MessageStatus | 'all';
  priority?: MessagePriority | 'all';
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
};

/** 值日提醒参数 */
export type DutyReminderParams = {
  teacherId: string;
  teacherName: string;
  grade: number;
  weekDay: number;
  date: string;
};

/** 教研活动提醒参数 */
export type ResearchActivityReminderParams = {
  activityId: string;
  activityTitle: string;
  activityType: string;
  startTime: string;
  location: string;
  participantIds: string[];
  hostName: string;
};

/** 教研邀请参数 */
export type ResearchInvitationParams = {
  activityId: string;
  activityTitle: string;
  activityType: string;
  startTime: string;
  location: string;
  inviteeIds: string[];
  inviterName: string;
};

// 数据库消息行类型（与 MessageRepository.MessageRow 保持一致）
type MessageRow = {
  id: string;
  title: string;
  content: string;
  type: string;
  event?: string;
  priority?: string;
  sender_id?: string;
  sender_name?: string;
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
};

// ============================================
// 消息服务类
// ============================================

export class MessageService extends BaseService {
  private repository: MessageRepository;

  constructor() {
    super();
    this.repository = messageRepository;
  }

  // ==================== 消息查询 ====================

  /**
   * 查询用户消息列表
   */
  async queryUserMessages(params: QueryMessagesParams): Promise<PaginatedServiceResult<UserMessage>> {
    const { userId, event, status, priority, page = 1, pageSize = 20, unreadOnly } = params;

    try {
      // 获取用户收到的消息（包含部门广播消息）
      const result = await this.repository.findReceived(userId, {
        type: event && event !== 'all' ? event : undefined,
        page,
        pageSize,
      });

      // 获取用户已读消息 ID 列表
      const readMessages = await this.repository.findReadMessageIds(userId);
      const readMessageIds = new Set(readMessages);

      // 获取用户归档消息 ID 列表
      const archivedMessages = await this.repository.findArchivedMessageIds?.(userId);
      const archivedMessageIds = new Set(archivedMessages || []);

      // 转换为业务模型，并设置正确的状态
      const messages: UserMessage[] = result.data.map(row => {
        const msg = this.toUserMessage(row);
        // 根据阅读记录设置状态
        if (archivedMessageIds.has(row.id)) {
          msg.status = 'archived';
        } else if (readMessageIds.has(row.id)) {
          msg.status = 'read';
        }
        return msg;
      });

      // 应用过滤
      let filtered = messages;
      
      if (unreadOnly) {
        filtered = filtered.filter(m => m.status === 'unread');
      }
      
      if (status && status !== 'all') {
        filtered = filtered.filter(m => m.status === status);
      }

      return {
        success: true,
        data: filtered,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
      };
    } catch (error) {
      console.error('[MessageService] queryUserMessages error:', error);
      return {
        success: false,
        data: [],
        pagination: {
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0,
        },
        error: '查询消息失败',
      };
    }
  }

  /**
   * 获取消息统计
   */
  async getStatistics(userId: string): Promise<ServiceResult<MessageStatistics>> {
    try {
      const unreadCount = await this.repository.countUnread(userId);
      
      // TODO: 实现完整统计
      const stats: MessageStatistics = {
        total: unreadCount,
        unread: unreadCount,
        read: 0,
        archived: 0,
        byEvent: {},
        byPriority: {},
      };

      return this.ok(stats);
    } catch (error) {
      console.error('[MessageService] getStatistics error:', error);
      return this.fail('获取统计失败');
    }
  }

  // ==================== 消息发送 ====================

  /**
   * 发送消息
   */
  async sendMessage(params: SendMessageParams): Promise<ServiceResult<UserMessage>> {
    try {
      const messageRow: Partial<MessageRow> = {
        title: params.title,
        content: params.content,
        type: this.eventToType(params.event),
        event: params.event,
        priority: params.priority || 'normal',
        sender_id: params.senderId,
        sender_name: params.senderName,
        user_ids: params.recipientIds,  // 使用正确的列名
        roles: params.recipientRoles,     // 使用正确的列名
        related_id: params.relatedId,
        related_type: params.relatedType,
        action_url: params.actionUrl,
        action_label: params.actionLabel,
        metadata: params.metadata,
        status: 'sent',
        sent_at: new Date().toISOString(),
      };

      const created = await this.repository.create(messageRow);
      
      if (!created) {
        return this.fail('发送消息失败');
      }

      return this.ok(this.toUserMessage(created as MessageRow));
    } catch (error) {
      console.error('[MessageService] sendMessage error:', error);
      return this.fail('发送消息失败');
    }
  }

  /**
   * 批量发送消息
   */
  async batchSendMessages(params: BatchSendMessageParams): Promise<ServiceResult<number>> {
    let successCount = 0;
    
    for (const msg of params.messages) {
      const result = await this.sendMessage(msg);
      if (result.success) {
        successCount++;
      }
    }

    return this.ok(successCount);
  }

  // ==================== 值日提醒 ====================

  /**
   * 发送值日提醒
   */
  async sendDutyReminder(params: DutyReminderParams): Promise<ServiceResult<UserMessage>> {
    const weekDayLabels: Record<number, string> = {
      1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五',
    };

    return this.sendMessage({
      title: '值日提醒',
      content: `您负责${params.grade}年级${weekDayLabels[params.weekDay]}的值日工作，请按时到岗。`,
      event: 'duty_reminder',
      priority: 'high',
      recipientIds: [params.teacherId],
      relatedId: `duty_${params.teacherId}_${params.date}`,
      relatedType: 'duty',
      metadata: {
        grade: params.grade,
        weekDay: params.weekDay,
        date: params.date,
      },
    });
  }

  /**
   * 批量发送值日提醒
   */
  async sendDutyReminders(
    duties: DutyReminderParams[]
  ): Promise<ServiceResult<number>> {
    const messages = duties.map(duty => ({
      title: '值日提醒',
      content: `您负责${duty.grade}年级的值日工作，请按时到岗。`,
      event: 'duty_reminder' as MessageEvent,
      priority: 'high' as MessagePriority,
      recipientIds: [duty.teacherId],
      relatedId: `duty_${duty.teacherId}_${duty.date}`,
      relatedType: 'duty',
      metadata: {
        grade: duty.grade,
        weekDay: duty.weekDay,
        date: duty.date,
      },
    }));

    return this.batchSendMessages({ messages });
  }

  // ==================== 教研活动提醒 ====================

  /**
   * 发送教研活动提醒
   */
  async sendResearchActivityReminder(
    params: ResearchActivityReminderParams
  ): Promise<ServiceResult<number>> {
    const messages = params.participantIds.map(participantId => ({
      title: '教研活动提醒',
      content: `您参与的教研活动「${params.activityTitle}」即将开始，时间为${params.startTime}，地点：${params.location}。`,
      event: 'research_reminder' as MessageEvent,
      priority: 'high' as MessagePriority,
      recipientIds: [participantId],
      relatedId: params.activityId,
      relatedType: 'research_activity',
      actionUrl: `/academic/research/${params.activityId}`,
      actionLabel: '查看详情',
      metadata: {
        activityType: params.activityType,
        startTime: params.startTime,
        location: params.location,
        hostName: params.hostName,
      },
    }));

    return this.batchSendMessages({ messages });
  }

  /**
   * 发送教研邀请
   */
  async sendResearchInvitation(
    params: ResearchInvitationParams
  ): Promise<ServiceResult<number>> {
    const messages = params.inviteeIds.map(inviteeId => ({
      title: '教研活动邀请',
      content: `${params.inviterName}邀请您参加教研活动「${params.activityTitle}」，时间为${params.startTime}，地点：${params.location}。`,
      event: 'research_invitation' as MessageEvent,
      priority: 'normal' as MessagePriority,
      recipientIds: [inviteeId],
      relatedId: params.activityId,
      relatedType: 'research_activity',
      actionUrl: `/academic/research/${params.activityId}`,
      actionLabel: '查看详情',
      metadata: {
        activityType: params.activityType,
        startTime: params.startTime,
        location: params.location,
        inviterName: params.inviterName,
      },
    }));

    return this.batchSendMessages({ messages });
  }

  /**
   * 发送教研活动通知（活动创建/更新时）
   */
  async sendResearchActivityNotice(params: {
    activityId: string;
    activityTitle: string;
    activityType: string;
    startTime: string;
    location: string;
    participantIds: string[];
    hostName: string;
    isUpdate?: boolean;
  }): Promise<ServiceResult<number>> {
    const messages = params.participantIds.map(participantId => ({
      title: params.isUpdate ? '教研活动更新' : '教研活动通知',
      content: params.isUpdate
        ? `教研活动「${params.activityTitle}」已更新，时间为${params.startTime}，地点：${params.location}。`
        : `您已被安排参与教研活动「${params.activityTitle}」，时间为${params.startTime}，地点：${params.location}。`,
      event: 'research_activity' as MessageEvent,
      priority: 'normal' as MessagePriority,
      recipientIds: [participantId],
      relatedId: params.activityId,
      relatedType: 'research_activity',
      actionUrl: `/academic/research/${params.activityId}`,
      actionLabel: '查看详情',
      metadata: {
        activityType: params.activityType,
        startTime: params.startTime,
        location: params.location,
        hostName: params.hostName,
      },
    }));

    return this.batchSendMessages({ messages });
  }

  // ==================== 消息状态管理 ====================

  /**
   * 标记消息已读
   */
  async markAsRead(messageId: string, userId: string): Promise<ServiceResult<boolean>> {
    const success = await this.repository.markAsRead(messageId, userId);
    return success ? this.ok(true) : this.fail('标记失败');
  }

  /**
   * 标记消息未读
   */
  async markAsUnread(messageId: string, userId: string): Promise<ServiceResult<boolean>> {
    const success = await this.repository.markAsUnread(messageId, userId);
    return success ? this.ok(true) : this.fail('标记失败');
  }

  /**
   * 归档消息
   */
  async archive(messageId: string, userId: string): Promise<ServiceResult<boolean>> {
    const success = await this.repository.archive(messageId, userId);
    return success ? this.ok(true) : this.fail('归档失败');
  }

  /**
   * 批量标记已读
   */
  async markAllAsRead(userId: string, messageIds?: string[]): Promise<ServiceResult<number>> {
    const count = await this.repository.markAllAsRead(userId, messageIds);
    return this.ok(count);
  }

  // ==================== 辅助方法 ====================

  /**
   * 数据库行转业务模型
   */
  private toUserMessage(row: MessageRow): UserMessage {
    // 从 metadata 中获取 action_url, action_label, related_id, related_type
    const metadata = row.metadata || {};
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      event: (row.event || this.typeToEvent(row.type)) as MessageEvent,
      priority: (row.priority || 'normal') as MessagePriority,
      status: 'unread', // TODO: 从 message_reads 表获取实际状态
      senderId: row.sender_id,
      senderName: row.sender_name,
      recipientId: row.recipient_id || row.user_ids?.[0],  // 使用正确的列名
      recipientType: row.recipient_type, // 接收者类型
      relatedId: row.related_id || (metadata.related_id as string),
      relatedType: row.related_type || (metadata.related_type as string),
      actionUrl: row.action_url || (metadata.action_url as string),
      actionLabel: row.action_label || (metadata.action_label as string),
      metadata: row.metadata,
      createdAt: row.created_at || new Date().toISOString(),
    };
  }

  /**
   * 事件类型转数据库类型
   */
  private eventToType(event: MessageEvent): string {
    const eventToTypeMap: Partial<Record<MessageEvent, string>> = {
      system_announcement: 'system',
      maintenance_notice: 'system',
      policy_update: 'system',
      group_notice: 'group',
      schedule_change: 'schedule',
      exam_notice: 'exam',
      grade_publish: 'grade',
      homework_assign: 'homework',
      activity_notice: 'activity',
      honor_notice: 'honor',
      moral_evaluation: 'moral',
      habit_record: 'habit',
      duty_reminder: 'duty',
      routine_score: 'routine',
      research_activity: 'research',
      research_invitation: 'research',
      research_reminder: 'research',
      research_result: 'research',
      parent_meeting: 'meeting',
      student_absence: 'absence',
      repair_notice: 'repair',
      asset_notice: 'asset',
      safety_alert: 'safety',
      personal_message: 'message',
      task_assign: 'task',
      task_reminder: 'task',
      leave_approval: 'approval',
    };
    return eventToTypeMap[event] || 'notification';
  }

  /**
   * 数据库类型转事件类型
   */
  private typeToEvent(type: string): MessageEvent {
    const typeToEventMap: Record<string, MessageEvent> = {
      system: 'system_announcement',
      notification: 'system_announcement',
      announcement: 'system_announcement',
      group: 'group_notice',
      schedule: 'schedule_change',
      exam: 'exam_notice',
      grade: 'grade_publish',
      homework: 'homework_assign',
      activity: 'activity_notice',
      honor: 'honor_notice',
      moral: 'moral_evaluation',
      habit: 'habit_record',
      duty: 'duty_reminder',
      routine: 'routine_score',
      research: 'research_activity',
      meeting: 'parent_meeting',
      absence: 'student_absence',
      repair: 'repair_notice',
      asset: 'asset_notice',
      safety: 'safety_alert',
      message: 'personal_message',
      internal_notice: 'personal_message',
      task: 'task_assign',
      approval: 'leave_approval',
      leave_approval: 'leave_approval',
      leave_approved: 'leave_approval',
      leave_rejected: 'leave_approval',
      leave_cancelled: 'leave_approval',
      course_adjustment: 'schedule_change',
      department_notice: 'system_announcement',
      parent_notice: 'personal_message',
      room_booking_approval: 'leave_approval',
      information_collection: 'personal_message',
    };
    return typeToEventMap[type] || 'personal_message';
  }
}

// 导出单例
export const messageService = new MessageService();
