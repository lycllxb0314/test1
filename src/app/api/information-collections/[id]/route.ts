/**
 * 信息采集详情 API
 * 
 * GET: 获取信息采集详情
 * PUT: 更新信息采集
 * DELETE: 删除信息采集
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { informationCollectionService } from '@/services/information-collection.service';
import { success, error, ErrorCode } from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET - 获取信息采集详情
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const result = await informationCollectionService.getById(id);

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取信息采集详情失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  const collection = result.data;
  return NextResponse.json(success({
    id: collection.id,
    title: collection.title,
    description: collection.description,
    status: collection.status,
    deadline: collection.deadline,
    fields: collection.fields,
    creatorId: collection.creatorId,
    createdAt: collection.createdAt,
  }));
}

/**
 * PUT - 更新信息采集
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();

  let result;
  if (body.action === 'publish') {
    result = await informationCollectionService.publish(id);
  } else if (body.action === 'close') {
    result = await informationCollectionService.close(id);
  } else {
    result = await informationCollectionService.update(id, {
      title: body.title,
      description: body.description,
      deadline: body.deadline,
      fields: body.fields,
    });
  }

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '更新信息采集失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
}

/**
 * DELETE - 删除信息采集
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const result = await informationCollectionService.delete(id);

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '删除信息采集失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success({ deleted: true }));
}
