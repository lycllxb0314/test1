/**
 * 设备管理 API - 批量控制
 */

import { NextRequest, NextResponse } from 'next/server';
import { success, error, ErrorCode } from '@/lib/api';
import { deviceService } from '@/services/device.service';
import { protectedRoute } from '@/lib/auth';

export const POST = protectedRoute(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { deviceIds, action } = body;

    if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
      return NextResponse.json(error('请选择要控制的设备', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    if (!action || !['turnOn', 'turnOff'].includes(action)) {
      return NextResponse.json(error('无效的操作', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    let successCount = 0;
    for (const deviceId of deviceIds) {
      const result = await deviceService.toggleDevice(deviceId, action === 'turnOn');
      if (result.success) {
        successCount++;
      }
    }

    return NextResponse.json(success({ successCount, total: deviceIds.length }, 'database'));
  } catch (err) {
    console.error('[Devices Control API] POST error:', err);
    return NextResponse.json(error('批量控制失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
