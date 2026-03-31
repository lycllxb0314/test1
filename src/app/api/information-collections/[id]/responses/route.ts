/**
 * 信息采集响应 API
 * 
 * GET: 获取信息采集响应列表
 * POST: 提交信息采集响应
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { collectionResponseService } from '@/services/information-collection.service';
import { success, error, ErrorCode } from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET - 获取信息采集响应列表
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const result = await collectionResponseService.getByCollection(id);

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取响应列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  const formattedData = result.data.map((response: any) => ({
    id: response.id,
    collectionId: response.collectionId,
    respondentId: response.respondentId,
    respondentName: response.respondentName,
    respondentType: response.respondentType,
    answers: response.answers,
    submittedAt: response.submittedAt,
    createdAt: response.createdAt,
  }));

  return NextResponse.json(success(formattedData));
}

/**
 * POST - 提交信息采集响应
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();

  const result = await collectionResponseService.submit(
    id,
    body.respondentId || '',
    body.respondentName || '',
    body.answers || {}
  );

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '提交响应失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
}
