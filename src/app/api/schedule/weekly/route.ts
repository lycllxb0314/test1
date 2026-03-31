/**
 * 周课表 API
 * 
 * GET: 获取周课表
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用 protectedRoute 进行认证保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { baseScheduleService } from '@/services/schedule.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取周课表
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId') || undefined;
  const teacherId = searchParams.get('teacherId') || undefined;
  const grade = searchParams.get('grade') ? parseInt(searchParams.get('grade')!) : undefined;
  const weekNumber = searchParams.get('weekNumber') ? parseInt(searchParams.get('weekNumber')!) : undefined;
  const semester = searchParams.get('semester') || undefined;

  if (!classId && !teacherId && !grade) {
    return NextResponse.json(
      error('需要提供班级ID、教师ID或年级', ErrorCode.VALIDATION_ERROR),
      { status: 400 }
    );
  }

  const result = await baseScheduleService.getWeeklySchedule({
    classId,
    teacherId,
    grade,
    weekNumber,
    semester,
  });

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取周课表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  const formattedData = result.data.map((slot) => ({
    id: slot.id,
    classId: slot.class_id,
    className: slot.class_name,
    grade: slot.grade,
    dayOfWeek: slot.day_of_week,
    lesson: slot.lesson,
    subject: slot.subject,
    teacherId: slot.teacher_id,
    teacherName: slot.teacher_name,
    semester: slot.semester,
    createdAt: slot.created_at,
  }));

  return NextResponse.json(success(formattedData));
});
