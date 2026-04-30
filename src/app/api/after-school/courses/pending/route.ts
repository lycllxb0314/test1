/**
 * 获取待审核课程列表
 * GET /api/after-school/courses/pending
 */

import { NextResponse } from 'next/server';
import { getService } from '@/lib/di';
import { SERVICE_IDENTIFIERS } from '@/lib/di/index';
import type { AfterSchoolEnrollmentService } from '@/services/after-school.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute } from '@/lib/auth/route-protection';

export const GET = protectedRoute(async (request, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const semester = searchParams.get('semester') || undefined;

    const service = getService<AfterSchoolEnrollmentService>(SERVICE_IDENTIFIERS.AfterSchoolEnrollmentService);
    const result = await service.getPendingCourses(semester);

    if (!result.success) {
      return NextResponse.json(error(result.error || '获取待审核课程失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('[API] GET /after-school/courses/pending error:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
