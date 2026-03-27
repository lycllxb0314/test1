/**
 * 交换座位 API
 * POST - 交换两个座位的学生
 */

import { NextRequest, NextResponse } from 'next/server';
import { seatingPlanService } from '@/services/seating-plan.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: planId } = await params;
    const body = await request.json();
    
    if (!body.seatId1 || !body.seatId2) {
      return NextResponse.json(
        { success: false, error: '缺少座位ID' },
        { status: 400 }
      );
    }
    
    const result = await seatingPlanService.swapSeats({
      planId,
      seatId1: body.seatId1,
      seatId2: body.seatId2,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('交换座位失败:', error);
    return NextResponse.json(
      { success: false, error: '交换座位失败' },
      { status: 500 }
    );
  }
}
