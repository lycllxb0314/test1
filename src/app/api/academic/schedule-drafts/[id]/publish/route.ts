/**
 * 发布草稿API
 * 
 * POST - 发布草稿，将草稿数据保存到正式课表
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * POST - 发布草稿
 * 
 * 发布时需要：
 * 1. 将草稿的课表数据复制到正式课表（draft_id = null）
 * 2. 更新草稿状态为 published
 * 3. 清除旧的正式课表数据
 */
const publishDraft = async (
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
    
    // 1. 验证草稿存在且为草稿状态
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
    
    if (draft.status === 'published') {
      return NextResponse.json(
        error('草稿已发布', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }
    
    // 2. 获取草稿的所有课表数据
    const { data: slots, error: slotsError } = await client
      .from('schedule_slots')
      .select('*')
      .eq('draft_id', id);
    
    if (slotsError) {
      console.error('获取课表数据失败:', slotsError);
      return NextResponse.json(
        error('获取课表数据失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }
    
    console.log(`发布草稿 ${id}，共 ${slots?.length || 0} 条课表记录`);
    
    // 3. 清除旧的正式课表数据（draft_id 为 null 的数据）
    const { error: deleteError } = await client
      .from('schedule_slots')
      .delete()
      .is('draft_id', null);
    
    if (deleteError) {
      console.error('清除旧正式课表失败:', deleteError);
      return NextResponse.json(
        error('清除旧正式课表失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }
    
    // 4. 将草稿数据复制到正式课表（draft_id = null）
    if (slots && slots.length > 0) {
      const officialSlots = slots.map(slot => ({
        class_id: slot.class_id,
        class_name: slot.class_name,
        grade: slot.grade,
        week_day: slot.week_day,
        period_index: slot.period_index,
        period_name: slot.period_name,
        subject: slot.subject,
        teacher_id: slot.teacher_id,
        teacher_name: slot.teacher_name,
        status: 'active',
        // draft_id 为 null 表示正式课表
      }));
      
      const { error: insertError } = await client
        .from('schedule_slots')
        .insert(officialSlots);
      
      if (insertError) {
        console.error('保存正式课表失败:', insertError);
        return NextResponse.json(
          error('保存正式课表失败', ErrorCode.DATABASE_ERROR),
          { status: 500 }
        );
      }
    }
    
    // 5. 更新草稿状态为已发布
    const { error: publishError } = await client
      .from('schedule_drafts')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        published_by: user.name || user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (publishError) {
      console.error('更新草稿状态失败:', publishError);
      return NextResponse.json(
        error('发布失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }
    
    // 6. 记录发布历史
    await client.from('schedule_draft_history').insert({
      draft_id: id,
      action: 'publish',
      operator: user.name || user.id,
      details: {
        slotCount: slots?.length || 0,
      },
    });
    
    return NextResponse.json(success({
      message: '发布成功，正式课表已更新',
      slotCount: slots?.length || 0,
    }));
  } catch (err) {
    console.error('发布草稿失败:', err);
    return NextResponse.json(
      error('发布草稿失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
};

export const POST = protectedRoute(publishDraft);
