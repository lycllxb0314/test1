/**
 * 习惯养成统计 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { habitStatisticsService } from '@/services/habit.ext.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取统计数据
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const result = await habitStatisticsService.getStatistics({
      classId: searchParams.get('classId') || undefined,
      studentId: searchParams.get('studentId') || undefined,
      month: searchParams.get('month') || undefined,
      academicYear: searchParams.get('academicYear') || undefined,
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取统计数据失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('习惯统计API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
