/**
 * 手动排课 - 课表格子操作 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { scheduleService } from '@/services/academic.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取某个班级的课表
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    
    if (!classId) {
      return NextResponse.json(error('缺少班级ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await scheduleService.getClassSchedule(classId);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取课表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success(result.data));
  } catch (err) {
    console.error('获取课表失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * POST - 保存单个课位
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    
    const { classId, className, grade, weekDay, periodIndex, subject, teacherId, teacherName } = body;
    
    if (!classId || !weekDay || periodIndex === undefined || !subject) {
      return NextResponse.json(error('缺少必要参数', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await scheduleService.saveSlot({
      classId,
      className,
      grade,
      weekDay,
      periodIndex,
      subject,
      teacherId,
      teacherName,
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '保存失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success(result.data));
  } catch (err) {
    console.error('保存课位失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * DELETE - 删除单个课位
 */
export const DELETE = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const weekDay = searchParams.get('weekDay');
    const periodIndex = searchParams.get('periodIndex');
    
    if (!classId || !weekDay || !periodIndex) {
      return NextResponse.json(error('缺少必要参数', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await scheduleService.deleteSlot({
      classId,
      weekDay: parseInt(weekDay),
      periodIndex: parseInt(periodIndex),
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '删除失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success(null));
  } catch (err) {
    console.error('删除课位失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
