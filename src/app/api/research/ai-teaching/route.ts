/**
 * AI赋能教学应用 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiTeachingService } from '@/services/research.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取AI赋能教学应用列表
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const result = await aiTeachingService.getList({
      themeId: searchParams.get('themeId') || undefined,
      subject: searchParams.get('subject') || undefined,
      aiToolType: searchParams.get('aiToolType') || undefined,
      status: searchParams.get('status') || undefined,
      creatorId: searchParams.get('creatorId') || undefined,
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取AI教学应用失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('AI教学应用API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * POST - 创建AI赋能教学应用
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const user = context.user;
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    
    if (!body.themeId || !body.appName || !body.subject) {
      return NextResponse.json(error('缺少必填字段', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await aiTeachingService.create(body, user.id, user.name);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '创建AI教学应用失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'AI赋能教学应用创建成功',
    });
  } catch (err) {
    console.error('创建AI教学应用API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
