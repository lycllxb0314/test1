/**
 * 草稿详情 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { draftService } from '@/services/academic.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取草稿详情
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少草稿ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await draftService.getDetail(id);
    
    if (!result.success) {
      const statusCode = result.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json(error(result.error || '草稿不存在', result.code as ErrorCode), { status: statusCode });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('获取草稿详情失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * PUT - 更新草稿
 */
export const PUT = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少草稿ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const body = await request.json();
    const result = await draftService.update(id, body);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '更新草稿失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('更新草稿API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * DELETE - 删除草稿
 */
export const DELETE = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少草稿ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await draftService.delete(id);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '删除草稿失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('删除草稿API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
