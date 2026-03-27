/**
 * 班级座位表 API
 * GET  - 获取座位表列表或当前激活的座位表
 * POST - 创建座位表
 */

import { NextRequest, NextResponse } from 'next/server';
import { seatingPlanService } from '@/services/seating-plan.service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get('classId');
    const planId = searchParams.get('planId');
    const isActive = searchParams.get('isActive');
    
    // 获取单个座位表
    if (planId) {
      const result = await seatingPlanService.getPlan(planId);
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.error === 'NOT_FOUND' ? 404 : 500 }
        );
      }
      
      return NextResponse.json({ success: true, data: result.data });
    }
    
    // 获取班级当前激活的座位表
    if (classId && isActive === 'true') {
      const result = await seatingPlanService.getActivePlan(classId);
      return NextResponse.json({ success: true, data: result.data });
    }
    
    // 获取座位表列表
    if (classId) {
      const result = await seatingPlanService.getPlansByClass({ classId });
      return NextResponse.json({ success: true, data: result.data });
    }
    
    return NextResponse.json(
      { success: false, error: '缺少必要参数' },
      { status: 400 }
    );
  } catch (error) {
    console.error('获取座位表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取座位表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.classId) {
      return NextResponse.json(
        { success: false, error: '缺少班级ID' },
        { status: 400 }
      );
    }
    
    const result = await seatingPlanService.createPlan({
      classId: body.classId,
      name: body.name,
      config: body.config,
      createdBy: body.createdBy,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('创建座位表失败:', error);
    return NextResponse.json(
      { success: false, error: '创建座位表失败' },
      { status: 500 }
    );
  }
}
