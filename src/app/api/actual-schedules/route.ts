/**
 * 实际课表 API
 * 
 * GET: 获取实际课表
 * POST: 创建实际课表条目
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用 protectedRoute 进行认证保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { actualScheduleService } from '@/services/schedule.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取实际课表
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId') || undefined;
  const teacherId = searchParams.get('teacherId') || undefined;
  const weekNumber = searchParams.get('weekNumber') ? parseInt(searchParams.get('weekNumber')!) : undefined;

  const result = await actualScheduleService.getActualSchedule({
    classId,
    teacherId,
    weekNumber,
  });

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取实际课表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  const formattedData = result.data.map((slot) => ({
    id: slot.id,
    classId: slot.class_id,
    className: slot.class_name,
    grade: slot.grade,
    weekDay: slot.week_day,
    periodIndex: slot.period_index,
    subject: slot.subject,
    teacherId: slot.teacher_id,
    teacherName: slot.teacher_name,
    weekNumber: slot.week_number,
    weekStartDate: slot.week_start_date,
    notes: slot.notes,
    createdAt: slot.created_at,
  }));

  return NextResponse.json(success(formattedData));
});

/**
 * POST - 创建实际课表条目
 */
export const POST = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const body = await request.json();

  const result = await actualScheduleService.create({
    class_id: body.classId,
    class_name: body.className,
    grade: body.grade,
    week_day: body.weekDay,
    period_index: body.periodIndex,
    subject: body.subject,
    teacher_id: body.teacherId,
    teacher_name: body.teacherName,
    week_number: body.weekNumber,
    week_start_date: body.weekStartDate,
    notes: body.notes,
  });

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '创建实际课表条目失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
});
