/**
 * 课后服务点名表 API
 * GET /api/after-school/roster/[courseId]  获取课程点名表
 */
import { NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { afterSchoolEnrollmentService } from '@/services/after-school.service';

export const GET = protectedRoute(async (request, context) => {
  const params = await context.params;
  const courseId = params?.courseId;
  if (!courseId) return NextResponse.json({ success: false, error: '缺少课程ID' }, { status: 400 });

  const result = await afterSchoolEnrollmentService.getCourseRoster(courseId);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: result.data });
});
