/**
 * 门禁人员管理 API
 * GET  - 获取人员列表（自动合并教务数据）
 * POST - 创建人员 / 更新照片（触发向量生成）
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth/route-protection';
import { accessControlService } from '@/services/access-control.service';
import { success, error, ErrorCode } from '@/lib/api';
import type { PersonType } from '@/repositories/access-control.repository';

export const GET = protectedRoute(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const personType = searchParams.get('personType') as PersonType | null;
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  const result = await accessControlService.getPersonsWithAcademic({
    personType: personType || undefined,
    status: status || undefined,
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
  const { action, ...personData } = body;

  // 更新照片（自动触发向量生成）
  if (action === 'updatePhoto') {
    const { personId, photoUrl, name, personType, department, relatedId } = body;
    if (!personId || !photoUrl) {
      return NextResponse.json(error('缺少人员ID或照片URL', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    const result = await accessControlService.updatePersonPhoto(
      personId,
      photoUrl,
      { name, personType, department, relatedId },
    );
    if (!result.success) {
      return NextResponse.json(error(result.error || '更新照片失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    return NextResponse.json(success(result.data));
  }

  // 创建人员（家长/访客）
  const result = await accessControlService.createPerson(personData);
  if (!result.success) {
    return NextResponse.json(error(result.error || '创建失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }

  return NextResponse.json(success(result.data, 'database'));
});
