/**
 * 批量标记消息已读 API
 * 
 * PATCH: 标记所有未读消息为已读
 */

import { NextRequest, NextResponse } from 'next/server';
import { messageService } from '@/services/message.service';
import { messageRepository } from '@/repositories/message.repository';
import { success, error, ErrorCode } from '@/lib/api';
import { extractUserIdLegacy, validateSessionLegacy } from '@/lib/auth/auth-middleware';
import { extractTokens, validateSession as validateJwtSession } from '@/lib/auth/session';

/**
 * 从请求中获取用户 UUID（支持 JWT 和传统认证）
 */
async function getUserUUID(request: NextRequest): Promise<string | null> {
  // 1. 尝试 JWT 认证
  const { accessToken, refreshToken } = extractTokens(request);
  if (accessToken) {
    const sessionResult = await validateJwtSession(accessToken, refreshToken || undefined);
    if (sessionResult.success && sessionResult.user) {
      return sessionResult.user.id;
    }
  }
  
  // 2. 降级到传统认证
  const employeeId = extractUserIdLegacy(request);
  if (!employeeId) return null;
  
  // 验证会话并获取用户 UUID
  const sessionResult = await validateSessionLegacy(employeeId);
  if (sessionResult.success && sessionResult.user) {
    return sessionResult.user.id;
  }
  
  return null;
}

/**
 * PATCH - 批量标记已读
 */
export async function PATCH(request: NextRequest) {
  // 获取用户 UUID（支持 JWT 和传统认证）
  const userUUID = await getUserUUID(request);
  if (!userUUID) {
    return NextResponse.json(
      error('未登录', ErrorCode.UNAUTHORIZED),
      { status: 401 }
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
