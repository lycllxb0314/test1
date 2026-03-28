/**
 * 单个对话 API
 * 
 * GET    - 获取对话详情
 * PATCH  - 更新对话标题
 * DELETE - 删除对话
 */

import { NextRequest, NextResponse } from 'next/server';
import { conversationService } from '@/services/conversation.service';
import type { UpdateConversationRequest } from '@/types/conversation.types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversation = await conversationService.getById(id);

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: '对话不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: conversation });
  } catch (error) {
    console.error('[Conversation API Error]:', error);
    return NextResponse.json(
      { success: false, error: '获取对话失败' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateConversationRequest = await request.json();

    const conversation = await conversationService.updateTitle(id, body.title || '新对话');

    return NextResponse.json({ success: true, data: conversation });
  } catch (error) {
    console.error('[Conversation API Error]:', error);
    return NextResponse.json(
      { success: false, error: '更新对话失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await conversationService.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Conversation API Error]:', error);
    return NextResponse.json(
      { success: false, error: '删除对话失败' },
      { status: 500 }
    );
  }
}
