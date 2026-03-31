/**
 * 学校课表 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { scheduleService } from '@/services/academic.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取学校课表概览
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get('grade');
    
    if (grade) {
      // 获取指定年级课表
      const result = await scheduleService.getOfficialSchedule({ grade: parseInt(grade) });
      
      if (!result.success) {
        return NextResponse.json(error(result.error || '获取年级课表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
      }
      
      return NextResponse.json({ success: true, data: result.data });
    }
    
    // 获取排课状态
    const statusResult = await scheduleService.getStatus();
    
    if (!statusResult.success) {
      return NextResponse.json(error(statusResult.error || '获取课表状态失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: statusResult.data });
  } catch (err) {
    console.error('学校课表API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
