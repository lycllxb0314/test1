/**
 * 校本题库 API
 *
 * GET: 查询题库
 * POST: 导入题目
 */

import { NextRequest, NextResponse } from 'next/server';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import { createSmartHomeworkService } from '@/services/smart-homework.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute } from '@/lib/auth';
import type { QuestionBankQuery, ImportQuestionRequest } from '@/types/smart-homework';

/**
 * GET - 查询题库
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query: QuestionBankQuery = {
      subject: searchParams.get('subject') || undefined,
      grade: searchParams.get('grade') ? parseInt(searchParams.get('grade')!) : undefined,
      semester: searchParams.get('semester') || undefined,
      questionType: searchParams.get('questionType') as QuestionBankQuery['questionType'] || undefined,
      difficulty: searchParams.get('difficulty') as QuestionBankQuery['difficulty'] || undefined,
      knowledgePoint: searchParams.get('knowledgePoint') || undefined,
      keyword: searchParams.get('keyword') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 20,
    };

    const service = createSmartHomeworkService();
    const result = await service.queryQuestionBank(query);

    if (result.success) {
      return NextResponse.json(success(result.data));
    }

    return NextResponse.json(
      error(result.error || '查询失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  } catch (err) {
    console.error('[QuestionBank GET Error]:', err);
    return NextResponse.json(
      error('查询题库异常', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * POST - 导入题目
 */
export const POST = protectedRoute(async (request, { user }) => {
  try {
    const body: ImportQuestionRequest = await request.json();

    if (!body.title || !body.content || !body.answer) {
      return NextResponse.json(
        error('题目标题、内容和答案为必填项', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const service = createSmartHomeworkService(customHeaders);

    const result = await service.importQuestion(
      body,
      user.id,
      user.name || '未知教师'
    );

    if (result.success) {
      return NextResponse.json(success(result.data));
    }

    return NextResponse.json(
      error(result.error || '导入失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  } catch (err) {
    console.error('[QuestionBank POST Error]:', err);
    return NextResponse.json(
      error('导入题目异常', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
});
