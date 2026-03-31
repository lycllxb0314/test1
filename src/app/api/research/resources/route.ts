/**
 * 教研资源API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { researchResourceExtService } from '@/services/research.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 查询资源
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const result = await researchResourceExtService.getList({
      themeId: searchParams.get('themeId') || undefined,
      activityId: searchParams.get('activityId') || undefined,
      resourceType: searchParams.get('resourceType') || searchParams.get('folderId') || undefined,
      sourceType: searchParams.get('sourceType') || undefined,
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '查询资源失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success(result.data));
  } catch (err) {
    console.error('查询资源失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * POST - 创建资源记录
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const user = context.user;
    const body = await request.json();
    
    if (!body.title || !body.themeId) {
      return NextResponse.json(error('缺少必要参数', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    
    const result = await researchResourceExtService.create(body, user?.name);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '创建资源失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success(result.data));
  } catch (err) {
    console.error('创建资源失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * DELETE - 删除资源
 */
export const DELETE = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(error('缺少资源ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    
    const result = await researchResourceExtService.delete(id);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '删除资源失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success({ id }));
  } catch (err) {
    console.error('删除资源失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
