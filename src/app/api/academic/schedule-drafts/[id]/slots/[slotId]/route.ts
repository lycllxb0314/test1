/**
 * 更新单个课表格子API
 * 
 * PUT - 更新课表格子（科目、教师）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api-route-utils';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * PUT - 更新单个课表格子
 */
const updateSlot = async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const params = await context.params;
    const draftId = params?.id;  // 统一使用 id 参数名
    const slotId = params?.slotId;
    
    if (!draftId || !slotId) {
      return NextResponse.json(
        error('缺少草稿ID或课表格子ID', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }
    
    const client = getSupabaseClient();
    const body = await request.json();
    
    const { subject, teacherId, teacherName } = body;
    
    // 验证草稿存在且为草稿状态
    const { data: draft, error: draftError } = await client
      .from('schedule_drafts')
      .select('status')
      .eq('id', draftId)
      .single();
    
    if (draftError || !draft) {
      return NextResponse.json(
        error('草稿不存在', ErrorCode.NOT_FOUND),
        { status: 404 }
      );
    }
    
    if (draft.status === 'published') {
      return NextResponse.json(
        error('已发布的草稿不能修改', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }
    
    // 更新课表格子
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    
    if (subject) updateData.subject = subject;
    if (teacherId) updateData.teacher_id = teacherId;
    if (teacherName) updateData.teacher_name = teacherName;
    
    const { data, error: dbError } = await client
      .from('schedule_slots')
      .update(updateData)
      .eq('id', slotId)
      .eq('draft_id', draftId)
      .select()
      .single();
    
    if (dbError) {
      console.error('更新课表格子失败:', dbError);
      return NextResponse.json(
        error('更新课表格子失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }
    
    // 更新草稿的更新时间
    await client
      .from('schedule_drafts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', draftId);
    
    return NextResponse.json(success(data));
  } catch (err) {
    console.error('更新课表格子失败:', err);
    return NextResponse.json(
      error('更新课表格子失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
};

export const PUT = protectedRoute(updateSlot);
