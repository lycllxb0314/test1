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
import { collectionResponseRepository } from '@/repositories/information-collection.repository';
import { success, error, ErrorCode } from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 数据库行类型（下划线命名）
 */
interface CollectionRow {
  id: string;
  title: string;
  description?: string;
  class_id: string;
  teacher_id: string;
  teacher_name: string;
  fields: unknown[];
  status: string;
  deadline?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

/**
 * 转换数据库行到前端格式（驼峰命名）
 */
async function transformToFrontend(row: CollectionRow): Promise<ReturnType<typeof transformToFrontendSync>> {
  // 获取响应数
  const stats = await collectionResponseRepository.getCollectionStats(row.id);
  return transformToFrontendSync(row, stats.total);
}

/**
 * 同步转换（无响应数查询）
 */
function transformToFrontendSync(row: CollectionRow, responseCount: number = 0) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    classId: row.class_id,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    fields: row.fields || [],
    status: row.status,
    deadline: row.deadline || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at || null,
    responseCount,
  };
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

  return NextResponse.json(success(await transformToFrontend(result.data as unknown as CollectionRow)));
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
      status: body.status,
    });
  }

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '更新信息采集失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(await transformToFrontend(result.data as unknown as CollectionRow)));
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
