/**
 * 智能命题 API
 *
 * POST /api/smart-homework/questions
 * 根据细目表智能命题
 */

import { NextRequest, NextResponse } from 'next/server';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import { createSmartHomeworkService } from '@/services/smart-homework.service';
import { success, error, ErrorCode } from '@/lib/api';
import type { SpecificationTable } from '@/types/smart-homework';

export async function POST(request: NextRequest) {
  try {
    const specification: SpecificationTable = await request.json();

    if (!specification.questionTypePlans?.length) {
      return NextResponse.json(
        error('请先确认命题双向细目表', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const service = createSmartHomeworkService(customHeaders);

    const result = await service.generateQuestions(specification);

    if (result.success) {
      return NextResponse.json(success(result.data));
    }

    return NextResponse.json(
      error(result.error || '命题失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  } catch (err) {
    console.error('[SmartHomework Questions API Error]:', err);
    return NextResponse.json(
      error('命题服务异常', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
