/**
 * 数据采集 API
 * 
 * GET: 获取数据采集列表
 * POST: 创建数据采集
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用 protectedRoute 进行认证保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { informationCollectionService } from '@/services/information-collection.service';
import { success, error, ErrorCode } from '@/lib/api';
import type { CollectionStatus } from '@/types/information-collection';

/**
 * GET - 获取数据采集列表
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as CollectionStatus | undefined;
  const creatorId = searchParams.get('createdBy') || undefined;

  const result = await informationCollectionService.getList({
    filters: { status, creatorId },
  });

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取数据采集列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
});

/**
 * POST - 创建数据采集
 */
export const POST = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const body = await request.json();

  const result = await informationCollectionService.create({
    title: body.title,
    description: body.description,
    deadline: body.deadline,
    creatorId: user.id,
    fields: body.fields,
  });

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '创建数据采集失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
});
