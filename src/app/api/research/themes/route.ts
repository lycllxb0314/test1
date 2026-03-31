/**
 * 教研主题管理 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { researchThemeService } from '@/services/research.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取教研主题列表
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const result = await researchThemeService.getList({
      type: searchParams.get('type') || undefined,
      subject: searchParams.get('subject') || undefined,
      level: searchParams.get('level') || undefined,
      status: searchParams.get('status') || undefined,
      creatorId: searchParams.get('creatorId') || undefined,
      participantId: searchParams.get('participantId') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取教研主题失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.pagination?.total || 0,
      page: result.pagination?.page,
      pageSize: result.pagination?.pageSize,
      totalPages: result.pagination?.totalPages,
    });
  } catch (err) {
    console.error('教研主题API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * POST - 创建教研主题
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const user = context.user;
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    
    if (!body.title || !body.type || !body.subject || !body.level) {
      return NextResponse.json(error('缺少必填字段', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await researchThemeService.create(body, user.id, user.name);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '创建教研主题失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      message: '教研主题创建成功',
    });
  } catch (err) {
    console.error('创建教研主题API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
