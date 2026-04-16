/**
 * 需求对话 API
 *
 * POST /api/smart-homework/chat
 *
 * AI与教师进行需求确认对话，因果推理揣测教师意图
 */

import { NextRequest, NextResponse } from 'next/server';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import { createSmartHomeworkService } from '@/services/smart-homework.service';
import { success, error, ErrorCode } from '@/lib/api';
import type { ChatRequest } from '@/types/smart-homework';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();

    if (!body.message) {
      return NextResponse.json(
        error('请输入消息', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const service = createSmartHomeworkService(customHeaders);

    const result = await service.chatWithTeacher(body);

    if (result.success) {
      return NextResponse.json(success(result.data));
    }

    return NextResponse.json(
      error(result.error || '对话失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  } catch (err) {
    console.error('[SmartHomework Chat API Error]:', err);
    return NextResponse.json(
      error('对话服务异常', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
