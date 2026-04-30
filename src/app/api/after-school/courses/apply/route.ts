/**
 * 教师申请开课
 * POST /api/after-school/courses/apply
 */

import { NextResponse } from 'next/server';
import { getService } from '@/lib/di';
import { SERVICE_IDENTIFIERS } from '@/lib/di/index';
import type { AfterSchoolEnrollmentService } from '@/services/after-school.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute } from '@/lib/auth/route-protection';

export const POST = protectedRoute(async (request, { user }) => {
  try {
    const body = await request.json();
    const { name, type, category, description, targetGrades, classroom, dayOfWeek, startTime, endTime, maxStudents } = body;

    if (!name) {
      return NextResponse.json(error('课程名称不能为空', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const u = user as unknown as Record<string, unknown>;
    const teacherId = (u.employeeId as string) || (u.id as string);
    const teacherName = (u.name as string) || '';

    const service = getService<AfterSchoolEnrollmentService>(SERVICE_IDENTIFIERS.AfterSchoolEnrollmentService);
    const result = await service.applyCourse({
      name,
      type: type || '兴趣班',
      category: category || 'interest',
      description,
      targetGrades,
      teacherId,
      teacherName,
      classroom,
      dayOfWeek,
      startTime,
      endTime,
      maxStudents,
    });

    if (!result.success) {
      return NextResponse.json(error(result.error || '申请课程失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('[API] POST /after-school/courses/apply error:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
