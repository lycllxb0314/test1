/**
 * 教室管理 API
 * 
 * GET - 获取教室列表
 * POST - 创建新教室
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取教室列表
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const building = searchParams.get('building');
    const search = searchParams.get('search');
    
    let query = client
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false });
    
    // 筛选条件
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (building && building !== 'all') {
      query = query.eq('building', building);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,location.ilike.%${search}%`);
    }
    
    const { data, error: dbError } = await query;
    
    if (dbError) {
      console.error('获取教室列表失败:', dbError);
      return NextResponse.json(
        { success: false, error: '获取教室列表失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('获取教室列表失败:', err);
    return NextResponse.json(
      { success: false, error: '获取教室列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST - 创建新教室
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    const {
      id,
      name,
      code,
      type,
      building,
      floor,
      location,
      capacity,
      area,
      facilities,
      extraFacilities,
      status,
      managerId,
      managerName,
      departmentId,
      remark,
    } = body;
    
    // 验证必填字段
    if (!name || !code || !type || !building) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      );
    }
    
    const roomId = id || `room-${Date.now()}`;
    
    const { data, error: dbError } = await client
      .from('rooms')
      .insert({
        id: roomId,
        name,
        code,
        type,
        building,
        floor,
        location,
        capacity: capacity || 30,
        area,
        facilities: facilities || {
          projector: false,
          computer: false,
          microphone: false,
          speaker: false,
          whiteboard: false,
          blackboard: false,
          airConditioner: false,
          wifi: false,
          videoConference: false,
          recording: false,
        },
        extra_facilities: extraFacilities,
        status: status || 'available',
        manager_id: managerId,
        manager_name: managerName,
        department_id: departmentId,
        remark,
        usage_stats: {
          totalBookings: 0,
          thisMonth: 0,
        },
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('创建教室失败:', dbError);
      return NextResponse.json(
        { success: false, error: '创建教室失败: ' + dbError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('创建教室失败:', err);
    return NextResponse.json(
      { success: false, error: '创建教室失败' },
      { status: 500 }
    );
  }
}
