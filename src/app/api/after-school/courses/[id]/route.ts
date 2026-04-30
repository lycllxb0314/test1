/**
 * 课后服务课程详情 API
 * GET    /api/after-school/courses/[id]   课程详情
 * PATCH  /api/after-school/courses/[id]   更新课程
 * DELETE /api/after-school/courses/[id]   删除课程
 */
import { NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { afterSchoolEnrollmentService } from '@/services/after-school.service';

export const GET = protectedRoute(async (request, context) => {
  const params = await context.params;
  const id = params?.id;
  if (!id) return NextResponse.json({ success: false, error: '缺少课程ID' }, { status: 400 });

  const result = await afterSchoolEnrollmentService.getCourseById(id);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: result.data });
});

export const PATCH = protectedRoute(async (request, context) => {
  const params = await context.params;
  const id = params?.id;
  if (!id) return NextResponse.json({ success: false, error: '缺少课程ID' }, { status: 400 });
  const body = await request.json();

  const result = await afterSchoolEnrollmentService.updateCourse(id, body);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true, data: result.data });
});

export const DELETE = protectedRoute(async (request, context) => {
  const params = await context.params;
  const id = params?.id;
  if (!id) return NextResponse.json({ success: false, error: '缺少课程ID' }, { status: 400 });

  const result = await afterSchoolEnrollmentService.deleteCourse(id);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
});
