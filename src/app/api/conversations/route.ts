/**
 * 对话列表 API
 * 
 * GET  - 获取对话列表
 * POST - 创建新对话
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用 protectedRoute 进行认证保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { conversationService } from '@/services/conversation.service';
import { success, error, ErrorCode } from '@/lib/api';
import type { CreateConversationRequest } from '@/types/conversation.types';

/**
 * GET - 获取对话列表
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const conversations = await conversationService.getList(user.id, {
      subject,
      page,
      pageSize,
    });

    return NextResponse.json(success(conversations));
  } catch (err) {
    console.error('[Conversations API Error]:', err);
    return NextResponse.json(
      error('获取对话列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});

/**
 * POST - 创建新对话
 */
export const POST = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const body: CreateConversationRequest = await request.json();

    const conversation = await conversationService.create(user.id, body);

    return NextResponse.json(success(conversation));
  } catch (err) {
    console.error('[Conversations API Error]:', err);
    return NextResponse.json(
      error('创建对话失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});
