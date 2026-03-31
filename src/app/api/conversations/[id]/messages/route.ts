/**
 * 对话消息 API
 * 
 * POST - 添加消息到对话
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用 protectedRoute 进行认证保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { conversationService } from '@/services/conversation.service';
import { success, error, ErrorCode } from '@/lib/api';
import type { CreateMessageRequest } from '@/types/conversation.types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST - 添加消息到对话
 */
export const POST = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const { id: conversationId } = await (context as ExtendedRouteContext & RouteParams).params;
    const body: CreateMessageRequest = await request.json();

    const message = await conversationService.addUserMessage(conversationId, body.content);

    return NextResponse.json(success(message));
  } catch (err) {
    console.error('[Messages API Error]:', err);
    return NextResponse.json(
      error('添加消息失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});
