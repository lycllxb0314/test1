/**
 * 批量标记消息已读 API
 * 
 * PATCH: 标记所有未读消息为已读
 */

import { NextRequest, NextResponse } from 'next/server';
import { messageService } from '@/services/message.service';
import { messageRepository } from '@/repositories/message.repository';
import { userRepository } from '@/repositories/user.repository';
import { success, error, ErrorCode } from '@/lib/api';
import { extractUserIdLegacy } from '@/lib/auth/auth-middleware';

/**
 * 将工号转换为用户 UUID
 */
async function getUserUUID(employeeId: string): Promise<string | null> {
  try {
    const user = await userRepository.findByEmployeeId(employeeId);
    return user?.id || null;
  } catch {
    return null;
  }
}

/**
 * PATCH - 批量标记已读
 */
export async function PATCH(request: NextRequest) {
  // 获取当前用户工号
  const employeeId = extractUserIdLegacy(request);
  if (!employeeId) {
    return NextResponse.json(
      error('未登录', ErrorCode.UNAUTHORIZED),
      { status: 401 }
    );
  }

  // 转换为用户 UUID
  const userUUID = await getUserUUID(employeeId);
  if (!userUUID) {
    return NextResponse.json(
      error('用户不存在', ErrorCode.NOT_FOUND),
      { status: 404 }
    );
  }

  try {
    // 获取用户所有未读消息
    const unreadMessages = await messageRepository.findUnread(userUUID);
    
    if (!unreadMessages.length) {
      return NextResponse.json(success({ count: 0, message: '没有未读消息' }));
    }

    // 批量标记已读
    const count = await messageRepository.markAllAsRead(userUUID);

    return NextResponse.json(success({ 
      count, 
      message: `已标记 ${count} 条消息为已读` 
    }));
  } catch (err) {
    console.error('[MessagesReadAllAPI] Error:', err);
    return NextResponse.json(
      error('标记失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
}
