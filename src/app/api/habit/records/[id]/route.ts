/**
 * 单个打卡记录 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { habitRecordExtService } from '@/services/habit.ext.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取单个打卡记录详情
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少记录ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await habitRecordExtService.getList({});
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取打卡记录失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    const record = result.data?.data?.find(r => r.id === id);
    if (!record) {
      return NextResponse.json(error('打卡记录不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: record });
  } catch (err) {
    console.error('获取打卡记录详情失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * DELETE - 删除打卡记录
 */
export const DELETE = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少记录ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await habitRecordExtService.delete(id);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '删除打卡记录失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('删除打卡记录API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * PATCH - 更新打卡记录（班主任评论等）
 */
export const PATCH = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少记录ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const body = await request.json();
    
    const result = await habitRecordExtService.update(id, {
      teacherComment: body.teacherComment,
      status: body.status,
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '更新打卡记录失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      message: '更新成功',
    });
  } catch (err) {
    console.error('更新打卡记录API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
