/**
 * 教研阶段详情 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { researchStageExtService } from '@/services/research.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取教研阶段详情
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少阶段ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 使用 getList 获取单个阶段（简化实现）
    const result = await researchStageExtService.getList(id);
    
    if (!result.success || !result.data || result.data.length === 0) {
      return NextResponse.json(error('教研阶段不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: result.data[0] });
  } catch (err) {
    console.error('获取教研阶段详情失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * PUT - 更新教研阶段
 */
export const PUT = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    const user = context.user;
    
    if (!id) {
      return NextResponse.json(error('缺少阶段ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    const result = await researchStageExtService.update(id, body);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '更新教研阶段失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('更新教研阶段API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * DELETE - 删除教研阶段
 */
export const DELETE = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    const user = context.user;
    
    if (!id) {
      return NextResponse.json(error('缺少阶段ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const result = await researchStageExtService.delete(id);
    
    if (!result.success) {
      const statusCode = result.code === 'VALIDATION_ERROR' ? 400 : 500;
      return NextResponse.json(error(result.error || '删除教研阶段失败', result.code as ErrorCode), { status: statusCode });
    }
    
    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('删除教研阶段API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
