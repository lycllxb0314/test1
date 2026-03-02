/**
 * 手动排课 - 状态查询
 * 获取草稿和正式课表的状态
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api-route-utils';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const grade = parseInt(searchParams.get('grade') || '0');
    
    if (!grade) {
      return NextResponse.json(error('缺少年级参数', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 并行查询草稿状态和正式课表状态
    const [draftResult, officialResult] = await Promise.all([
      client
        .from('schedule_drafts')
        .select('updated_at, schedule_data')
        .eq('grade', grade)
        .single(),
      client
        .from('schedule_slots')
        .select('id', { count: 'exact', head: true })
        .eq('grade', grade),
    ]);
    
    const draft = draftResult.data;
    
    return NextResponse.json(success({
      grade,
      // 草稿状态
      hasDraft: !!draft,
      draftUpdatedAt: draft?.updated_at || null,
      draftSlotsCount: draft?.schedule_data 
        ? (draft.schedule_data as any[]).reduce((acc: number, c: any) => acc + (c.slots?.length || 0), 0) 
        : 0,
      // 正式课表状态（schedule_slots）
      hasOfficial: (officialResult.count || 0) > 0,
      officialSlotsCount: officialResult.count || 0,
    }));
    
  } catch (err) {
    console.error('获取状态失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
