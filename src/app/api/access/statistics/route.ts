/**
 * 门禁统计 API
 */

import { NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth/route-protection';
import { accessRecordService } from '@/services/access-control.service';
import { success, error, ErrorCode } from '@/lib/api';

export const GET = protectedRoute(async () => {
  const result = await accessRecordService.getStatistics();

  if (!result.success) {
    return NextResponse.json(error(result.error || '获取统计失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }

  return NextResponse.json(success(result.data));
});
