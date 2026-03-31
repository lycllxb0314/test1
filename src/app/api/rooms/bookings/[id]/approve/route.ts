/**
 * 审批预约 API
 * 
 * POST: 审批教室预约
 */

import { NextRequest, NextResponse } from 'next/server';
import { success, error, ErrorCode } from '@/lib/api';
import { getService } from '@/lib/di';
import { SERVICE_IDENTIFIERS } from '@/lib/di/container';
import type { RoomBookingService } from '@/services/room-booking.service';

/**
 * POST - 审批预约
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, comment, approverId, approverName, approverRole } = body;

    // 通过 DI 获取 Service
    const roomBookingService = getService<RoomBookingService>(SERVICE_IDENTIFIERS.RoomBookingService);

    const result = await roomBookingService.approve({
      bookingId: id,
      action,
      comment,
      approverId,
      approverName,
      approverRole,
    });

    if (!result.success) {
      const statusCode = result.code === 'NOT_FOUND' ? 404 :
                         result.code === 'VALIDATION_ERROR' ? 400 : 500;
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: statusCode });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: action === 'approve' ? '预约已批准' : '预约已驳回',
    });
  } catch (err) {
    console.error('Failed to approve booking:', err);
    return NextResponse.json({
      success: false,
      error: '审批操作失败',
    }, { status: 500 });
  }
}
