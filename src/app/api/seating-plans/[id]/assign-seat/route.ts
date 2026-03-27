/**
 * 座位操作 API
 * POST - 安排学生入座
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
    
    // 安排单个座位
    if (body.seatId && body.studentId) {
      const result = await seatingPlanService.assignSeat({
        planId,
        seatId: body.seatId,
        studentId: body.studentId,
      });
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.error === 'NOT_FOUND' ? 404 : 500 }
        );
      }
      
      return NextResponse.json({ success: true, data: result.data });
    }
    
    // 批量安排座位
    if (body.assignments && Array.isArray(body.assignments)) {
      const result = await seatingPlanService.batchAssignSeats({
        planId,
        assignments: body.assignments,
      });
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ success: true, data: result.data });
    }
    
    return NextResponse.json(
      { success: false, error: '缺少必要参数' },
      { status: 400 }
    );
  } catch (error) {
    console.error('安排座位失败:', error);
    return NextResponse.json(
      { success: false, error: '安排座位失败' },
      { status: 500 }
    );
  }
}
