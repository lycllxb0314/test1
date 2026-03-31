/**
 * 场地/教室 API
 * 
 * GET: 获取场地列表
 * POST: 创建场地
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { roomService } from '@/services/facility.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取场地列表
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || undefined;
  const status = searchParams.get('status') || undefined;
  const building = searchParams.get('building') || undefined;

  const result = await roomService.getList({ type, status, building });

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取场地列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  const formattedData = result.data.map((room: any) => ({
    id: room.id,
    name: room.name,
    code: room.code,
    type: room.type,
    building: room.building,
    floor: room.floor,
    location: room.location,
    capacity: room.capacity,
    area: room.area,
    facilities: room.facilities,
    status: room.status,
    managerId: room.manager_id,
    managerName: room.manager_name,
    description: room.description,
    notes: room.notes,
    createdAt: room.created_at,
  }));

  return NextResponse.json(success(formattedData));
}

/**
 * POST - 创建场地
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = await roomService.create({
    name: body.name,
    code: body.code,
    type: body.type,
    building: body.building,
    floor: body.floor,
    location: body.location,
    capacity: body.capacity,
    area: body.area,
    facilities: body.facilities || {},
    status: body.status || 'available',
    manager_id: body.managerId,
    manager_name: body.managerName,
    description: body.description,
    notes: body.notes,
  });

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '创建场地失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
}
