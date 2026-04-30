/**
 * 审核课程（通过/拒绝）
 * POST /api/after-school/courses/[id]/review
 */

import { NextResponse } from 'next/server';
import { getService } from '@/lib/di';
import { SERVICE_IDENTIFIERS } from '@/lib/di/index';
import type { AfterSchoolEnrollmentService } from '@/services/after-school.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute } from '@/lib/auth/route-protection';

export const POST = protectedRoute(async (request, { params, user }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    const body = await request.json();
    const { approvalStatus, rejectionReason } = body;

    if (!id) {
      return NextResponse.json(error('缺少课程ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    if (!approvalStatus || !['approved', 'rejected'].includes(approvalStatus)) {
      return NextResponse.json(error('审核状态无效', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    if (approvalStatus === 'rejected' && !rejectionReason) {
      return NextResponse.json(error('拒绝时需填写原因', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const service = getService<AfterSchoolEnrollmentService>(SERVICE_IDENTIFIERS.AfterSchoolEnrollmentService);
    const userId = (user as unknown as Record<string, unknown>).employeeId as string || (user as unknown as Record<string, unknown>).id as string;

    const result = await service.reviewCourse(id, {
      approvalStatus,
      reviewedBy: userId,
      rejectionReason,
    });

    if (!result.success) {
      return NextResponse.json(error(result.error || '审核操作失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('[API] POST /after-school/courses/[id]/review error:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
