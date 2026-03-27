/**
 * 排课草稿API路由
 * 
 * GET  - 获取草稿列表
 * POST - 保存新草稿
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

// 类型定义
interface SlotInput {
  id?: string;
  classId: string;
  className: string;
  grade: number;
  weekDay?: number;
  week_day?: number;
  periodIndex?: number;
  period_index?: number;
  periodName?: string;
  period_name?: string;
  subject: string;
  teacherId?: string;
  teacher_id?: string;
  teacherName?: string;
  teacher_name?: string;
}

interface SlotInsertData {
  id?: string;
  class_id: string;
  class_name: string;
  grade: number;
  week_day: number;
  period_index: number;
  period_name: string | undefined;
  subject: string;
  teacher_id: string | undefined;
  teacher_name: string | undefined;
  draft_id: string;
  status: string;
}

/**
 * GET - 获取草稿列表
 */
const getDrafts = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // draft, published, all
    
    let query = client
      .from('schedule_drafts')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    const { data, error: dbError } = await query;
    
    if (dbError) {
      return NextResponse.json(
        error('获取草稿列表失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }
    
    return NextResponse.json(success(data || []));
  } catch (err) {
    console.error('获取草稿列表失败:', err);
    return NextResponse.json(
      error('获取草稿列表失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
};

/**
 * POST - 保存新草稿
 */
const saveDraft = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    const { name, description, slots, semester } = body;
    
    if (!name) {
      return NextResponse.json(
        error('草稿名称不能为空', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }
    
    // 创建草稿记录
    const { data: draft, error: draftError } = await client
      .from('schedule_drafts')
      .insert({
        name,
        description: description || '',
        semester: semester || '2024-2025-2',
        status: 'draft',
        created_by: user.name || user.id,
      })
      .select()
      .single();
    
    if (draftError || !draft) {
      console.error('创建草稿失败:', draftError);
      return NextResponse.json(
        error('创建草稿失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }
    
    // 保存课表数据
    if (slots && slots.length > 0) {
      const slotsData: SlotInsertData[] = slots.map((slot: SlotInput) => {
        const data: SlotInsertData = {
          class_id: slot.classId,
          class_name: slot.className,
          grade: slot.grade,
          week_day: slot.weekDay || slot.week_day || 0,
          period_index: slot.periodIndex || slot.period_index || 0,
          period_name: slot.periodName || slot.period_name,
          subject: slot.subject,
          teacher_id: slot.teacherId || slot.teacher_id,
          teacher_name: slot.teacherName || slot.teacher_name,
          draft_id: draft.id,
          status: 'active',
        };
        // 只有当 id 存在且有效时才传入，否则让数据库自动生成
        if (slot.id && typeof slot.id === 'string' && slot.id.trim() !== '') {
          data.id = slot.id;
        }
        return data;
      });
      
      const { error: slotsError } = await client
        .from('schedule_slots')
        .insert(slotsData);
      
      if (slotsError) {
        console.error('保存课表数据失败:', slotsError);
        // 回滚草稿
        await client.from('schedule_drafts').delete().eq('id', draft.id);
        return NextResponse.json(
          error('保存课表数据失败', ErrorCode.DATABASE_ERROR),
          { status: 500 }
        );
      }
    }
    
    // 记录历史
    await client.from('schedule_draft_history').insert({
      draft_id: draft.id,
      action: 'create',
      operator: user.name || user.id,
      details: { name, slotCount: slots?.length || 0 },
    });
    
    return NextResponse.json(success(draft));
  } catch (err) {
    console.error('保存草稿失败:', err);
    return NextResponse.json(
      error('保存草稿失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
};

export const GET = protectedRoute(getDrafts);
export const POST = protectedRoute(saveDraft);
