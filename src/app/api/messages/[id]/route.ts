/**
 * 消息详情 API
 *
 * GET    - 获取消息详情
 * PUT    - 更新消息状态（已读、未读、归档）
 * DELETE - 删除消息（软删除/归档）
 */

import { withRoute } from '@/lib/api';
import { messageService } from '@/services/message.service';
import { messageRepository } from '@/repositories/message.repository';
import { ApiError } from '@/lib/api-error';

/**
 * GET - 获取消息详情
 */
export const GET = withRoute(
  async (req, ctx) => {
    const { id } = ctx.params;
    if (!id) throw ApiError.BadRequest('缺少消息ID');

    const message = await messageRepository.findById(id as string);

    if (!message) {
      throw ApiError.NotFound('消息不存在');
    }

    return {
      id: message.id,
      title: message.title,
      content: message.content,
      senderId: message.sender_id,
      senderName: message.sender_name,
      recipientId: message.recipient_id,
      type: message.type,
      status: message.status,
      sentAt: message.sent_at,
      createdAt: message.created_at,
    };
  },
  { requireAuth: true }
);

/**
 * PUT - 更新消息状态
 */
export const PUT = withRoute(
  async (req, ctx, user) => {
    const { id } = ctx.params;
    if (!id) throw ApiError.BadRequest('缺少消息ID');

    const body = await req.json();
    const action = body.action;

    let result;

    switch (action) {
      case 'read':
      case 'markRead':
        result = await messageService.markAsRead(id as string, user.id);
        break;
      case 'unread':
        result = await messageService.markAsUnread(id as string, user.id);
        break;
      case 'archive':
        result = await messageService.archive(id as string, user.id);
        break;
      default:
        throw ApiError.BadRequest('无效的操作');
    }

    if (!result.success) {
      throw ApiError.Internal(result.error || '更新消息失败');
    }

    return result.data;
  },
  { requireAuth: true }
);

/**
 * DELETE - 删除消息（软删除/归档）
 */
export const DELETE = withRoute(
  async (req, ctx, user) => {
    const { id } = ctx.params;
    if (!id) throw ApiError.BadRequest('缺少消息ID');

    const result = await messageService.archive(id as string, user.id);

    if (!result.success) {
      throw ApiError.Internal('删除消息失败');
    }

    return { deleted: true };
  },
  { requireAuth: true }
);
