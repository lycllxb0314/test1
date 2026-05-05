import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth/route-protection';
import { repairService } from '@/services/repair.service';
import { success, error, ErrorCode } from '@/lib/api';

export const GET = protectedRoute(async (request: NextRequest) => {
  const result = await repairService.getStatistics();

  if (!result.success) {
    return NextResponse.json(error(result.error || '获取统计数据失败', ErrorCode.NOT_FOUND), { status: 404 });
  }

  return NextResponse.json(success(result.data, 'database'));
});
