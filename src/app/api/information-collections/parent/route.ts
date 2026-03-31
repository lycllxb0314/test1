/**
 * 家长端信息采集 API
 * 
 * GET: 获取家长可见的信息采集列表
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { informationCollectionService } from '@/services/information-collection.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取家长可见的信息采集列表
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get('parentId');

  if (!parentId) {
    return NextResponse.json(
      error('缺少家长ID', ErrorCode.VALIDATION_ERROR),
      { status: 400 }
    );
  }

  const result = await informationCollectionService.getList({
    filters: { status: 'published' },
  });

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取信息采集列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  // 格式化返回
  const formattedData = result.data.map((collection: any) => ({
    id: collection.id,
    title: collection.title,
    description: collection.description,
    status: collection.status,
    deadline: collection.deadline,
    fields: collection.fields,
    createdAt: collection.createdAt,
  }));

  return NextResponse.json(success(formattedData));
}
