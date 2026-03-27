/**
 * 手动排课 - 获取年级下所有班级的课表
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const grade = parseInt(searchParams.get('grade') || '1');
    
    // 获取该年级所有班级ID
    const { data: classes, error: classesError } = await client
      .from('classes')
      .select('id')
      .eq('grade', grade);
    
    if (classesError) {
      return NextResponse.json(error('获取班级失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    const classIds = classes?.map(c => c.id) || [];
    
    // 获取所有班级的课表
    const { data: slots, error: slotsError } = await client
      .from('schedule_slots')
      .select('*')
      .in('class_id', classIds);
    
    if (slotsError) {
      return NextResponse.json(error('获取课表失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 按班级分组
    const slotsByClass = new Map<string, any[]>();
    for (const slot of slots || []) {
      if (!slotsByClass.has(slot.class_id)) {
        slotsByClass.set(slot.class_id, []);
      }
      slotsByClass.get(slot.class_id)!.push(slot);
    }
    
    // 构建结果
    const result = classIds.map(classId => {
      const classSlots = slotsByClass.get(classId) || [];
      return {
        classId,
        slots: classSlots,
      };
    });
    
    return NextResponse.json(success({ 
      scheduleData: result, 
      grade,
      totalSlots: slots?.length || 0 
    }));
    
  } catch (err) {
    console.error('获取年级课表失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
