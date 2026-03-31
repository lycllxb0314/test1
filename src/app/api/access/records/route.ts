/**
 * 门禁记录 API
 * 
 * GET: 获取门禁记录列表
 * POST: 创建门禁记录
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { accessRecordService } from '@/services/access.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取门禁记录列表
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId') || undefined;
  const personType = searchParams.get('personType') || undefined;
  const direction = searchParams.get('direction') || undefined;
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  const result = await accessRecordService.getList({
    deviceId,
    personType,
    direction,
    startDate,
    endDate,
  });

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取门禁记录失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  // 处理分页结果或数组
  const records = Array.isArray(result.data) ? result.data : (result.data as any).data || [];
  
  const formattedData = records.map((record: any) => ({
    id: record.id,
    deviceId: record.device_id,
    personId: record.person_id,
    personName: record.person_name,
    personType: record.person_type,
    direction: record.direction,
    occurredAt: record.occurred_at,
    temperature: record.temperature,
    imageUrl: record.image_url,
    createdAt: record.created_at,
  }));

  return NextResponse.json(success(formattedData));
}

/**
 * POST - 创建门禁记录
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = await accessRecordService.create({
    device_id: body.deviceId,
    person_id: body.personId,
    person_name: body.personName,
    person_type: body.personType,
    direction: body.direction,
    occurred_at: body.occurredAt || new Date().toISOString(),
    image_url: body.imageUrl,
    temperature: body.temperature,
  });

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '创建门禁记录失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
}
