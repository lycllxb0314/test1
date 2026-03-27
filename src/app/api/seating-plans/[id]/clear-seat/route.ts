/**
 * 清空座位 API
 * POST - 清空单个座位或所有座位
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
    
    // 清空所有座位
    if (body.clearAll) {
      const result = await seatingPlanService.clearAllSeats(planId);
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ success: true, data: result.data });
    }
    
    // 清空单个座位
    if (body.seatId) {
      const result = await seatingPlanService.clearSeat(planId, body.seatId);
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ success: true, data: result.data });
    }
    
    return NextResponse.json(
      { success: false, error: '缺少座位ID' },
      { status: 400 }
    );
  } catch (error) {
    console.error('清空座位失败:', error);
    return NextResponse.json(
      { success: false, error: '清空座位失败' },
      { status: 500 }
    );
  }
}
