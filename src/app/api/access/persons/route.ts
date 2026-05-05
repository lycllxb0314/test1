/**
 * 门禁人员管理 API
 * GET  - 获取人员列表
 * POST - 创建/同步人员
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth/route-protection';
import { accessPersonService } from '@/services/access-control.service';
import { success, error, ErrorCode } from '@/lib/api';
import type { PersonType } from '@/repositories/access-control.repository';

export const GET = protectedRoute(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const personType = searchParams.get('personType') as PersonType | null;
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  const result = await accessPersonService.getPersons({
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
  const { action, personType, ...personData } = body;

  // 同步教务数据
  if (action === 'sync' && personType) {
    const result = await accessPersonService.syncFromAcademic(personType as PersonType);
    if (!result.success) {
      return NextResponse.json(error(result.error || '同步失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    return NextResponse.json(success(result.data, 'database'));
  }

  // 生成人脸向量
  if (action === 'generateFaceVector') {
    const { personId, photoUrl } = body;
    if (!personId || !photoUrl) {
      return NextResponse.json(error('缺少人员ID或照片URL', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => { headers[key] = value; });
    const result = await accessPersonService.generateFaceVector(personId, photoUrl, headers);
    if (!result.success) {
      return NextResponse.json(error(result.error || '生成向量失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    return NextResponse.json(success(result.data));
  }

  // 创建人员
  const result = await accessPersonService.createPerson(personData);
  if (!result.success) {
    return NextResponse.json(error(result.error || '创建失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }

  return NextResponse.json(success(result.data, 'database'));
});
