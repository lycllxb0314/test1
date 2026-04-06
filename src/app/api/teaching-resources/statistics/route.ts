/**
 * 教学资源统计 API Route
 * 
 * GET: 获取教师资源统计数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { teachingResourceService } from '@/services/teaching-resource.service';

/**
 * GET /api/teaching-resources/statistics
 * 获取统计数据
 */
export const GET = protectedRoute(async (request, { user }) => {
  try {
    // 使用认证用户的 ID
    const teacherId = user.id;

    const statistics = await teachingResourceService.getStatistics(teacherId);

    return NextResponse.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('[Teaching Resources Statistics API Error]:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '查询失败' },
      { status: 500 }
    );
  }
});
