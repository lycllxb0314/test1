/**
 * 单个预订操作 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { roomBookingService } from '@/services/academic.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取单个预订详情
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少预订ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await roomBookingService.getList({ roomId: id });
    
    if (!result.success || !result.data || result.data.length === 0) {
      return NextResponse.json(error('预订不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: result.data[0] });
  } catch (err) {
    console.error('获取预订详情失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * PUT - 更新预订
 */
export const PUT = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少预订ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const body = await request.json();
    const result = await roomBookingService.update(id, body);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '更新预订失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('更新预订API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * DELETE - 取消预订
 */
export const DELETE = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少预订ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await roomBookingService.delete(id);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '取消预订失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: '预订已取消' });
  } catch (err) {
    console.error('取消预订API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
