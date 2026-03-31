/**
 * 学科实践活动 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { practiceActivityService } from '@/services/research.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取学科实践活动列表
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const grade = searchParams.get('grade');
    
    const result = await practiceActivityService.getList({
      themeId: searchParams.get('themeId') || undefined,
      subject: searchParams.get('subject') || undefined,
      grade: grade ? parseInt(grade) : undefined,
      activityType: searchParams.get('activityType') || undefined,
      status: searchParams.get('status') || undefined,
      creatorId: searchParams.get('creatorId') || undefined,
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取学科实践活动失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('学科实践活动API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * POST - 创建学科实践活动
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const user = context.user;
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    
    if (!body.themeId || !body.activityName || !body.subject || !body.grade) {
      return NextResponse.json(error('缺少必填字段', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await practiceActivityService.create(body, user.id, user.name);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '创建学科实践活动失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      message: '学科实践活动创建成功',
    });
  } catch (err) {
    console.error('创建学科实践活动API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
