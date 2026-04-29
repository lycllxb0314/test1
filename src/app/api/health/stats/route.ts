/**
 * 健康管理统计概览 API
 * GET /api/health/stats
 */
import { NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { healthManagementService } from '@/services/health-management.service';

export const GET = protectedRoute(async () => {
  const result = await healthManagementService.getStatsOverview();
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: result.data });
});
