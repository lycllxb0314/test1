/**
 * 学校统计 API
 * 
 * GET: 获取学校统计数据
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用 protectedRoute 进行认证保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { schoolStatsService } from '@/services/misc.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取学校统计数据
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  let result;
  if (startDate && endDate) {
    result = await schoolStatsService.getByDateRange(startDate, endDate);
  } else {
    result = await schoolStatsService.getLatest();
  }

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取学校统计失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
});
