/**
 * 草稿列表 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { draftService } from '@/services/academic.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取草稿列表
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const result = await draftService.getList();
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取草稿列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('草稿列表API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * POST - 创建草稿
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const user = context.user;
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    
    const result = await draftService.create({
      ...body,
      creator_id: user.id,
      creator_name: user.name,
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '创建草稿失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('创建草稿API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
