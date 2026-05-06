/**
 * 预警管理 API
 * GET  /api/mental-health/warnings         - 获取预警列表
 * POST /api/mental-health/warnings/:id/read - 标记已读
 * POST /api/mental-health/warnings/:id/handle - 标记已处理
 */

import { NextRequest, NextResponse } from 'next/server';
import { mentalHealthService } from '@/services/mental-health.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute } from '@/lib/auth';

export const GET = protectedRoute(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const studentIds = searchParams.get('studentIds')?.split(',').filter(Boolean);

    const warnings = await mentalHealthService.getWarnings(studentIds);
    return NextResponse.json(success(warnings, 'database'));
  } catch (err) {
    console.error('[MentalHealth Warnings GET Error]:', err);
    return NextResponse.json(error('获取预警列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

export const POST = protectedRoute(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { action, warningId, note } = body;

    if (!warningId) {
      return NextResponse.json(error('缺少预警ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const userId = request.headers.get('x-user-id') || '';

    if (action === 'read') {
      await mentalHealthService.markWarningRead(warningId, userId);
      return NextResponse.json(success(null, 'database'));
    }

    if (action === 'handle') {
      if (!note) {
        return NextResponse.json(error('请填写处理备注', ErrorCode.BAD_REQUEST), { status: 400 });
      }
      await mentalHealthService.handleWarning(warningId, userId, note);
      return NextResponse.json(success(null, 'database'));
    }

    return NextResponse.json(error('未知操作', ErrorCode.BAD_REQUEST), { status: 400 });
  } catch (err) {
    console.error('[MentalHealth Warnings POST Error]:', err);
    return NextResponse.json(error('操作失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
