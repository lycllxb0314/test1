/**
 * 通行记录 API
 * GET  - 获取通行记录
 * POST - 创建通行记录
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth/route-protection';
import { accessControlService } from '@/services/access-control.service';
import { success, error, ErrorCode } from '@/lib/api';
import type { PersonType } from '@/repositories/access-control.repository';

export const GET = protectedRoute(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const personType = searchParams.get('personType') as PersonType | null;
  const direction = searchParams.get('direction');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  const result = await accessControlService.getRecords({
    personType: personType || undefined,
    direction: direction || undefined,
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

  // 直接通过 repository 创建记录
  const { accessRecordRepository } = await import('@/repositories/access-control.repository');
  const record = await accessRecordRepository.create(body);

  return NextResponse.json(success(record, 'database'));
});
