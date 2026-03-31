/**
 * 正式课表 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { scheduleService } from '@/services/academic.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取正式课表数据
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const grade = searchParams.get('grade');
    
    const result = await scheduleService.getOfficialSchedule({
      classId: searchParams.get('classId') || undefined,
      teacherId: searchParams.get('teacherId') || undefined,
      grade: grade ? parseInt(grade) : undefined,
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取正式课表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success(result.data));
  } catch (err) {
    console.error('获取正式课表失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * PUT - 更新正式课表的单个格子
 */
export const PUT = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    
    const { slotId, subject, teacherId, teacherName } = body;
    
    if (!slotId) {
      return NextResponse.json(error('缺少课表格子ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await scheduleService.updateOfficialSlot(slotId, {
      subject,
      teacherId,
      teacherName,
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '更新课表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success(result.data));
  } catch (err) {
    console.error('更新正式课表失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
