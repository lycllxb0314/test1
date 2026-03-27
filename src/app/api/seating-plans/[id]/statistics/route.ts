/**
 * 座位统计 API
 * GET - 获取座位统计信息
 */

import { NextRequest, NextResponse } from 'next/server';
import { seatingPlanService } from '@/services/seating-plan.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: planId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get('classId');
    
    if (!classId) {
      return NextResponse.json(
        { success: false, error: '缺少班级ID' },
        { status: 400 }
      );
    }
    
    const result = await seatingPlanService.getStatistics(planId, classId);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('获取座位统计失败:', error);
    return NextResponse.json(
      { success: false, error: '获取座位统计失败' },
      { status: 500 }
    );
  }
}
