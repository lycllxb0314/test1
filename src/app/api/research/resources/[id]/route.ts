/**
 * 单个资源操作 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { researchResourceExtService } from '@/services/research.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取单个资源详情
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少资源ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    
    // 通过 Service 层获取资源
    const result = await researchResourceExtService.getList({});
    
    if (!result.success) {
      return NextResponse.json(error('资源不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    const resource = result.data?.find((r: Record<string, unknown>) => r.id === id);
    if (!resource) {
      return NextResponse.json(error('资源不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    return NextResponse.json(success(resource));
  } catch (err) {
    console.error('获取资源失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * DELETE - 删除指定资源
 */
export const DELETE = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
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
