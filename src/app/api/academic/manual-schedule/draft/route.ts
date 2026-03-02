/**
 * 手动排课 - 草稿管理
 * POST: 保存草稿
 * GET: 获取草稿状态
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api-route-utils';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

// 保存草稿
export const POST = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { grade, scheduleData } = body;
    
    if (!grade || !scheduleData) {
      return NextResponse.json(error('缺少必要参数', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 使用 upsert 保存或更新草稿
    const { data, error: dbError } = await client
      .from('schedule_drafts')
      .upsert({
        grade,
        schedule_data: scheduleData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'grade',
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('保存草稿失败:', dbError);
      return NextResponse.json(error('保存草稿失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success({
      message: '草稿保存成功',
      draft: data,
    }));
    
  } catch (err) {
    console.error('保存草稿失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

// 获取草稿
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const grade = parseInt(searchParams.get('grade') || '0');
    
    if (!grade) {
      return NextResponse.json(error('缺少年级参数', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const { data, error: dbError } = await client
      .from('schedule_drafts')
      .select('*')
      .eq('grade', grade)
      .single();
    
    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 = 未找到记录
      console.error('获取草稿失败:', dbError);
      return NextResponse.json(error('获取草稿失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success({
      draft: data || null,
      hasDraft: !!data,
    }));
    
  } catch (err) {
    console.error('获取草稿失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
