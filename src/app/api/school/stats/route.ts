/**
 * 学校统计 API
 * 
 * GET: 获取学校统计数据
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { schoolStatsService } from '@/services/misc.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取学校统计数据
 */
export async function GET(request: NextRequest) {
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
}
