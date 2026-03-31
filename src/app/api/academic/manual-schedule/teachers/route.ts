/**
 * 手动排课 - 可用教师 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { manualScheduleService } from '@/services/academic.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取可用教师列表
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const weekDay = searchParams.get('weekDay');
    const periodIndex = searchParams.get('periodIndex');
    
    const result = await manualScheduleService.getAvailableTeachers({
      subject: searchParams.get('subject') || undefined,
      weekDay: weekDay ? parseInt(weekDay) : undefined,
      periodIndex: periodIndex ? parseInt(periodIndex) : undefined,
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取教师列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('获取可用教师失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
