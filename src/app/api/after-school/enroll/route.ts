/**
 * 课后服务选课/退课 API
 * POST   /api/after-school/enroll              一键选课（家长端）
 * DELETE /api/after-school/enroll              退课（家长端）
 */
import { NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { afterSchoolEnrollmentService } from '@/services/after-school.service';

export const POST = protectedRoute(async (request) => {
  const body = await request.json();
  const { courseId, studentId, studentName, className } = body;

  if (!courseId || !studentId) {
    return NextResponse.json(
      { success: false, error: '缺少 courseId 或 studentId' },
      { status: 400 }
    );
  }

  const user = (request as unknown as Record<string, unknown>).user as Record<string, unknown> | undefined;
  const parentId = (user?.id || user?.employee_id || '') as string;

  const result = await afterSchoolEnrollmentService.enrollCourse({
    courseId,
    studentId,
    studentName: studentName || '',
    className: className || '',
    parentId,
  });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true, data: result.data });
});

export const DELETE = protectedRoute(async (request) => {
  const body = await request.json();
  const { courseId, studentId, cancelReason } = body;

  if (!courseId || !studentId) {
    return NextResponse.json(
      { success: false, error: '缺少 courseId 或 studentId' },
      { status: 400 }
    );
  }

  const result = await afterSchoolEnrollmentService.cancelEnrollment({
    courseId,
    studentId,
    cancelReason: cancelReason || '家长主动退课',
  });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
});
