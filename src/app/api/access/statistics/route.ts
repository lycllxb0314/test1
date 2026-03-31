/**
 * 门禁统计 API
 * 
 * GET: 获取门禁统计数据
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { accessRecordService, accessDeviceService } from '@/services/access.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取门禁统计数据
 */
export async function GET(request: NextRequest) {
  // 获取设备统计
  const devicesResult = await accessDeviceService.getList({});
  
  // 获取今日统计
  const todayCountResult = await accessRecordService.countToday();
  const todayVisitorsResult = await accessRecordService.countTodayVisitors();

  if (!devicesResult.success) {
    return NextResponse.json(
      error(devicesResult.error || '获取门禁统计失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  const devices = devicesResult.data || [];
  const onlineDevices = devices.filter((d: any) => d.status === 'online').length;

  return NextResponse.json(success({
    totalDevices: devices.length,
    onlineDevices,
    todayRecords: todayCountResult.success ? todayCountResult.data : 0,
    todayVisitors: todayVisitorsResult.success ? todayVisitorsResult.data : 0,
  }));
}
