/**
 * 草稿课表格子列表 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { scheduleService } from '@/services/academic.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取草稿的课表格子
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const draftId = params?.id;
    
    if (!draftId) {
      return NextResponse.json(error('缺少草稿ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await scheduleService.getOfficialSchedule({ classId: draftId });
    
    // 注意：这里应该查询 draft_id = draftId 的记录
    // 需要扩展 Service 层支持按 draftId 查询
    
    return NextResponse.json(success(result.data || []));
  } catch (err) {
    console.error('获取草稿课表失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * POST - 保存课表格子
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const draftId = params?.id;
    
    if (!draftId) {
      return NextResponse.json(error('缺少草稿ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const body = await request.json();
    
    const result = await scheduleService.saveSlot({
      ...body,
      draftId,
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '保存失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success(result.data));
  } catch (err) {
    console.error('保存课表格子失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
