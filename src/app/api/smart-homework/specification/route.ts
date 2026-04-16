/**
 * 命题双向细目表 API
 *
 * POST /api/smart-homework/specification
 * 生成命题双向细目表
 */

import { NextRequest, NextResponse } from 'next/server';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import { createSmartHomeworkService } from '@/services/smart-homework.service';
import { success, error, ErrorCode } from '@/lib/api';
import type { InferredRequirements } from '@/types/smart-homework';

export async function POST(request: NextRequest) {
  try {
    const requirements: InferredRequirements = await request.json();

    if (!requirements.subject || !requirements.knowledgePoints?.length) {
      return NextResponse.json(
        error('请确认需求（学科、知识点）后再生成细目表', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const service = createSmartHomeworkService(customHeaders);

    const result = await service.generateSpecification(requirements);

    if (result.success) {
      return NextResponse.json(success(result.data));
    }

    return NextResponse.json(
      error(result.error || '生成细目表失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  } catch (err) {
    console.error('[SmartHomework Specification API Error]:', err);
    return NextResponse.json(
      error('生成细目表服务异常', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
