/**
 * 手动排课 - 状态查询 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { scheduleService } from '@/services/academic.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取排课状态
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const result = await scheduleService.getStatus();
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取状态失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('获取排课状态失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
