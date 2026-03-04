/**
 * 草稿课表格子批量操作API
 * 
 * POST - 创建新课表格子（为空槽添加课程）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api-route-utils';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * POST - 创建新课表格子
 */
const createSlot = async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const params = await context.params;
    const draftId = params?.id;
    
    if (!draftId) {
      return NextResponse.json(
        error('缺少草稿ID', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }
    
    const client = getSupabaseClient();
    const body = await request.json();
    
    const { classId, className, grade, weekDay, periodIndex, periodName, subject, teacherId, teacherName } = body;
    
    if (!classId || !subject || !teacherId) {
      return NextResponse.json(
        error('缺少必要参数', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }
    
    // 获取教师的 employee_id
    let employeeId = null;
    const { data: teacherData } = await client
      .from('teachers')
      .select('employee_id')
      .eq('id', teacherId)
      .single();
    employeeId = teacherData?.employee_id || null;
    
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
    
    // 检查该时段是否已有课程
    const { data: existingSlot } = await client
      .from('schedule_slots')
      .select('id')
      .eq('draft_id', draftId)
      .eq('class_id', classId)
      .eq('week_day', weekDay)
      .eq('period_index', periodIndex)
      .single();
    
    if (existingSlot) {
      return NextResponse.json(
        error('该时段已有课程', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }
    
    // 创建新课表格子
    const { data, error: dbError } = await client
      .from('schedule_slots')
      .insert({
        class_id: classId,
        class_name: className,
        grade,
        week_day: weekDay,
        period_index: periodIndex,
        period_name: periodName,
        subject,
        teacher_id: teacherId,
        teacher_name: teacherName,
        employee_id: employeeId,
        draft_id: draftId,
        status: 'active',
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('创建课表格子失败:', dbError);
      return NextResponse.json(
        error('创建课表格子失败', ErrorCode.DATABASE_ERROR),
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
    console.error('创建课表格子失败:', err);
    return NextResponse.json(
      error('创建课表格子失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
};

export const POST = protectedRoute(createSlot);
