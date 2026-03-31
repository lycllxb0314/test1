/**
 * 习惯目标库 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { habitGoalTemplateService } from '@/services/habit.ext.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取目标列表
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const result = await habitGoalTemplateService.getList({
      category: searchParams.get('category') || undefined,
      gradeRange: searchParams.get('gradeRange') || undefined,
      isActive: searchParams.get('isActive') || undefined,
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取目标列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: result.data?.data || [],
      statistics: result.data?.statistics,
    });
  } catch (err) {
    console.error('习惯目标API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * POST - 创建目标
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    
    const result = await habitGoalTemplateService.create({
      category: body.category,
      code: body.code,
      title: body.title,
      description: body.description,
      gradeRange: body.gradeRange,
      difficulty: body.difficulty,
    });
    
    if (!result.success) {
      const statusCode = result.code === 'VALIDATION_ERROR' ? 400 : 500;
      return NextResponse.json(error(result.error || '创建目标失败', result.code as ErrorCode), { status: statusCode });
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      message: '目标创建成功',
    });
  } catch (err) {
    console.error('创建习惯目标API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
