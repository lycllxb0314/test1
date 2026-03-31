/**
 * 教研阶段 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { researchStageExtService } from '@/services/research.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取教研阶段列表
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const themeId = searchParams.get('themeId');
    const status = searchParams.get('status') || undefined;
    
    if (!themeId) {
      return NextResponse.json(error('缺少主题ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await researchStageExtService.getList(themeId, status);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取教研阶段失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('教研阶段API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * POST - 创建教研阶段
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const user = context.user;
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    
    if (!body.themeId || !body.name) {
      return NextResponse.json(error('缺少必填字段', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await researchStageExtService.create(body);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '创建教研阶段失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      message: '教研阶段创建成功',
    });
  } catch (err) {
    console.error('创建教研阶段API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
