/**
 * 安全管理统计 API
 * 
 * GET: 获取安全统计数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth/route-protection';
import { safetyDrillService, safetyInspectionService } from '@/services/safety.service';
import { success, error, ErrorCode } from '@/lib/api';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取安全统计数据
 */
export const GET = protectedRoute(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || new Date().getFullYear().toString();

  try {
    // 获取演练统计
    const drillCountsResult = await safetyDrillService.countByType(year);
    const drillCounts = drillCountsResult.success ? drillCountsResult.data : {};

    // 获取检查统计
    const client = getSupabaseClient();
    
    // 今日检查数量
    const today = new Date().toISOString().split('T')[0];
    const { count: todayInspections } = await client
      .from('safety_inspections')
      .select('*', { count: 'exact', head: true })
      .eq('inspection_date', today);

    // 待处理隐患数量
    const { count: pendingHazards } = await client
      .from('safety_inspections')
      .select('*', { count: 'exact', head: true })
      .eq('resolved', false);

    // 本月已解决
    const monthStart = new Date();
    monthStart.setDate(1);
    const { count: resolvedThisMonth } = await client
      .from('safety_inspections')
      .select('*', { count: 'exact', head: true })
      .eq('resolved', true)
      .gte('resolved_at', monthStart.toISOString());

    // 计算安全等级
    const totalDrills = Object.values(drillCounts || {}).reduce((a: number, b) => a + b, 0);
    const unresolvedRatio = (pendingHazards || 0) / Math.max((todayInspections || 1), 1);
    let safetyLevel = '良好';
    if (unresolvedRatio > 0.5) {
      safetyLevel = '需改进';
    } else if (unresolvedRatio > 0.2) {
      safetyLevel = '一般';
    }

    return NextResponse.json(success({
      todayInspections: todayInspections || 0,
      pendingHazards: pendingHazards || 0,
      resolvedThisMonth: resolvedThisMonth || 0,
      safetyLevel,
      totalDrills,
      drillCounts,
    }));
  } catch (err) {
    console.error('[Safety Stats API] Error:', err);
    return NextResponse.json(
      error('获取统计数据失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});
