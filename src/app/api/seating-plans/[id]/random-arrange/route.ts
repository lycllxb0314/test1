/**
 * 随机排座 API
 * POST - 随机安排学生座位
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
    
    if (!body.classId) {
      return NextResponse.json(
        { success: false, error: '缺少班级ID' },
        { status: 400 }
      );
    }
    
    const result = await seatingPlanService.randomArrange(planId, body.classId);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('随机排座失败:', error);
    return NextResponse.json(
      { success: false, error: '随机排座失败' },
      { status: 500 }
    );
  }
}
