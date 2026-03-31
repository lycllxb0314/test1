/**
 * 财务记录 API
 * 
 * GET: 获取财务记录列表
 * POST: 创建财务记录
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { expenseService } from '@/services/expense.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取财务记录列表
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId') || undefined;
  const type = searchParams.get('type') || undefined;
  const status = searchParams.get('status') || undefined;
  const applicantId = searchParams.get('applicantId') || undefined;
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
  const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 20;

  const result = await expenseService.getList({
    classId,
    type,
    status,
    applicantId,
    page,
    pageSize,
  });

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取财务记录失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success({
    data: Array.isArray(result.data) ? result.data : [],
    pagination: result.pagination,
  }));
}

/**
 * POST - 创建财务记录
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = await expenseService.create({
    classId: body.classId,
    type: body.type,
    amount: body.amount,
    description: body.description,
    applicantId: body.applicantId,
    applicantName: body.applicantName,
  });

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '创建财务记录失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
}
