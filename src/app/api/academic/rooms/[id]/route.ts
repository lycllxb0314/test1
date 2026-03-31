/**
 * 单个教室操作 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { roomService } from '@/services/academic.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取单个教室详情
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少教室ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await roomService.getList({ id });
    
    if (!result.success || !result.data || result.data.length === 0) {
      return NextResponse.json(error('教室不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: result.data[0] });
  } catch (err) {
    console.error('获取教室详情失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * PUT - 更新教室
 */
export const PUT = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少教室ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const body = await request.json();
    const result = await roomService.update(id, body);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '更新教室失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('更新教室API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * DELETE - 删除教室
 */
export const DELETE = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少教室ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await roomService.delete(id);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '删除教室失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('删除教室API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
