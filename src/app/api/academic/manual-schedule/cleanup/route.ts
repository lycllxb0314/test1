/**
 * 手动排课 - 清理重复数据
 * 删除同一位置的多余记录，只保留最新的一条
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api-route-utils';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

export const POST = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    
    // 获取所有记录
    const { data: allSlots, error: queryError } = await client
      .from('schedule_slots')
      .select('id, class_id, week_day, period_index, created_at')
      .order('created_at', { ascending: false });
    
    if (queryError) {
      return NextResponse.json(error('查询失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 找出重复记录
    const seen = new Map<string, string>(); // key: "class_id-week_day-period_index", value: kept_id
    const duplicates: string[] = [];
    
    for (const slot of allSlots || []) {
      const key = `${slot.class_id}-${slot.week_day}-${slot.period_index}`;
      if (seen.has(key)) {
        // 这是重复记录，标记删除
        duplicates.push(slot.id);
      } else {
        seen.set(key, slot.id);
      }
    }
    
    if (duplicates.length === 0) {
      return NextResponse.json(success({ 
        message: '没有发现重复数据',
        deletedCount: 0 
      }));
    }
    
    // 删除重复记录
    const { error: deleteError } = await client
      .from('schedule_slots')
      .delete()
      .in('id', duplicates);
    
    if (deleteError) {
      console.error('删除失败:', deleteError);
      return NextResponse.json(error('删除失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success({ 
      message: `已清理 ${duplicates.length} 条重复记录`,
      deletedCount: duplicates.length,
      remainingCount: seen.size
    }));
    
  } catch (err) {
    console.error('清理失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
