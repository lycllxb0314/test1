import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getMockRooms } from '@/lib/mock/general.mock';

/**
 * GET - 获取教室列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const building = searchParams.get('building');

    const client = getSupabaseClient();
    
    let query = client
      .from('rooms')
      .select('*')
      .order('name');

    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);
    if (building) query = query.eq('building', building);

    const { data, error } = await query;

    if (error) {
      // 数据库失败，使用Mock数据
      const filteredData = getMockRooms({
        type: type || undefined,
        status: status || undefined,
        building: building || undefined,
      });

      return NextResponse.json({ success: true, data: filteredData, source: 'mock' });
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

    return NextResponse.json({ success: true, data: formattedData, source: 'database' });
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
    return NextResponse.json({ success: true, data: getMockRooms(), source: 'mock' });
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

    const { data, error } = await client
      .from('rooms')
      .insert({
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

    if (error) {
      return NextResponse.json({
        success: true,
        data: { id: `room-${Date.now()}`, ...body, status: 'available' },
        source: 'mock',
      });
    }

    return NextResponse.json({ success: true, data, source: 'database' });
  } catch (error) {
    console.error('Failed to create room:', error);
    return NextResponse.json({ success: false, error: '创建教室失败' }, { status: 500 });
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

    const { data, error } = await client
      .from('rooms')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: true,
        data: { id, ...updates },
        source: 'mock',
      });
    }

    return NextResponse.json({ success: true, data, source: 'database' });
  } catch (error) {
    console.error('Failed to update room:', error);
    return NextResponse.json({ success: false, error: '更新教室信息失败' }, { status: 500 });
  }
}
