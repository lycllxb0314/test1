/**
 * 月度目标 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { monthlyGoalService } from '@/services/habit.ext.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取月度目标列表
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const result = await monthlyGoalService.getList({
      classId: searchParams.get('classId') || undefined,
      studentId: searchParams.get('studentId') || undefined,
      month: searchParams.get('month') || undefined,
      academicYear: searchParams.get('academicYear') || undefined,
      status: searchParams.get('status') || undefined,
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取月度目标失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('月度目标API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * POST - 创建月度目标
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    
    // 支持批量创建
    const goals = Array.isArray(body.goals) ? body.goals : [body];
    
    const result = await monthlyGoalService.create(goals.map((g: Record<string, unknown>) => ({
      classId: g.classId as string,
      studentId: g.studentId as string,
      month: g.month as string,
      academicYear: g.academicYear as string,
      goalId: g.goalId as string,
      customTitle: g.customTitle as string,
      customDescription: g.customDescription as string,
    })));
    
    if (!result.success) {
      const statusCode = result.code === 'DUPLICATE' ? 400 : 500;
      return NextResponse.json(error(result.error || '创建月度目标失败', result.code as ErrorCode), { status: statusCode });
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      message: '月度目标创建成功',
    });
  } catch (err) {
    console.error('创建月度目标API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
