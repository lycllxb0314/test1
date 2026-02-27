import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取门禁统计数据
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // 获取今日通行总数
    const { count: todayTotal } = await client
      .from('access_records')
      .select('id', { count: 'exact', head: true })
      .gte('occurred_at', `${date}T00:00:00`)
      .lt('occurred_at', `${date}T23:59:59`);

    // 获取今日进入人数
    const { count: todayIn } = await client
      .from('access_records')
      .select('id', { count: 'exact', head: true })
      .gte('occurred_at', `${date}T00:00:00`)
      .lt('occurred_at', `${date}T23:59:59`)
      .eq('direction', 'in');

    // 获取今日外出人数
    const { count: todayOut } = await client
      .from('access_records')
      .select('id', { count: 'exact', head: true })
      .gte('occurred_at', `${date}T00:00:00`)
      .lt('occurred_at', `${date}T23:59:59`)
      .eq('direction', 'out');

    // 按人员类型统计
    const { data: typeStats } = await client
      .from('access_records')
      .select('person_type')
      .gte('occurred_at', `${date}T00:00:00`)
      .lt('occurred_at', `${date}T23:59:59`);

    const byPersonType = [
      { type: 'student', count: typeStats?.filter(r => r.person_type === 'student').length || 0 },
      { type: 'teacher', count: typeStats?.filter(r => r.person_type === 'teacher').length || 0 },
      { type: 'staff', count: typeStats?.filter(r => r.person_type === 'staff').length || 0 },
      { type: 'visitor', count: typeStats?.filter(r => r.person_type === 'visitor').length || 0 },
    ];

    // 获取异常记录数
    const { count: abnormalCount } = await client
      .from('access_records')
      .select('id', { count: 'exact', head: true })
      .gte('occurred_at', `${date}T00:00:00`)
      .lt('occurred_at', `${date}T23:59:59`)
      .eq('status', 'denied');

    // 获取访客数量
    const { count: visitorCount } = await client
      .from('access_records')
      .select('id', { count: 'exact', head: true })
      .gte('occurred_at', `${date}T00:00:00`)
      .lt('occurred_at', `${date}T23:59:59`)
      .eq('person_type', 'visitor');

    // 获取待审批访客数
    const { count: pendingVisitorCount } = await client
      .from('visitors')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    // 获取设备状态
    const { count: deviceOnlineCount } = await client
      .from('access_devices')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'online');

    const { count: deviceOfflineCount } = await client
      .from('access_devices')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'offline');

    const { count: deviceFaultCount } = await client
      .from('access_devices')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'fault');

    const result = {
      date,
      todayTotal: todayTotal || 0,
      todayIn: todayIn || 0,
      todayOut: todayOut || 0,
      byPersonType,
      abnormalCount: abnormalCount || 0,
      visitorCount: visitorCount || 0,
      pendingVisitorCount: pendingVisitorCount || 0,
      deviceOnlineCount: deviceOnlineCount || 0,
      deviceOfflineCount: deviceOfflineCount || 0,
      deviceFaultCount: deviceFaultCount || 0,
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Failed to fetch access statistics:', error);
    return NextResponse.json({
      success: false,
      error: '获取门禁统计数据失败',
    }, { status: 500 });
  }
}
