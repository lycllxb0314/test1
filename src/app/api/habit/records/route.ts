/**
 * 打卡记录 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { habitRecordExtService } from '@/services/habit.ext.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取打卡记录
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const result = await habitRecordExtService.getList({
      monthlyGoalId: searchParams.get('monthlyGoalId') || undefined,
      studentId: searchParams.get('studentId') || undefined,
      month: searchParams.get('month') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: parseInt(searchParams.get('limit') || '100'),
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取打卡记录失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: result.data?.data || [],
      statistics: result.data?.statistics,
    });
  } catch (err) {
    console.error('打卡记录API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * POST - 创建打卡记录
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    const user = context.user;
    
    const result = await habitRecordExtService.upsert({
      studentGoalId: body.studentGoalId,
      studentId: body.studentId,
      checkDate: body.checkDate,
      month: body.month,
      photoUrl: body.photoUrl,
      description: body.description,
      parentComment: body.parentComment,
      createdBy: user?.id,
    });
    
    if (!result.success) {
      const statusCode = result.code === 'VALIDATION_ERROR' ? 400 : 500;
      return NextResponse.json(error(result.error || '创建打卡记录失败', result.code as ErrorCode), { status: statusCode });
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      message: '打卡成功',
    });
  } catch (err) {
    console.error('创建打卡记录API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
