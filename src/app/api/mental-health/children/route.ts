/**
 * 获取家长关联的孩子列表（含人脸向量状态）
 * GET /api/mental-health/children
 */
import { NextRequest, NextResponse } from 'next/server';
import { mentalHealthService } from '@/services/mental-health.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute } from '@/lib/auth/route-protection';

export const dynamic = 'force-dynamic';

export const GET = protectedRoute(async (request, { user }) => {
  try {
    if (user.role !== 'parent') {
      return NextResponse.json(error('仅家长可访问', ErrorCode.FORBIDDEN), { status: 403 });
    }

    // 通过 user.id 查找家长关联的孩子
    const children = await mentalHealthService.getParentChildrenByUserId(user.id);
    return NextResponse.json(success(children, 'database'));
  } catch (err) {
    console.error('[mental-health/children] GET error:', err);
    return NextResponse.json(error('获取孩子列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}, { roles: ['parent'] });
