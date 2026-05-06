/**
 * 授权密钥管理 API
 * GET  /api/mental-health/auth-keys  - 获取密钥列表
 * POST /api/mental-health/auth-keys  - 创建密钥
 * POST /api/mental-health/auth-keys/verify - 验证密钥
 * DELETE /api/mental-health/auth-keys/:id - 停用密钥
 */

import { NextRequest, NextResponse } from 'next/server';
import { mentalHealthService } from '@/services/mental-health.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute } from '@/lib/auth';

export const GET = protectedRoute(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const createdBy = searchParams.get('createdBy') || undefined;
    const keys = await mentalHealthService.getAuthKeys(createdBy);
    return NextResponse.json(success(keys, 'database'));
  } catch (err) {
    console.error('[MentalHealth AuthKeys GET Error]:', err);
    return NextResponse.json(error('获取密钥列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

export const POST = protectedRoute(async (request: NextRequest) => {
  try {
    const body = await request.json();

    if (body.action === 'verify') {
      const result = await mentalHealthService.verifyAuthKey(
        body.keyCode,
        body.classId,
        body.studentId,
      );
      return NextResponse.json(success(result, 'database'));
    }

    // 创建密钥
    const userId = request.headers.get('x-user-id') || '';
    const userName = request.headers.get('x-user-name') || '';

    const authKey = await mentalHealthService.createAuthKey(
      {
        scope: body.scope || 'class',
        targetClassId: body.targetClassId,
        targetStudentId: body.targetStudentId,
        validHours: body.validHours || 24,
        maxUses: body.maxUses || 1,
        description: body.description,
      },
      userId,
      decodeURIComponent(userName),
    );

    return NextResponse.json(success(authKey, 'database'));
  } catch (err) {
    console.error('[MentalHealth AuthKeys POST Error]:', err);
    return NextResponse.json(error('操作失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

export const DELETE = protectedRoute(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(error('缺少密钥ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    await mentalHealthService.deactivateAuthKey(id);
    return NextResponse.json(success(null, 'database'));
  } catch (err) {
    console.error('[MentalHealth AuthKeys DELETE Error]:', err);
    return NextResponse.json(error('停用密钥失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
