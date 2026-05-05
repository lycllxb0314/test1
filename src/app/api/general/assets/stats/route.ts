/**
 * 资产统计 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { success, error, ErrorCode } from '@/lib/api';
import { assetService } from '@/services/asset.service';
import { protectedRoute } from '@/lib/auth';

export const GET = protectedRoute(async (request: NextRequest) => {
  try {
    const result = await assetService.getStatistics();
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取统计失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    // 获取完整资产列表计算总值和数量
    const listResult = await assetService.getList({});
    const assets = listResult.data || [];
    
    const totalValue = assets.reduce((sum, a) => sum + (Number(a.purchase_price) || 0), 0);
    const totalQuantity = assets.reduce((sum, a) => sum + (a.quantity || 1), 0);

    return NextResponse.json(success({
      byCategory: result.data?.byCategory || {},
      byStatus: result.data?.byStatus || {},
      totalAssets: assets.length,
      totalQuantity,
      totalValue,
    }, 'database'));
  } catch (err) {
    console.error('[Assets Stats API] GET error:', err);
    return NextResponse.json(error('获取统计失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
