/**
 * 单个课表格子操作 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { scheduleService } from '@/services/academic.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * DELETE - 删除课表格子
 */
export const DELETE = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const draftId = params?.id;
    const slotId = params?.slotId;
    
    if (!draftId || !slotId) {
      return NextResponse.json(error('缺少必要参数', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 通过 Service 删除
    const result = await scheduleService.deleteSlot({
      classId: '', // 需要从 slotId 解析
      weekDay: 0,
      periodIndex: 0,
      draftId,
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '删除失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success(null));
  } catch (err) {
    console.error('删除课表格子失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
