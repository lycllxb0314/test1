/**
 * 手动排课 - 定稿
 * POST: 发布正式课表（将草稿数据同步到 schedule_slots）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

// 类型定义
interface SlotData {
  subject: string;
  teacher_id: string | null;
  teacher_name: string | null;
  week_day: number;
  period_index: number;
}

interface ClassScheduleData {
  classId: string;
  className: string;
  slots: SlotData[];
}

interface SlotInsertData {
  class_id: string;
  class_name: string;
  grade: number;
  subject: string;
  teacher_id: string | null;
  teacher_name: string | null;
  week_day: number;
  period_index: number;
}

// 定稿 - 发布正式课表
export const POST = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { grade, scheduleData, clearDraft = true } = body;
    
    if (!grade || !scheduleData) {
      return NextResponse.json(error('缺少必要参数', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 获取该年级所有班级ID
    const { data: gradeClasses } = await client
      .from('classes')
      .select('id')
      .eq('grade', grade);
    
    const classIds = (gradeClasses || []).map(c => c.id);
    
    // 1. 先删除该年级所有的 schedule_slots
    if (classIds.length > 0) {
      await client
        .from('schedule_slots')
        .delete()
        .in('class_id', classIds);
    }
    
    // 2. 批量插入新的课表记录到 schedule_slots
    const slotsToInsert: SlotInsertData[] = [];
    
    for (const classSchedule of scheduleData as ClassScheduleData[]) {
      const { classId, className, slots } = classSchedule;
      
      for (const slot of slots || []) {
        slotsToInsert.push({
          class_id: classId,
          class_name: className,
          grade,
          subject: slot.subject,
          teacher_id: slot.teacher_id,
          teacher_name: slot.teacher_name,
          week_day: slot.week_day,
          period_index: slot.period_index,
        });
      }
    }
    
    if (slotsToInsert.length > 0) {
      const { error: insertError } = await client
        .from('schedule_slots')
        .insert(slotsToInsert);
      
      if (insertError) {
        console.error('同步课表数据失败:', insertError);
        return NextResponse.json(error('同步课表数据失败', ErrorCode.DATABASE_ERROR), { status: 500 });
      }
    }
    
    // 3. 更新草稿表的发布状态（而不是删除）
    await client
      .from('schedule_drafts')
      .upsert({
        grade,
        schedule_data: scheduleData,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'grade' });
    
    return NextResponse.json(success({
      message: '课表定稿成功',
      slotsCount: slotsToInsert.length,
    }));
    
  } catch (err) {
    console.error('定稿失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

// 获取正式课表状态
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const grade = parseInt(searchParams.get('grade') || '0');
    
    if (!grade) {
      return NextResponse.json(error('缺少年级参数', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 从 schedule_slots 统计正式课表
    const { data: slots, error: dbError } = await client
      .from('schedule_slots')
      .select('id, created_at')
      .eq('grade', grade)
      .limit(1);
    
    if (dbError) {
      console.error('获取正式课表状态失败:', dbError);
      return NextResponse.json(error('获取状态失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 获取该年级课表的总条目数
    const { count } = await client
      .from('schedule_slots')
      .select('*', { count: 'exact', head: true })
      .eq('grade', grade);
    
    return NextResponse.json(success({
      grade,
      hasOfficial: (count || 0) > 0,
      slotsCount: count || 0,
    }));
    
  } catch (err) {
    console.error('获取正式课表状态失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
