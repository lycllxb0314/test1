/**
 * 教室统计 API
 * 
 * GET - 获取教室使用统计数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取教室统计数据
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    
    const today = new Date().toISOString().split('T')[0];
    
    if (type === 'overview') {
      // 获取教室统计
      const { data: rooms, error: roomsError } = await client
        .from('rooms')
        .select('status');
      
      if (roomsError) {
        console.error('获取教室统计失败:', roomsError);
        return NextResponse.json(
          { success: false, error: '获取统计数据失败' },
          { status: 500 }
        );
      }
      
      // 获取今日预约
      const { data: todayBookings, error: bookingsError } = await client
        .from('room_bookings')
        .select('id')
        .eq('booking_date', today)
        .in('status', ['pending', 'approved', 'in_progress']);
      
      if (bookingsError) {
        console.error('获取预约统计失败:', bookingsError);
      }
      
      // 获取待审批数量
      const { data: pendingBookings, error: pendingError } = await client
        .from('room_bookings')
        .select('id')
        .eq('status', 'pending');
      
      if (pendingError) {
        console.error('获取待审批统计失败:', pendingError);
      }
      
      // 计算各状态数量
      const roomStats = {
        total: rooms?.length || 0,
        available: rooms?.filter(r => r.status === 'available').length || 0,
        in_use: rooms?.filter(r => r.status === 'in_use').length || 0,
        reserved: rooms?.filter(r => r.status === 'reserved').length || 0,
        maintenance: rooms?.filter(r => r.status === 'maintenance').length || 0,
        locked: rooms?.filter(r => r.status === 'locked').length || 0,
      };
      
      const bookingStats = {
        today: todayBookings?.length || 0,
        pending: pendingBookings?.length || 0,
      };
      
      return NextResponse.json({
        success: true,
        data: {
          rooms: roomStats,
          bookings: bookingStats,
        },
      });
    }
    
    if (type === 'buildings') {
      // 获取各楼栋教室统计
      const { data: rooms, error } = await client
        .from('rooms')
        .select('building, status');
      
      if (error) {
        return NextResponse.json(
          { success: false, error: '获取楼栋统计失败' },
          { status: 500 }
        );
      }
      
      const buildingStats: Record<string, Record<string, number>> = {};
      rooms?.forEach(room => {
        if (!buildingStats[room.building]) {
          buildingStats[room.building] = {
            total: 0,
            available: 0,
            in_use: 0,
            reserved: 0,
            maintenance: 0,
          };
        }
        buildingStats[room.building].total++;
        if (room.status === 'available') buildingStats[room.building].available++;
        else if (room.status === 'in_use') buildingStats[room.building].in_use++;
        else if (room.status === 'reserved') buildingStats[room.building].reserved++;
        else if (room.status === 'maintenance') buildingStats[room.building].maintenance++;
      });
      
      return NextResponse.json({ success: true, data: buildingStats });
    }
    
    if (type === 'usage') {
      // 获取使用率统计（本月）
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const startDate = startOfMonth.toISOString().split('T')[0];
      
      const { data: bookings, error } = await client
        .from('room_bookings')
        .select('room_id, room_name, duration, status')
        .gte('booking_date', startDate)
        .eq('status', 'completed');
      
      if (error) {
        return NextResponse.json(
          { success: false, error: '获取使用率统计失败' },
          { status: 500 }
        );
      }
      
      const usageStats: Record<string, Record<string, unknown>> = {};
      bookings?.forEach(booking => {
        if (!usageStats[booking.room_id]) {
          usageStats[booking.room_id] = {
            room_id: booking.room_id,
            room_name: booking.room_name,
            total_duration: 0,
            count: 0,
          };
        }
        usageStats[booking.room_id].total_duration = 
          (usageStats[booking.room_id].total_duration as number) + (booking.duration || 0);
        usageStats[booking.room_id].count = 
          (usageStats[booking.room_id].count as number) + 1;
      });
      
      return NextResponse.json({ success: true, data: Object.values(usageStats) });
    }
    
    return NextResponse.json(
      { success: false, error: '未知的统计类型' },
      { status: 400 }
    );
  } catch (err) {
    console.error('获取统计数据失败:', err);
    return NextResponse.json(
      { success: false, error: '获取统计数据失败' },
      { status: 500 }
    );
  }
}
