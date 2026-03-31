/**
 * 安全检查 API
 * 
 * GET: 获取安全检查列表
 * POST: 创建安全检查
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { safetyInspectionService } from '@/services/safety.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取安全检查列表
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const area = searchParams.get('area') || undefined;
  const type = searchParams.get('type') || undefined;
  const resolved = searchParams.get('resolved') === 'true' ? true : undefined;
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
  const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 20;

  const result = await safetyInspectionService.getList({ status, area, type, resolved, page, pageSize });

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取安全检查列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  const formattedData = result.data.data.map((inspection: any) => ({
    id: inspection.id,
    inspector: inspection.inspector,
    inspectionDate: inspection.inspection_date,
    area: inspection.area,
    type: inspection.type,
    status: inspection.status,
    issues: inspection.issues,
    resolved: inspection.resolved,
    resolvedAt: inspection.resolved_at,
    resolvedBy: inspection.resolved_by,
    notes: inspection.notes,
    createdAt: inspection.created_at,
  }));

  return NextResponse.json(success({
    data: formattedData,
    pagination: {
      total: result.data.total,
      page: result.data.page,
      pageSize: result.data.pageSize,
      totalPages: result.data.totalPages,
    },
  }));
}

/**
 * POST - 创建安全检查
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = await safetyInspectionService.create({
    inspector: body.inspector,
    inspection_date: body.inspectionDate || body.date,
    area: body.area,
    type: body.type,
    status: body.status || 'pending',
    issues: body.issues || [],
    resolved: false,
    notes: body.notes,
  });

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '创建安全检查失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
}
