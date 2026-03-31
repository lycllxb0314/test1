/**
 * 教室管理 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { roomService } from '@/services/academic.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取教室列表
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const result = await roomService.getList({
      id: searchParams.get('id') || undefined,
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      building: searchParams.get('building') || undefined,
      search: searchParams.get('search') || undefined,
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取教室列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('教室管理API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * POST - 创建新教室
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    
    const result = await roomService.create(body);
    
    if (!result.success) {
      const statusCode = result.code === 'VALIDATION_ERROR' ? 400 : 500;
      return NextResponse.json(error(result.error || '创建教室失败', result.code as ErrorCode), { status: statusCode });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('创建教室API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * PUT - 更新教室信息
 */
export const PUT = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(error('缺少教室ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await roomService.update(body.id, body);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '更新教室失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('更新教室API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
