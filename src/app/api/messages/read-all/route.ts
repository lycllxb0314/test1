/**
 * 批量标记消息已读 API
 *
 * PATCH - 标记所有未读消息为已读
 */

import { withRoute } from '@/lib/api';
import { messageRepository } from '@/repositories/message.repository';
import { ApiError } from '@/lib/api-error';

export const PATCH = withRoute(
  async (req, _ctx, user) => {
    const unreadMessages = await messageRepository.findUnread(user.id);

    if (!unreadMessages.length) {
      return { count: 0, message: '没有未读消息' };
    }

    const count = await messageRepository.markAllAsRead(user.id);

    return {
      count,
      message: `已标记 ${count} 条消息为已读`,
    };
  },
  { requireAuth: true }
);
