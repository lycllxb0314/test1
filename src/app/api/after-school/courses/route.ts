/**
 * 课后服务课程 API
 * GET  /api/after-school/courses?grade=1&category=interest&status=active  课程列表（家长端按年级筛选）
 * GET  /api/after-school/courses?mode=admin&semester=2025-2026-2          管理端课程列表
 * POST /api/after-school/courses                                         创建课程
 */
import { NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { afterSchoolEnrollmentService } from '@/services/after-school.service';

export const GET = protectedRoute(async (request) => {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');
  const grade = searchParams.get('grade');
  const semester = searchParams.get('semester') || '2025-2026-2';

  // 管理端列表
  if (mode === 'admin') {
    const result = await afterSchoolEnrollmentService.getAllCourses(semester);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.data });
  }

  // 家长端/教师端按年级获取可选课程
  if (grade) {
    const gradeNum = parseInt(grade, 10);
    const result = await afterSchoolEnrollmentService.getAvailableCourses(gradeNum);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.data });
  }

  // 默认返回当前学期所有活跃课程
  const result = await afterSchoolEnrollmentService.getAllCourses(semester);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: result.data });
});

export const POST = protectedRoute(async (request) => {
  const body = await request.json();

  const result = await afterSchoolEnrollmentService.createCourse(body);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true, data: result.data }, { status: 201 });
});
