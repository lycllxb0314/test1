/**
 * 单个对话 API
 * 
 * GET    - 获取对话详情
 * PATCH  - 更新对话标题
 * DELETE - 删除对话
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用 protectedRoute 进行认证保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { conversationService } from '@/services/conversation.service';
import { success, error, ErrorCode } from '@/lib/api';
import type { UpdateConversationRequest } from '@/types/conversation.types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET - 获取对话详情
 */
export const GET = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const { id } = await (context as ExtendedRouteContext & RouteParams).params;
    const conversation = await conversationService.getById(id);

    if (!conversation) {
      return NextResponse.json(
        error('对话不存在', ErrorCode.NOT_FOUND),
        { status: 404 }
      );
    }

    return NextResponse.json(success(conversation));
  } catch (err) {
    console.error('[Conversation API Error]:', err);
    return NextResponse.json(
      error('获取对话失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});

/**
 * PATCH - 更新对话标题
 */
export const PATCH = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const { id } = await (context as ExtendedRouteContext & RouteParams).params;
    const body: UpdateConversationRequest = await request.json();

    const conversation = await conversationService.updateTitle(id, body.title || '新对话');

    return NextResponse.json(success(conversation));
  } catch (err) {
    console.error('[Conversation API Error]:', err);
    return NextResponse.json(
      error('更新对话失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});

/**
 * DELETE - 删除对话
 */
export const DELETE = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const { id } = await (context as ExtendedRouteContext & RouteParams).params;
    await conversationService.delete(id);

    return NextResponse.json(success({ deleted: true }));
  } catch (err) {
    console.error('[Conversation API Error]:', err);
    return NextResponse.json(
      error('删除对话失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});
