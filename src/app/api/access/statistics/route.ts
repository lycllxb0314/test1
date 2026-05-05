/**
 * 门禁统计 API
 */

import { NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth/route-protection';
import { accessControlService } from '@/services/access-control.service';
import { success, error, ErrorCode } from '@/lib/api';

export const GET = protectedRoute(async () => {
  const result = await accessControlService.getStatistics();

  if (!result.success) {
    return NextResponse.json(error(result.error || '获取统计失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }

  return NextResponse.json(success(result.data));
});
