/**
 * 命题任务详情 API
 *
 * GET:    查询单个任务详情（含进度）
 * PATCH:  重试失败的任务
 */

import { NextRequest, NextResponse } from 'next/server';
import { createExamTaskService } from '@/services/exam-task.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute } from '@/lib/auth';
import type { ExtendedRouteContext } from '@/lib/auth/route-protection';

/**
 * GET - 查询任务详情
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        error('缺少任务ID', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    const service = createExamTaskService();
    const result = await service.getTask(id);

    if (result.success) {
      return NextResponse.json(success(result.data));
    }

    return NextResponse.json(
      error(result.error || '查询失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  } catch (err) {
    console.error('[ExamTask GET Error]:', err);
    return NextResponse.json(
      error('查询任务异常', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
});

/**
 * PATCH - 重试任务（失败任务重跑全流程，审阅未通过仅重命题部分板块）
 */
export const PATCH = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        error('缺少任务ID', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    const service = createExamTaskService();
    const result = await service.retryTask(id);

    if (result.success) {
      return NextResponse.json(success(result.data));
    }

    return NextResponse.json(
      error(result.error || '重试失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  } catch (err) {
    console.error('[ExamTask PATCH Error]:', err);
    return NextResponse.json(
      error('重试任务异常', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
});
