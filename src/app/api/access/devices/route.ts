/**
 * 门禁设备 API
 * 
 * GET: 获取门禁设备列表
 * POST: 创建门禁设备
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { accessDeviceService } from '@/services/access.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取门禁设备列表
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const type = searchParams.get('type') || undefined;

  const result = await accessDeviceService.getList({ status, type });

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取门禁设备列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
}

/**
 * POST - 创建门禁设备
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = await accessDeviceService.create({
    name: body.name,
    code: body.code || `DEV-${Date.now()}`,
    type: body.type,
    location: body.location,
    ip_address: body.ipAddress,
    status: body.status || 'offline',
  });

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '创建门禁设备失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
}
