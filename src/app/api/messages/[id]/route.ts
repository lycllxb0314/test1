/**
 * 消息详情 API
 * 
 * GET: 获取消息详情
 * PUT: 更新消息状态（已读、未读、归档等）
 * DELETE: 删除消息
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { messageService } from '@/services/message.service';
import { messageRepository } from '@/repositories/message.repository';
import { userRepository } from '@/repositories/user.repository';
import { success, error, ErrorCode } from '@/lib/api';
import { extractUserIdLegacy, validateSessionLegacy } from '@/lib/auth/auth-middleware';
import { extractTokens, validateSession as validateJwtSession } from '@/lib/auth/session';

interface RouteParams {
  params: Promise<{ id: string }>;
}

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
 * GET - 获取消息详情
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  // 直接从 repository 获取
  const message = await messageRepository.findById(id);
  
  if (!message) {
    return NextResponse.json(
      error('消息不存在', ErrorCode.NOT_FOUND),
      { status: 404 }
    );
  }

  return NextResponse.json(success({
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
  }));
}

/**
 * PUT - 更新消息状态
 * 支持 action: read, unread, archive
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const action = body.action;
  
  // 获取用户 UUID（支持 JWT 和传统认证）
  const userUUID = await getUserUUID(request);
  if (!userUUID) {
    return NextResponse.json(
      error('未登录', ErrorCode.UNAUTHORIZED),
      { status: 401 }
    );
  }

  let result;
  
  switch (action) {
    case 'read':
    case 'markRead':
      result = await messageService.markAsRead(id, userUUID);
      break;
    case 'unread':
      result = await messageService.markAsUnread(id, userUUID);
      break;
    case 'archive':
      result = await messageService.archive(id, userUUID);
      break;
    default:
      return NextResponse.json(
        error('无效的操作', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
  }

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '更新消息失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
}

/**
 * DELETE - 删除消息（软删除或从用户视角删除）
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  // 获取用户 UUID（支持 JWT 和传统认证）
  const userUUID = await getUserUUID(request);
  if (!userUUID) {
    return NextResponse.json(
      error('未登录', ErrorCode.UNAUTHORIZED),
      { status: 401 }
    );
  }

  // 标记为已删除（归档）
  const result = await messageService.archive(id, userUUID);

  if (!result.success) {
    return NextResponse.json(
      error('删除消息失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success({ deleted: true }));
}
