/**
 * 心理健康统计概览 API
 * GET /api/mental-health/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { mentalHealthService } from '@/services/mental-health.service';
import { success, error, ErrorCode } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentIds = searchParams.get('studentIds')?.split(',').filter(Boolean);
    const stats = await mentalHealthService.getStats(studentIds);
    return NextResponse.json(success(stats, 'database'));
  } catch (err) {
    console.error('[MentalHealth Stats Error]:', err);
    return NextResponse.json(error('获取统计失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
