/**
 * 正式课表API路由
 * 
 * GET - 获取正式课表数据（draft_id 为 null 的数据）
 * PUT - 更新正式课表的单个格子
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api-route-utils';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取正式课表数据
 */
const getOfficialSchedule = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const teacherId = searchParams.get('teacherId');
    const grade = searchParams.get('grade');
    
    // 使用分批查询获取所有数据（Supabase默认限制1000行）
    const allSlots: any[] = [];
    const batchSize = 1000;
    let offset = 0;
    
    while (true) {
      let query = client
        .from('schedule_slots')
        .select('*')
        .is('draft_id', null) // 只获取正式课表
        .range(offset, offset + batchSize - 1);
      
      if (classId) {
        query = query.eq('class_id', classId);
      }
      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }
      if (grade) {
        query = query.eq('grade', parseInt(grade));
      }
      
      const { data: batch, error: dbError } = await query;
      
      if (dbError) {
        return NextResponse.json(
          error('获取正式课表失败', ErrorCode.DATABASE_ERROR),
          { status: 500 }
        );
      }
      
      if (batch && batch.length > 0) {
        allSlots.push(...batch);
      }
      
      if (!batch || batch.length < batchSize) {
        break;
      }
      
      offset += batchSize;
    }
    
    return NextResponse.json(success(allSlots));
  } catch (err) {
    console.error('获取正式课表失败:', err);
    return NextResponse.json(
      error('获取正式课表失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
};

/**
 * PUT - 更新正式课表的单个格子
 */
const updateOfficialSlot = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    const { slotId, subject, teacherId, teacherName } = body;
    
    if (!slotId) {
      return NextResponse.json(
        error('缺少课表格子ID', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }
    
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
      .is('draft_id', null)
      .select()
      .single();
    
    if (dbError) {
      console.error('更新正式课表失败:', dbError);
      return NextResponse.json(
        error('更新正式课表失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }
    
    return NextResponse.json(success(data));
  } catch (err) {
    console.error('更新正式课表失败:', err);
    return NextResponse.json(
      error('更新正式课表失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
};

export const GET = protectedRoute(getOfficialSchedule);
export const PUT = protectedRoute(updateOfficialSlot);
