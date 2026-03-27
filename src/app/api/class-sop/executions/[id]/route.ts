/**
 * SOP 执行记录详情 API
 * GET    - 获取执行记录详情
 * DELETE - 中止执行
 */

import { NextRequest, NextResponse } from 'next/server';
import { classSopService } from '@/services/class-sop.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const execution = await classSopService.execution.getExecution(id);
    
    if (!execution) {
      return NextResponse.json(
        { success: false, error: '执行记录不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: execution,
    });
  } catch (error) {
    console.error('获取执行记录详情失败:', error);
    return NextResponse.json(
      { success: false, error: '获取执行记录详情失败' },
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
    const execution = await classSopService.execution.abort(id);
    
    return NextResponse.json({
      success: true,
      data: execution,
      message: '执行已中止',
    });
  } catch (error) {
    console.error('中止执行失败:', error);
    return NextResponse.json(
      { success: false, error: '中止执行失败' },
      { status: 500 }
    );
  }
}
