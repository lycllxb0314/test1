/**
 * Word文档导出 API
 *
 * GET: 下载试卷Word文档
 *
 * 使用 docx 库在服务端生成 .docx 文件
 */

import { NextRequest, NextResponse } from 'next/server';
import { createExamTaskService } from '@/services/exam-task.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute } from '@/lib/auth';
import type { ExtendedRouteContext } from '@/lib/auth/route-protection';
import { generateExamDocx } from '@/lib/exam-docx';

/**
 * GET - 下载试卷Word文档
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

    if (!result.success || !result.data) {
      return NextResponse.json(
        error('任务不存在', ErrorCode.NOT_FOUND),
        { status: 404 }
      );
    }

    const task = result.data;
    if (task.status !== 'completed' || !task.questions?.length) {
      return NextResponse.json(
        error('任务尚未完成或没有题目', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    // 生成DOCX
    const docxBuffer = await generateExamDocx(task);

    // 返回文件下载
    const fileName = `${task.title || '试卷'}.docx`;
    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Content-Length': String(docxBuffer.length),
      },
    });
  } catch (err) {
    console.error('[ExamTaskDocx GET Error]:', err);
    return NextResponse.json(
      error('导出Word失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
});
