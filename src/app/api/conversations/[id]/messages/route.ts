/**
 * 对话消息 API
 * 
 * POST - 添加消息到对话
 */

import { NextRequest, NextResponse } from 'next/server';
import { conversationService } from '@/services/conversation.service';
import type { CreateMessageRequest } from '@/types/conversation.types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const body: CreateMessageRequest = await request.json();

    const message = await conversationService.addUserMessage(conversationId, body.content);

    return NextResponse.json({ success: true, data: message });
  } catch (error) {
    console.error('[Messages API Error]:', error);
    return NextResponse.json(
      { success: false, error: '添加消息失败' },
      { status: 500 }
    );
  }
}
