/**
 * 命题任务 API
 *
 * GET:  查询命题任务列表
 * POST: 创建命题任务并启动AI全自动工作流
 */

import { NextRequest, NextResponse } from 'next/server';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import { createExamTaskService } from '@/services/exam-task.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute } from '@/lib/auth';

/**
 * GET - 查询命题任务列表
 */
export const GET = protectedRoute(async (request, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const options = {
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 20,
    };

    const service = createExamTaskService();
    const result = await service.getTasksByCreator(user.id, options);

    if (result.success) {
      return NextResponse.json(success(result.data));
    }

    return NextResponse.json(
      error(result.error || '查询失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  } catch (err) {
    console.error('[ExamTasks GET Error]:', err);
    return NextResponse.json(
      error('查询任务异常', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
});

/**
 * POST - 创建命题任务并启动AI全自动工作流
 */
export const POST = protectedRoute(async (request, { user }) => {
  try {
    const body = await request.json();

    if (!body.title || !body.specification) {
      return NextResponse.json(
        error('标题和细目表为必填项', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const service = createExamTaskService(customHeaders);

    const result = await service.createAndStart(
      {
        title: body.title,
        subject: body.subject || body.specification.subject,
        grade: body.grade || body.specification.grade,
        semester: body.semester || body.specification.semester,
        examType: body.examType || body.specification.examType,
        totalScore: body.totalScore || body.specification.totalScore,
        duration: body.duration || body.specification.duration,
        specification: body.specification,
        notes: body.notes,
      },
      user.id,
      user.name || '未知教师'
    );

    if (result.success) {
      return NextResponse.json(success(result.data));
    }

    return NextResponse.json(
      error(result.error || '创建任务失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  } catch (err) {
    console.error('[ExamTasks POST Error]:', err);
    return NextResponse.json(
      error('创建任务异常', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
});
