/**
 * 人脸验证 API - 二次鉴权
 * POST /api/mental-health/face-verify
 */
import { NextRequest, NextResponse } from 'next/server';
import { mentalHealthService } from '@/services/mental-health.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute } from '@/lib/auth/route-protection';

export const dynamic = 'force-dynamic';

export const POST = protectedRoute(async (request, { user }) => {
  try {
    if (user.role !== 'parent') {
      return NextResponse.json(error('仅家长可使用', ErrorCode.FORBIDDEN), { status: 403 });
    }

    const body = await request.json();
    const { studentId, imageBase64 } = body;

    if (!studentId || !imageBase64) {
      return NextResponse.json(error('缺少必要参数', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    // 验证该学生属于当前家长
    const children = await mentalHealthService.getParentChildrenByUserId(user.id);
    const child = children.find((c: { studentId: string }) => c.studentId === studentId);
    if (!child) {
      return NextResponse.json(error('该学生与当前账号无关联', ErrorCode.FORBIDDEN), { status: 403 });
    }

    // 执行人脸验证
    const result = await mentalHealthService.verifyFace(studentId, imageBase64);
    return NextResponse.json(success(result, 'database'));
  } catch (err) {
    console.error('[mental-health/face-verify] POST error:', err);
    return NextResponse.json(error('人脸验证失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}, { roles: ['parent'] });
