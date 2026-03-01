/**
 * 教室/场地管理 API
 * 
 * 数据源：Supabase 数据库（唯一数据源）
 * v3.0: 移除Mock fallback，数据库失败时返回错误响应
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { 
  success, 
  error, 
  parseQueryParams,
  ErrorCode 
} from '@/lib/api-route-utils';

/**
 * GET - 获取教室列表
 */
export async function GET(request: NextRequest) {
  const params = parseQueryParams(request);
  
  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('rooms')
      .select('*')
      .order('name');

    if (params.type) query = query.eq('type', params.type);
    if (params.status) query = query.eq('status', params.status);
    if (params.building) query = query.eq('building', params.building);

    const { data, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json(
        error('数据库查询失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    const formattedData = (data || []).map((room: Record<string, unknown>) => ({
      id: room.id,
      name: room.name,
      code: room.code,
      type: room.type,
      building: room.building,
      floor: room.floor,
      location: room.location,
      capacity: room.capacity,
      area: room.area,
      facilities: room.facilities || {},
      status: room.status,
      managerId: room.manager_id,
      managerName: room.manager_name,
      description: room.description,
      notes: room.notes,
    }));

    return NextResponse.json(success(formattedData));
  } catch (err) {
    console.error('Failed to fetch rooms:', err);
    return NextResponse.json(
      error('获取教室列表失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * POST - 创建教室
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { name, code, type, building, floor, location, capacity, area, facilities, managerId, managerName, description, notes } = body;

    if (!name || !type) {
      return NextResponse.json(
        error('缺少必要参数', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    const { data, error: dbError } = await client
      .from('rooms')
      .insert({
        id: `room-${Date.now()}`,
        name,
        code,
        type,
        building,
        floor,
        location,
        capacity,
        area,
        facilities: facilities || {},
        status: 'available',
        manager_id: managerId,
        manager_name: managerName,
        description,
        notes,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        error('创建教室失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success({
      id: data.id,
      name: data.name,
      type: data.type,
      status: data.status,
    }));
  } catch (err) {
    console.error('Failed to create room:', err);
    return NextResponse.json(
      error('创建教室失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * PUT - 更新教室信息
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        error('缺少教室ID', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.code !== undefined) updateData.code = updates.code;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.building !== undefined) updateData.building = updates.building;
    if (updates.floor !== undefined) updateData.floor = updates.floor;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.capacity !== undefined) updateData.capacity = updates.capacity;
    if (updates.area !== undefined) updateData.area = updates.area;
    if (updates.facilities !== undefined) updateData.facilities = updates.facilities;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.managerId !== undefined) updateData.manager_id = updates.managerId;
    if (updates.managerName !== undefined) updateData.manager_name = updates.managerName;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error: dbError } = await client
      .from('rooms')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        error('更新教室失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(data));
  } catch (err) {
    console.error('Failed to update room:', err);
    return NextResponse.json(
      error('更新教室信息失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
