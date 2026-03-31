/**
 * 维修申请 API
 * 
 * GET: 获取维修申请列表
 * POST: 创建维修申请
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { repairRequestService } from '@/services/asset.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取维修申请列表
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const urgency = searchParams.get('urgency') || undefined;
  const reporter = searchParams.get('reporter') || undefined;
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
  const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 20;

  const result = await repairRequestService.getList({ status, urgency, reporter, page, pageSize });

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取维修申请列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  const formattedData = result.data.data.map((repair: any) => ({
    id: repair.id,
    assetId: repair.asset_id,
    assetName: repair.asset_name,
    location: repair.location,
    reporter: repair.reporter,
    reporterId: repair.reporter_id,
    description: repair.description,
    urgency: repair.urgency,
    status: repair.status,
    assignedTo: repair.assigned_to,
    assignedAt: repair.assigned_at,
    completedAt: repair.completed_at,
    cost: repair.cost,
    notes: repair.notes,
    createdAt: repair.created_at,
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
 * POST - 创建维修申请
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = await repairRequestService.create({
    asset_id: body.assetId,
    asset_name: body.assetName,
    location: body.location,
    reporter: body.reporter,
    reporter_id: body.reporterId,
    description: body.description,
    urgency: body.urgency || 'normal',
  });

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '创建维修申请失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
}
