/**
 * SOP 执行步骤 API
 * POST - 更新步骤状态（开始/完成/跳过）
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
    const { action, stepOrder, content, attachments } = body;
    
    if (!action || !stepOrder) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      );
    }
    
    let execution;
    
    switch (action) {
      case 'start':
        execution = await classSopService.execution.startStep(id, stepOrder);
        break;
      case 'complete':
        execution = await classSopService.execution.completeStep(id, stepOrder, content, attachments);
        break;
      case 'skip':
        execution = await classSopService.execution.skipStep(id, stepOrder, content || '无原因');
        break;
      default:
        return NextResponse.json(
          { success: false, error: '无效的操作' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      data: execution,
    });
  } catch (error) {
    console.error('更新步骤状态失败:', error);
    return NextResponse.json(
      { success: false, error: '更新步骤状态失败' },
      { status: 500 }
    );
  }
}
