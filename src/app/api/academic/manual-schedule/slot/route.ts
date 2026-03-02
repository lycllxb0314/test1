/**
 * 手动排课 - 保存/更新/删除单个课位
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api-route-utils';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

// GET - 获取某个班级的课表
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    
    if (!classId) {
      return NextResponse.json(error('缺少班级ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const { data: slots, error: dbError } = await client
      .from('schedule_slots')
      .select('*')
      .eq('class_id', classId);
    
    if (dbError) {
      return NextResponse.json(error('获取课表失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 转换为二维数组格式 [weekday][period]
    const schedule: any[][] = [[], [], [], [], []];
    
    for (const slot of slots || []) {
      const dayIndex = slot.week_day - 1;
      if (dayIndex >= 0 && dayIndex < 5) {
        // 扩展数组
        while (schedule[dayIndex].length <= slot.period_index) {
          schedule[dayIndex].push(null);
        }
        schedule[dayIndex][slot.period_index] = slot;
      }
    }
    
    return NextResponse.json(success({ schedule, slots }));
    
  } catch (err) {
    console.error('获取课表失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

// POST - 保存单个课位
export const POST = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    const { classId, className, grade, weekDay, periodIndex, subject, teacherId, teacherName } = body;
    
    if (!classId || !weekDay || periodIndex === undefined || !subject) {
      return NextResponse.json(error('缺少必要参数', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 检查该位置是否已有课程
    const { data: existing } = await client
      .from('schedule_slots')
      .select('id')
      .eq('class_id', classId)
      .eq('week_day', weekDay)
      .eq('period_index', periodIndex)
      .single();
    
    if (existing) {
      // 更新
      const { error: updateError } = await client
        .from('schedule_slots')
        .update({
          subject,
          teacher_id: teacherId || null,
          teacher_name: teacherName || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      
      if (updateError) {
        return NextResponse.json(error('更新失败', ErrorCode.DATABASE_ERROR), { status: 500 });
      }
    } else {
      // 新增
      const { error: insertError } = await client
        .from('schedule_slots')
        .insert({
          class_id: classId,
          class_name: className,
          grade,
          week_day: weekDay,
          period_index: periodIndex,
          subject,
          teacher_id: teacherId || null,
          teacher_name: teacherName || null,
        });
      
      if (insertError) {
        return NextResponse.json(error('保存失败', ErrorCode.DATABASE_ERROR), { status: 500 });
      }
    }
    
    // 返回更新后的教师课时
    let teacherInfo = null;
    if (teacherId) {
      const { data: teacher } = await client
        .from('teachers')
        .select('id, name, primary_subject, total_weekly_hours')
        .eq('id', teacherId)
        .single();
      
      if (teacher) {
        // 获取该教师已安排的课时
        const { count } = await client
          .from('schedule_slots')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', teacherId);
        
        teacherInfo = {
          id: teacher.id,
          name: teacher.name,
          usedHours: count || 0,
        };
      }
    }
    
    return NextResponse.json(success({ teacherInfo }));
    
  } catch (err) {
    console.error('保存课位失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

// DELETE - 删除单个课位
export const DELETE = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const weekDay = searchParams.get('weekDay');
    const periodIndex = searchParams.get('periodIndex');
    
    if (!classId || !weekDay || !periodIndex) {
      return NextResponse.json(error('缺少必要参数', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const { error: deleteError } = await client
      .from('schedule_slots')
      .delete()
      .eq('class_id', classId)
      .eq('week_day', parseInt(weekDay))
      .eq('period_index', parseInt(periodIndex));
    
    if (deleteError) {
      return NextResponse.json(error('删除失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success(null));
    
  } catch (err) {
    console.error('删除课位失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
