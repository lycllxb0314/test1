/**
 * 推荐代课教师 API
 * 
 * 根据请假教师的时间段和年级，智能推荐可用的代课教师
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { success, error, ErrorCode } from '@/lib/api';
import { courseAdjustmentService } from '@/services/course-adjustment.service';

/**
 * GET - 获取推荐代课教师列表
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const adjustmentId = searchParams.get('adjustmentId');
    
    if (!adjustmentId) {
      return NextResponse.json(error('缺少调课记录ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }

    const result = await courseAdjustmentService.getRecommendedTeachers(adjustmentId);

    if (!result.success) {
      return NextResponse.json(error(result.error || '获取推荐教师失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('获取推荐教师失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
