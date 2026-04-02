/**
 * 信息采集 API
 * 
 * GET: 获取信息采集列表
 * POST: 创建信息采集
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { informationCollectionService } from '@/services/information-collection.service';
import { collectionResponseRepository } from '@/repositories/information-collection.repository';
import { success, error, ErrorCode } from '@/lib/api';
import { withAuth } from '@/lib/auth';
import type { CollectionStatus } from '@/types/information-collection';

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
function transformToFrontend(row: CollectionRow, responseCount: number = 0) {
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
 * GET - 获取信息采集列表
 */
export const GET = withAuth(async (request: NextRequest, { user }) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as CollectionStatus | undefined;

  const result = await informationCollectionService.getList({
    filters: { status, creatorId: user.id },
  });

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取信息采集列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  const rows = result.data as unknown as CollectionRow[];
  
  // 批量获取响应数
  const collectionIds = rows.map(r => r.id);
  const responseCounts = await collectionResponseRepository.getResponseCounts(collectionIds);

  // 转换字段名：下划线 -> 驼峰
  const transformedData = rows.map(row => 
    transformToFrontend(row, responseCounts.get(row.id) || 0)
  );

  return NextResponse.json(success(transformedData));
});

/**
 * POST - 创建信息采集
 */
export const POST = withAuth(async (request: NextRequest, { user }) => {
  const body = await request.json();

  const result = await informationCollectionService.create({
    title: body.title,
    description: body.description,
    deadline: body.deadline,
    creatorId: user.id,
    creatorName: user.name,
    fields: body.fields,
    status: body.status,
  });

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '创建信息采集失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  // 转换字段名
  const transformedData = transformToFrontend(result.data as unknown as CollectionRow, 0);

  return NextResponse.json(success(transformedData));
});
