/**
 * 试卷 API
 *
 * GET: 查询教师试卷列表
 * POST: 组卷保存
 * PATCH: 更新试卷状态/排版
 */

import { NextRequest, NextResponse } from 'next/server';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import { createSmartHomeworkService } from '@/services/smart-homework.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute } from '@/lib/auth';
import type { ComposePaperRequest } from '@/types/smart-homework';

/**
 * GET - 查询教师试卷列表
 */
export const GET = protectedRoute(async (request, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const options = {
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 20,
    };

    const service = createSmartHomeworkService();
    const result = await service.getTeacherPapers(user.id, options);

    if (result.success) {
      return NextResponse.json(success(result.data));
    }

    return NextResponse.json(
      error(result.error || '查询失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  } catch (err) {
    console.error('[ExamPapers GET Error]:', err);
    return NextResponse.json(
      error('查询试卷异常', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
});

/**
 * POST - 组卷保存
 */
export const POST = protectedRoute(async (request, { user }) => {
  try {
    const body: ComposePaperRequest = await request.json();

    if (!body.title || !body.questions?.length) {
      return NextResponse.json(
        error('试卷标题和试题为必填项', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const service = createSmartHomeworkService(customHeaders);

    // 先生成排版HTML
    const htmlResult = await service.generatePaperHtml(body);
    const paperHtml = htmlResult.success ? htmlResult.data! : '';

    // 保存试卷
    const result = await service.composePaper(
      { ...body, layoutConfig: { ...body.layoutConfig } },
      user.id,
      user.name || '未知教师'
    );

    if (result.success && paperHtml) {
      // 更新HTML
      const { getSupabaseClient } = require('@/storage/database/supabase-client');
      const supabase = getSupabaseClient();
      await supabase
        .from('exam_papers')
        .update({ paper_html: paperHtml })
        .eq('id', result.data!.id);
      result.data!.paperHtml = paperHtml;
    }

    if (result.success) {
      return NextResponse.json(success(result.data));
    }

    return NextResponse.json(
      error(result.error || '组卷失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  } catch (err) {
    console.error('[ExamPapers POST Error]:', err);
    return NextResponse.json(
      error('组卷异常', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
});
