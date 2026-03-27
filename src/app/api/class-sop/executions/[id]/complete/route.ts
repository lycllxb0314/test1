/**
 * SOP 执行完成 API
 * POST - 完成执行
 */

import { NextRequest, NextResponse } from 'next/server';
import { classSopService } from '@/services/class-sop.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (!body.summary) {
      return NextResponse.json(
        { success: false, error: '缺少执行总结' },
        { status: 400 }
      );
    }
    
    const execution = await classSopService.execution.complete({
      executionId: id,
      summary: body.summary,
      signatures: body.signatures,
    });
    
    return NextResponse.json({
      success: true,
      data: execution,
      message: '执行已完成',
    });
  } catch (error) {
    console.error('完成执行失败:', error);
    return NextResponse.json(
      { success: false, error: '完成执行失败' },
      { status: 500 }
    );
  }
}
