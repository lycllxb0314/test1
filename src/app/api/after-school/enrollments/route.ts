/**
 * 课后服务选课记录 API
 * GET /api/after-school/enrollments?studentId=xxx              查询学生选课记录（家长端）
 * GET /api/after-school/enrollments?mode=admin&courseId=xxx    管理端查询（教务/教师端）
 * GET /api/after-school/enrollments?parentId=xxx               按家长查询
 */
import { NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { afterSchoolEnrollmentService } from '@/services/after-school.service';

export const GET = protectedRoute(async (request) => {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');
  const studentId = searchParams.get('studentId');
  const courseId = searchParams.get('courseId');
  const parentId = searchParams.get('parentId');
  const status = searchParams.get('status') || undefined;

  // 管理端按课程查询
  if (mode === 'admin' && courseId) {
    const result = await afterSchoolEnrollmentService.getEnrollmentsByCourse(courseId, status);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.data });
  }

  // 家长端按家长查询（关联所有子女）
  if (parentId) {
    const result = await afterSchoolEnrollmentService.getParentEnrollments(parentId);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.data });
  }

  // 家长端按学生查询
  if (studentId) {
    const result = await afterSchoolEnrollmentService.getEnrollmentsByStudent(studentId, status);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.data });
  }

  return NextResponse.json(
    { success: false, error: '缺少 studentId、courseId 或 parentId 参数' },
    { status: 400 }
  );
});
