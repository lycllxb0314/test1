/**
 * 单个习惯目标 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { habitGoalTemplateService } from '@/services/habit.ext.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取单个目标详情
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少目标ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await habitGoalTemplateService.getList({});
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取目标失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    const goal = result.data?.data?.find(g => g.id === id);
    if (!goal) {
      return NextResponse.json(error('目标不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: goal });
  } catch (err) {
    console.error('获取习惯目标详情失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * PUT - 更新目标
 */
export const PUT = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少目标ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const body = await request.json();
    const result = await habitGoalTemplateService.update(id, body);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '更新目标失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('更新习惯目标API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * DELETE - 删除目标
 */
export const DELETE = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少目标ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await habitGoalTemplateService.delete(id);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '删除目标失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('删除习惯目标API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
