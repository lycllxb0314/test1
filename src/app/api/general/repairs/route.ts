import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth/route-protection';
import { repairService } from '@/services/repair.service';
import { success, error, ErrorCode } from '@/lib/api';
import type { RepairFilters } from '@/types/general';

export const GET = protectedRoute(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  
  const filters: RepairFilters = {
    status: searchParams.get('status') as RepairFilters['status'] || undefined,
    type: searchParams.get('type') as RepairFilters['type'] || undefined,
    urgency: searchParams.get('urgency') as RepairFilters['urgency'] || undefined,
    applicantId: searchParams.get('applicantId') || undefined,
  };

  // 移除 undefined 和 'all' 值
  Object.keys(filters).forEach(key => {
    if (filters[key as keyof RepairFilters] === undefined || filters[key as keyof RepairFilters] === 'all') {
      delete filters[key as keyof RepairFilters];
    }
  });

  const result = await repairService.getRepairs(Object.keys(filters).length > 0 ? filters : undefined);

  if (!result.success) {
    return NextResponse.json(error(result.error || '获取报修列表失败', ErrorCode.NOT_FOUND), { status: 404 });
  }

  return NextResponse.json(success(result.data, 'database'));
});

export const POST = protectedRoute(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { type, assetId, item, location, description, urgency, images, applicantId, applicantName, department } = body;

    if (!item || !location || !description || !applicantId || !applicantName) {
      return NextResponse.json(error('缺少必填字段', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const result = await repairService.createRepair({
      type: type || 'other',
      assetId,
      item,
      location,
      description,
      urgency: urgency || 'normal',
      images,
      applicantId,
      applicantName,
      department,
    });

    if (!result.success) {
      return NextResponse.json(error(result.error || '创建报修失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('[Repairs API] POST error:', err);
    return NextResponse.json(error('创建报修失败', ErrorCode.BAD_REQUEST), { status: 400 });
  }
});
