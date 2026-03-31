/**
 * 手动排课 - 年级课表 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { manualScheduleService } from '@/services/academic.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取年级课表
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get('grade');
    
    if (!grade) {
      return NextResponse.json(error('缺少年级参数', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await manualScheduleService.getGradeSchedule(parseInt(grade));
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取年级课表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('获取年级课表失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
