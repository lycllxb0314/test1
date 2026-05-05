/**
 * 门禁申请管理 API
 * GET  - 获取申请列表
 * POST - 创建申请
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth/route-protection';
import { accessApplicationService } from '@/services/access-control.service';
import { success, error, ErrorCode } from '@/lib/api';
import type { ApplicationStatus } from '@/repositories/access-control.repository';

export const GET = protectedRoute(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as ApplicationStatus | null;
  const applicantType = searchParams.get('applicantType') as 'parent' | 'visitor' | null;
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  const result = await accessApplicationService.getApplications({
    status: status || undefined,
    applicantType: applicantType || undefined,
    search: search || undefined,
    page,
    pageSize,
  });

  if (!result.success) {
    return NextResponse.json(error(result.error || '获取失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }

  return NextResponse.json(success(result.data));
});

export const POST = protectedRoute(async (request: NextRequest) => {
  const body = await request.json();

  const result = await accessApplicationService.createApplication(body);
  if (!result.success) {
    return NextResponse.json(error(result.error || '创建失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }

  return NextResponse.json(success(result.data, 'database'));
});
