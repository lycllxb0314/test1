/**
 * 值日教师 API
 * 
 * GET: 查询值日教师
 * POST: 创建值日教师安排
 * PUT: 更新值日教师安排
 * DELETE: 删除值日教师安排
 * 
 * @module app/api/duty-teachers/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { success, error, ErrorCode } from '@/lib/api';
import { classRoutineService } from '@/services/class-routine.service';
import type { DutyTeacherQueryParams } from '@/types/class-routine';

/**
 * GET - 查询值日教师
 * 
 * Query params:
 * - teacherId: 教师ID
 * - grade: 年级
 * - weekDay: 星期几
 * - isActive: 是否激活
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const { searchParams } = new URL(request.url);
  
  const teacherId = searchParams.get('teacherId') || undefined;
  const gradeParam = searchParams.get('grade');
  const weekDayParam = searchParams.get('weekDay');
  const isActiveParam = searchParams.get('active');

  const params: DutyTeacherQueryParams = {
    teacherId,
    grade: gradeParam ? parseInt(gradeParam) : undefined,
    weekDay: weekDayParam ? parseInt(weekDayParam) : undefined,
    isActive: isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined,
  };

  const result = await classRoutineService.queryDutyTeachers(params);
  
  if (!result.success) {
    return NextResponse.json(error(result.error || '查询失败', ErrorCode.DATABASE_ERROR), { status: 500 });
  }

  return NextResponse.json(success(result.data, 'database'));
});

/**
 * POST - 创建值日教师安排
 * 
 * Body:
 * - teacherId: 教师ID (必填)
 * - teacherName: 教师姓名 (必填)
 * - grade: 年级，0表示全校 (必填)
 * - weekDay: 星期几，0表示每天 (必填)
 * - isActive: 是否激活 (可选，默认true)
 */
export const POST = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    
    // 验证必填字段
    if (!body.teacherId || !body.teacherName) {
      return NextResponse.json(error('缺少教师信息', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    if (body.grade === undefined || body.weekDay === undefined) {
      return NextResponse.json(error('缺少年级或星期信息', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const result = await classRoutineService.createDutyTeacher({
      teacherId: body.teacherId,
      teacherName: body.teacherName,
      grade: body.grade,
      weekDay: body.weekDay,
      isActive: body.isActive ?? true,
    });

    if (!result.success) {
      return NextResponse.json(error(result.error || '创建失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('创建值日教师安排失败:', err);
    return NextResponse.json(error('创建失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * PUT - 更新值日教师安排
 * 
 * Body:
 * - id: 记录ID (必填)
 * - grade: 年级
 * - weekDay: 星期几
 * - isActive: 是否激活
 */
export const PUT = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(error('缺少记录ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const result = await classRoutineService.updateDutyTeacher({
      id: body.id,
      grade: body.grade,
      weekDay: body.weekDay,
      isActive: body.isActive,
    });

    if (!result.success) {
      return NextResponse.json(error(result.error || '更新失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('更新值日教师安排失败:', err);
    return NextResponse.json(error('更新失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * DELETE - 删除值日教师安排
 * 
 * Query params:
 * - id: 记录ID (必填)
 */
export const DELETE = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(error('缺少记录ID', ErrorCode.BAD_REQUEST), { status: 400 });
  }

  const result = await classRoutineService.deleteDutyTeacher(id);
  
  if (!result.success) {
    return NextResponse.json(error(result.error || '删除失败', ErrorCode.DATABASE_ERROR), { status: 500 });
  }

  return NextResponse.json(success(null, 'database'));
});
