/**
 * 统计数据 API
 * GET - 获取台账统计
 */

import { NextRequest, NextResponse } from 'next/server';
import { classSopService } from '@/services/class-sop.service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get('classId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const [ledgerStats, usageStats, efficiency] = await Promise.all([
      classSopService.ledger.getStatistics(classId || undefined),
      classSopService.usage.getUsageStatistics(startDate || undefined, endDate || undefined),
      classSopService.usage.getEfficiencyAnalysis(undefined, classId || undefined),
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        ledger: ledgerStats,
        usage: usageStats,
        efficiency,
      },
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json(
      { success: false, error: '获取统计数据失败' },
      { status: 500 }
    );
  }
}
