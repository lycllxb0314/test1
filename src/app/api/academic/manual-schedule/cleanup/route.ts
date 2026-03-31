/**
 * 手动排课 - 清理课表 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { scheduleService } from '@/services/academic.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * POST - 清空课表
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    const { draftId } = body;
    
    const result = await scheduleService.clearSchedule(draftId);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '清理失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success({ message: '课表已清空' }));
  } catch (err) {
    console.error('清理课表失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
