/**
 * 习惯之星 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { habitStarExtService } from '@/services/habit.ext.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取习惯之星列表
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const grade = searchParams.get('grade');
    
    const result = await habitStarExtService.getList({
      studentId: searchParams.get('studentId') || undefined,
      month: searchParams.get('month') || undefined,
      grade: grade ? parseInt(grade) : undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取习惯之星列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: result.data?.data || [],
      statistics: result.data?.statistics,
    });
  } catch (err) {
    console.error('习惯之星API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * POST - 创建习惯之星
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    
    const result = await habitStarExtService.create({
      studentId: body.studentId,
      month: body.month,
      categories: body.categories,
      score: body.score,
      achievements: body.achievements,
      grade: body.grade,
    });
    
    if (!result.success) {
      const statusCode = result.code === 'VALIDATION_ERROR' || result.code === 'NOT_FOUND' ? 400 : 
                        result.code === 'DUPLICATE' ? 400 : 500;
      return NextResponse.json(error(result.error || '创建习惯之星失败', result.code as ErrorCode), { status: statusCode });
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      message: '习惯之星评选成功',
    });
  } catch (err) {
    console.error('创建习惯之星API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
