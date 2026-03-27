/**
 * 单个排课草稿API路由
 * 
 * GET  - 获取草稿详情
 * PUT  - 更新草稿信息
 * DELETE - 删除草稿
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取草稿详情（包含所有课表数据）
 */
const getDraft = async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const { user } = context;
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(
        error('缺少草稿ID', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }
    
    const client = getSupabaseClient();
    
    // 获取草稿信息
    const { data: draft, error: draftError } = await client
      .from('schedule_drafts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (draftError || !draft) {
      return NextResponse.json(
        error('草稿不存在', ErrorCode.NOT_FOUND),
        { status: 404 }
      );
    }
    
    // 获取草稿的所有课表数据
    // Supabase默认限制1000行，使用分批查询获取所有数据
    const allSlots: any[] = [];
    const batchSize = 1000;
    let offset = 0;
    
    while (true) {
      const { data: batch, error: batchError } = await client
        .from('schedule_slots')
        .select('*')
        .eq('draft_id', id)
        .range(offset, offset + batchSize - 1);
      
      if (batchError) {
        console.error('获取课表数据失败:', batchError);
        return NextResponse.json(
          error('获取课表数据失败', ErrorCode.DATABASE_ERROR),
          { status: 500 }
        );
      }
      
      if (batch && batch.length > 0) {
        allSlots.push(...batch);
      }
      
      // 如果返回的数据少于批次大小，说明已经获取完毕
      if (!batch || batch.length < batchSize) {
        break;
      }
      
      offset += batchSize;
    }
    
    console.log(`[API] 获取草稿课表数据: draft_id=${id}, total=${allSlots.length}`);
    
    return NextResponse.json(success({
      ...draft,
      slots: allSlots,
    }));
  } catch (err) {
    console.error('获取草稿详情失败:', err);
    return NextResponse.json(
      error('获取草稿详情失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
};

/**
 * PUT - 更新草稿信息
 */
const updateDraft = async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(
        error('缺少草稿ID', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }
    
    const client = getSupabaseClient();
    const body = await request.json();
    
    const { name, description } = body;
    
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    
    const { data, error: dbError } = await client
      .from('schedule_drafts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (dbError) {
      console.error('更新草稿失败:', dbError);
      return NextResponse.json(
        error('更新草稿失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }
    
    return NextResponse.json(success(data));
  } catch (err) {
    console.error('更新草稿失败:', err);
    return NextResponse.json(
      error('更新草稿失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
};

/**
 * DELETE - 删除草稿
 */
const deleteDraft = async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(
        error('缺少草稿ID', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }
    
    const client = getSupabaseClient();
    
    // 检查是否为已发布状态
    const { data: draft } = await client
      .from('schedule_drafts')
      .select('status')
      .eq('id', id)
      .single();
    
    if (draft?.status === 'published') {
      return NextResponse.json(
        error('已发布的草稿不能删除', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }
    
    // 删除草稿的所有课表数据
    await client.from('schedule_slots').delete().eq('draft_id', id);
    
    // 删除草稿的历史记录
    await client.from('schedule_draft_history').delete().eq('draft_id', id);
    
    // 删除草稿
    const { error: dbError } = await client
      .from('schedule_drafts')
      .delete()
      .eq('id', id);
    
    if (dbError) {
      console.error('删除草稿失败:', dbError);
      return NextResponse.json(
        error('删除草稿失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }
    
    return NextResponse.json(success({ message: '删除成功' }));
  } catch (err) {
    console.error('删除草稿失败:', err);
    return NextResponse.json(
      error('删除草稿失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
};

export const GET = protectedRoute(getDraft);
export const PUT = protectedRoute(updateDraft);
export const DELETE = protectedRoute(deleteDraft);
