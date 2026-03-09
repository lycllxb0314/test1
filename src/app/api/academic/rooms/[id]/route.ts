/**
 * 单个教室 API
 * 
 * GET - 获取教室详情
 * PUT - 更新教室信息
 * DELETE - 删除教室
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取教室详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    
    const { data, error: dbError } = await client
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single();
    
    if (dbError) {
      return NextResponse.json(
        { success: false, error: '教室不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('获取教室详情失败:', err);
    return NextResponse.json(
      { success: false, error: '获取教室详情失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT - 更新教室信息
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    // 可更新字段（转换为snake_case）
    const fieldMapping: Record<string, string> = {
      name: 'name',
      code: 'code',
      type: 'type',
      building: 'building',
      floor: 'floor',
      location: 'location',
      capacity: 'capacity',
      area: 'area',
      facilities: 'facilities',
      extraFacilities: 'extra_facilities',
      status: 'status',
      managerId: 'manager_id',
      managerName: 'manager_name',
      departmentId: 'department_id',
      remark: 'remark',
      images: 'images',
    };
    
    Object.entries(fieldMapping).forEach(([field, dbField]) => {
      if (body[field] !== undefined) {
        updateData[dbField] = body[field];
      }
    });
    
    const { data, error: dbError } = await client
      .from('rooms')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (dbError) {
      console.error('更新教室失败:', dbError);
      return NextResponse.json(
        { success: false, error: '更新教室失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('更新教室失败:', err);
    return NextResponse.json(
      { success: false, error: '更新教室失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - 删除教室
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    
    // 检查是否有进行中的预约
    const { data: activeBookings } = await client
      .from('room_bookings')
      .select('id')
      .eq('room_id', id)
      .in('status', ['pending', 'approved', 'in_progress'])
      .limit(1);
    
    if (activeBookings && activeBookings.length > 0) {
      return NextResponse.json(
        { success: false, error: '该教室存在进行中的预约，无法删除' },
        { status: 400 }
      );
    }
    
    const { error: dbError } = await client
      .from('rooms')
      .delete()
      .eq('id', id);
    
    if (dbError) {
      console.error('删除教室失败:', dbError);
      return NextResponse.json(
        { success: false, error: '删除教室失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: { id } });
  } catch (err) {
    console.error('删除教室失败:', err);
    return NextResponse.json(
      { success: false, error: '删除教室失败' },
      { status: 500 }
    );
  }
}
