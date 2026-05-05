/**
 * 设备管理 API - 统计数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { success, error, ErrorCode } from '@/lib/api';
import { deviceService } from '@/services/device.service';
import { protectedRoute } from '@/lib/auth';

export const GET = protectedRoute(async (request: NextRequest) => {
  try {
    const result = await deviceService.getStatistics();

    if (!result.success) {
      return NextResponse.json(error(result.error || '获取统计数据失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('[Devices Stats API] GET error:', err);
    return NextResponse.json(error('获取统计数据失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
