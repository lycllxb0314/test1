import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 类型定义
interface AccessDeviceNested {
  id: string;
  name: string;
  location: string | null;
}

interface AccessRecordRow {
  id: string;
  person_id: string;
  person_name: string;
  person_type: string;
  person_organization: string | null;
  device_id: string;
  direction: string;
  status: string;
  temperature: number | null;
  occurred_at: string;
  access_devices: AccessDeviceNested | AccessDeviceNested[] | null;
}

/**
 * GET - 获取通行记录
 * 查询参数：
 * - deviceId: 设备ID
 * - personType: 人员类型
 * - direction: 进出方向
 * - date: 日期
 * - startDate: 开始日期
 * - endDate: 结束日期
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const personType = searchParams.get('personType');
    const direction = searchParams.get('direction');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = client
      .from('access_records')
      .select(`
        id,
        person_id,
        person_name,
        person_type,
        person_organization,
        device_id,
        direction,
        status,
        temperature,
        occurred_at,
        access_devices (
          id,
          name,
          location
        )
      `)
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (deviceId) {
      query = query.eq('device_id', deviceId);
    }

    if (personType) {
      query = query.eq('person_type', personType);
    }

    if (direction) {
      query = query.eq('direction', direction);
    }

    if (date) {
      query = query.gte('occurred_at', `${date}T00:00:00`)
                   .lt('occurred_at', `${date}T23:59:59`);
    }

    if (startDate) {
      query = query.gte('occurred_at', startDate);
    }

    if (endDate) {
      query = query.lte('occurred_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const formattedData = (data || []).map((record: AccessRecordRow) => {
      const device = Array.isArray(record.access_devices) 
        ? record.access_devices[0] 
        : record.access_devices;
      return {
        id: record.id,
        personId: record.person_id,
        personName: record.person_name,
        personType: record.person_type,
        organization: record.person_organization,
        deviceId: record.device_id,
        deviceName: device?.name || '',
        deviceLocation: device?.location || '',
        direction: record.direction,
        status: record.status,
        temperature: record.temperature,
        occurredAt: record.occurred_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Failed to fetch access records:', error);
    return NextResponse.json({
      success: false,
      error: '获取通行记录失败',
    }, { status: 500 });
  }
}
