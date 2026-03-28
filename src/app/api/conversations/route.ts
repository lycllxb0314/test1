/**
 * 对话列表 API
 * 
 * GET  - 获取对话列表
 * POST - 创建新对话
 */

import { NextRequest, NextResponse } from 'next/server';
import { conversationService } from '@/services/conversation.service';
import type { CreateConversationRequest } from '@/types/conversation.types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const conversations = await conversationService.getList('teacher-001', {
      subject,
      page,
      pageSize,
    });

    return NextResponse.json({ success: true, data: conversations });
  } catch (error) {
    console.error('[Conversations API Error]:', error);
    return NextResponse.json(
      { success: false, error: '获取对话列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateConversationRequest = await request.json();

    const conversation = await conversationService.create('teacher-001', body);

    return NextResponse.json({ success: true, data: conversation });
  } catch (error) {
    console.error('[Conversations API Error]:', error);
    return NextResponse.json(
      { success: false, error: '创建对话失败' },
      { status: 500 }
    );
  }
}
