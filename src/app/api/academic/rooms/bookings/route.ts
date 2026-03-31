/**
 * 教室预订 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { roomBookingService } from '@/services/academic.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取预订列表
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const result = await roomBookingService.getList({
      roomId: searchParams.get('roomId') || undefined,
      status: searchParams.get('status') || undefined,
      applicantId: searchParams.get('applicantId') || undefined,
      date: searchParams.get('date') || undefined,
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取预订列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('教室预订API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * POST - 创建预订
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const user = context.user;
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    
    const result = await roomBookingService.create({
      ...body,
      applicant_id: body.applicant_id || user.id,
      applicant_name: body.applicant_name || user.name,
    });
    
    if (!result.success) {
      const statusCode = result.code === 'VALIDATION_ERROR' ? 400 : 500;
      return NextResponse.json(error(result.error || '创建预订失败', result.code as ErrorCode), { status: statusCode });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('创建预订API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
