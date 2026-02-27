import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Mock教室数据
const mockRooms = [
  { id: 'room1', name: '一年级1班教室', code: '101', type: 'classroom', building: '教学楼A', floor: 1, location: '教学楼A一楼', capacity: 45, area: 60, facilities: { projector: true, airConditioner: true, computer: true }, status: 'available', managerId: 't001', managerName: '王芳', description: '标准教室', notes: '' },
  { id: 'room2', name: '一年级2班教室', code: '102', type: 'classroom', building: '教学楼A', floor: 1, location: '教学楼A一楼', capacity: 45, area: 60, facilities: { projector: true, airConditioner: true, computer: true }, status: 'available', managerId: 't002', managerName: '张华', description: '标准教室', notes: '' },
  { id: 'room3', name: '科学实验室', code: 'Lab1', type: 'lab', building: '实验楼', floor: 2, location: '实验楼二楼', capacity: 30, area: 80, facilities: { projector: true, airConditioner: true, labEquipment: true }, status: 'available', managerId: 't003', managerName: '李强', description: '科学实验专用教室', notes: '需提前预约' },
  { id: 'room4', name: '多媒体教室', code: 'Media1', type: 'multimedia', building: '综合楼', floor: 3, location: '综合楼三楼', capacity: 100, area: 120, facilities: { projector: true, airConditioner: true, computer: true, soundSystem: true }, status: 'available', managerId: 't004', managerName: '陈丽', description: '大型多媒体教室', notes: '适合公开课、讲座' },
  { id: 'room5', name: '音乐教室', code: 'Music1', type: 'special', building: '艺术楼', floor: 1, location: '艺术楼一楼', capacity: 40, area: 70, facilities: { piano: true, soundSystem: true, airConditioner: true }, status: 'available', managerId: 't005', managerName: '赵敏', description: '音乐专用教室', notes: '' },
];

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
      let filteredData = [...mockRooms];
      if (type) filteredData = filteredData.filter(r => r.type === type);
      if (status) filteredData = filteredData.filter(r => r.status === status);
      if (building) filteredData = filteredData.filter(r => r.building === building);

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
    return NextResponse.json({ success: true, data: mockRooms, source: 'mock' });
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
