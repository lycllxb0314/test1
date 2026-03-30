/**
 * 习作专项 API
 * 
 * POST /api/chinese-prep/writing
 * 
 * 生成习作提纲、好词好句、分层任务、评改指导、常见问题预设
 * 采用并行生成策略提升效率
 */

import { NextRequest, NextResponse } from 'next/server';
import { createWritingTeachingService } from '@/services/writing-teaching.service';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import type { WritingRequest } from '@/types/chinese-prep';

export async function POST(request: NextRequest) {
  try {
    const body: WritingRequest = await request.json();
    const { unit, writingType } = body;

    if (!unit || !writingType) {
      return NextResponse.json(
        { success: false, error: '请提供单元主题和习作类型' },
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const service = createWritingTeachingService(customHeaders);
    
    const result = await service.generateWritingPlan(body);

    if (result.success) {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Writing API Error]:', error);
    return NextResponse.json(
      { success: false, error: '生成习作备课方案失败' },
      { status: 500 }
    );
  }
}
