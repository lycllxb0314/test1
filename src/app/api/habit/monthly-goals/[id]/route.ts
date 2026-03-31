/**
 * 单个月度目标 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { monthlyGoalService } from '@/services/habit.ext.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取单个月度目标详情
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少目标ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await monthlyGoalService.getList({});
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取月度目标失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    const goal = result.data?.find(g => g.id === id);
    if (!goal) {
      return NextResponse.json(error('月度目标不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: goal });
  } catch (err) {
    console.error('获取月度目标详情失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * PUT - 更新月度目标
 */
export const PUT = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少目标ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const body = await request.json();
    const result = await monthlyGoalService.update(id, body);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '更新月度目标失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('更新月度目标API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * DELETE - 删除月度目标
 */
export const DELETE = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少目标ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await monthlyGoalService.delete(id);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '删除月度目标失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('删除月度目标API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
