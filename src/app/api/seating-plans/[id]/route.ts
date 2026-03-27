/**
 * 座位表详情 API
 * GET    - 获取座位表详情
 * PUT    - 更新座位表配置
 * DELETE - 删除座位表
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
    const { id } = await params;
    const result = await seatingPlanService.getPlan(id);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === 'NOT_FOUND' ? 404 : 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('获取座位表详情失败:', error);
    return NextResponse.json(
      { success: false, error: '获取座位表详情失败' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const result = await seatingPlanService.updatePlan(id, {
      name: body.name,
      config: body.config,
      seats: body.seats,
      isActive: body.isActive,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('更新座位表失败:', error);
    return NextResponse.json(
      { success: false, error: '更新座位表失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const result = await seatingPlanService.deletePlan(id);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除座位表失败:', error);
    return NextResponse.json(
      { success: false, error: '删除座位表失败' },
      { status: 500 }
    );
  }
}
