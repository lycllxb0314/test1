/**
 * 场地预约 API
 * 
 * GET: 获取场地预约列表
 * POST: 创建场地预约
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { SpaceReservationService } from '@/services/facility.service';
import { success, error, ErrorCode } from '@/lib/api';

const spaceReservationService = new SpaceReservationService();

/**
 * GET - 获取场地预约列表
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const spaceId = searchParams.get('roomId') || undefined;
  const applicantId = searchParams.get('applicantId') || undefined;
  const status = searchParams.get('status') || undefined;
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
  const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 20;

  const result = await spaceReservationService.getList({ spaceId, applicantId, status, startDate, endDate, page, pageSize });

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取场地预约列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  const formattedData = result.data.data.map((reservation: any) => ({
    id: reservation.id,
    spaceId: reservation.space_id,
    spaceName: reservation.space_name,
    applicantId: reservation.applicant_id,
    applicantName: reservation.applicant_name,
    purpose: reservation.purpose,
    startTime: reservation.start_time,
    endTime: reservation.end_time,
    status: reservation.status,
    approvedBy: reservation.approved_by,
    approvedAt: reservation.approved_at,
    notes: reservation.notes,
    createdAt: reservation.created_at,
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
 * POST - 创建场地预约
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = await spaceReservationService.create({
    space_id: body.roomId || body.spaceId,
    space_name: body.roomName || body.spaceName,
    applicant_id: body.applicantId,
    applicant_name: body.applicantName,
    purpose: body.purpose,
    start_time: body.startTime,
    end_time: body.endTime,
    notes: body.notes,
  });

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '创建场地预约失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
}
