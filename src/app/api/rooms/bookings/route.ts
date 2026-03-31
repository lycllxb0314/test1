/**
 * 教室预约 API
 * 
 * GET: 获取预约列表
 * POST: 创建预约
 * PUT: 更新预约状态
 */

import { NextRequest, NextResponse } from 'next/server';
import { success, error, ErrorCode } from '@/lib/api';
import { getService } from '@/lib/di';
import { SERVICE_IDENTIFIERS } from '@/lib/di/container';
import type { RoomBookingService } from '@/services/room-booking.service';

/**
 * GET - 获取教室预约列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const applicantId = searchParams.get('applicantId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 通过 DI 获取 Service
    const roomBookingService = getService<RoomBookingService>(SERVICE_IDENTIFIERS.RoomBookingService);

    const result = await roomBookingService.getList({
      roomId: roomId || undefined,
      applicantId: applicantId || undefined,
      status: status || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (err) {
    console.error('Failed to fetch room bookings:', err);
    return NextResponse.json({
      success: false,
      error: '获取教室预约列表失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建教室预约
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      roomId,
      applicantId,
      applicantName,
      purpose,
      startTime,
      endTime,
      attendeesCount,
      facilitiesNeeded,
      notes,
    } = body;

    // 通过 DI 获取 Service
    const roomBookingService = getService<RoomBookingService>(SERVICE_IDENTIFIERS.RoomBookingService);

    const result = await roomBookingService.create({
      roomId,
      applicantId,
      applicantName,
      purpose,
      startTime,
      endTime,
      attendeesCount,
      facilitiesNeeded,
      notes,
    });

    if (!result.success) {
      const statusCode = result.code === 'CONFLICT' ? 400 : 500;
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: statusCode });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (err) {
    console.error('Failed to create room booking:', err);
    return NextResponse.json({
      success: false,
      error: '创建教室预约失败',
    }, { status: 500 });
  }
}

/**
 * PUT - 更新教室预约状态（审批）
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, approverId, approverName, rejectionReason } = body;

    // 通过 DI 获取 Service
    const roomBookingService = getService<RoomBookingService>(SERVICE_IDENTIFIERS.RoomBookingService);

    const result = await roomBookingService.updateStatus({
      id,
      action,
      approverId,
      approverName,
      rejectionReason,
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (err) {
    console.error('Failed to update room booking:', err);
    return NextResponse.json({
      success: false,
      error: '更新教室预约失败',
    }, { status: 500 });
  }
}
