/**
 * 手动排课 - 年级课表 API
 * 
 * 架构：API Route → Service → Repository
 * 
 * 返回格式：{ scheduleData: [{ classId, className, slots }] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { manualScheduleService } from '@/services/academic.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取年级课表（按班级分组）
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get('grade');
    
    if (!grade) {
      return NextResponse.json(error('缺少年级参数', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await manualScheduleService.getGradeSchedule(parseInt(grade));
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取年级课表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    // 按班级分组
    const slots = result.data || [];
    const classSlotsMap = new Map<string, {
      classId: string;
      className: string;
      slots: Array<{
        id: string;
        class_id: string;
        subject: string;
        teacher_id: string | null;
        teacher_name: string | null;
        week_day: number;
        period_index: number;
      }>;
    }>();
    
    for (const slot of slots) {
      const slotRecord = slot as unknown as Record<string, unknown>;
      const classId = slotRecord.class_id as string;
      
      if (!classSlotsMap.has(classId)) {
        classSlotsMap.set(classId, {
          classId,
          className: slotRecord.class_name as string || '',
          slots: [],
        });
      }
      
      classSlotsMap.get(classId)!.slots.push({
        id: slotRecord.id as string,
        class_id: classId,
        subject: slotRecord.subject as string,
        teacher_id: slotRecord.teacher_id as string | null,
        teacher_name: slotRecord.teacher_name as string | null,
        week_day: slotRecord.week_day as number,
        period_index: slotRecord.period_index as number,
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        scheduleData: Array.from(classSlotsMap.values()),
        total: slots.length,
      } 
    });
  } catch (err) {
    console.error('获取年级课表失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
