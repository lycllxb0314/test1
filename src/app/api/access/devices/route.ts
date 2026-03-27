import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 类型定义
interface AccessDeviceRow {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  location: string | null;
  ip_address: string | null;
  last_online_at: string | null;
  created_at: string;
}

interface DeviceUpdateData {
  status?: string;
  last_online_at?: string;
  name?: string;
  location?: string;
  ip_address?: string;
}

/**
 * GET - 获取门禁设备列表
 * 查询参数：
 * - status: 设备状态
 * - type: 设备类型
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    let query = client
      .from('access_devices')
      .select('*')
      .order('name');

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 获取每个设备的今日通行次数
    const today = new Date().toISOString().split('T')[0];
    const formattedData = await Promise.all((data || []).map(async (device: AccessDeviceRow) => {
      const { count: todayCount } = await client
        .from('access_records')
        .select('id', { count: 'exact', head: true })
        .eq('device_id', device.id)
        .gte('occurred_at', `${today}T00:00:00`)
        .lt('occurred_at', `${today}T23:59:59`);

      return {
        id: device.id,
        name: device.name,
        code: device.code,
        type: device.type,
        status: device.status,
        location: device.location,
        ipAddress: device.ip_address,
        lastOnlineAt: device.last_online_at,
        todayCount: todayCount || 0,
        createdAt: device.created_at,
      };
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Failed to fetch access devices:', error);
    return NextResponse.json({
      success: false,
      error: '获取门禁设备列表失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建门禁设备
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { name, code, type, location, ipAddress } = body;

    const { data, error } = await client
      .from('access_devices')
      .insert({
        name,
        code,
        type,
        location,
        ip_address: ipAddress,
        status: 'offline',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to create access device:', error);
    return NextResponse.json({
      success: false,
      error: '创建门禁设备失败',
    }, { status: 500 });
  }
}

/**
 * PUT - 更新门禁设备状态
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { id, status, name, location, ipAddress } = body;

    const updateData: DeviceUpdateData = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'online') {
        updateData.last_online_at = new Date().toISOString();
      }
    }
    if (name !== undefined) updateData.name = name;
    if (location !== undefined) updateData.location = location;
    if (ipAddress !== undefined) updateData.ip_address = ipAddress;

    const { data, error } = await client
      .from('access_devices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to update access device:', error);
    return NextResponse.json({
      success: false,
      error: '更新门禁设备失败',
    }, { status: 500 });
  }
}
