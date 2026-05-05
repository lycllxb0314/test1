/**
 * 设备管理 API
 * GET: 获取设备列表
 * POST: 创建设备
 */

import { NextRequest, NextResponse } from 'next/server';
import { success, error, ErrorCode } from '@/lib/api';
import { deviceService } from '@/services/device.service';
import { protectedRoute } from '@/lib/auth';
import type { DeviceFilters } from '@/types/general';

export const GET = protectedRoute(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: DeviceFilters = {
      type: searchParams.get('type') as DeviceFilters['type'] || undefined,
      status: searchParams.get('status') as DeviceFilters['status'] || undefined,
      building: searchParams.get('building') || undefined,
      floor: searchParams.get('floor') ? parseInt(searchParams.get('floor')!) : undefined,
      search: searchParams.get('search') || undefined,
    };

    // 过滤掉 undefined 值
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== undefined)
    ) as DeviceFilters;

    const result = await deviceService.getDevices(cleanFilters);

    if (!result.success) {
      return NextResponse.json(error(result.error || '获取设备列表失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('[Devices API] GET error:', err);
    return NextResponse.json(error('获取设备列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

export const POST = protectedRoute(async (request: NextRequest) => {
  try {
    const body = await request.json();

    if (!body.name || !body.type) {
      return NextResponse.json(error('缺少必要参数', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    // 生成设备编号
    const deviceNo = body.deviceNo || `DEV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const result = await deviceService.createDevice({
      ...body,
      id: `device-${Date.now()}`,
      deviceNo,
      status: body.status || '正常',
      isOnline: body.isOnline ?? false,
      isOn: body.isOn ?? false,
    });

    if (!result.success) {
      return NextResponse.json(error(result.error || '创建设备失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('[Devices API] POST error:', err);
    return NextResponse.json(error('创建设备失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
