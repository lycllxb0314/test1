/**
 * SOP 执行记录 API
 * GET  - 获取执行记录列表
 * POST - 创建执行记录（开始执行）
 */

import { NextRequest, NextResponse } from 'next/server';
import { classSopService } from '@/services/class-sop.service';
import { SOPCategory, ExecutionStatus } from '@/types/class-sop';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get('templateId');
    const classId = searchParams.get('classId');
    const executorId = searchParams.get('executorId');
    const category = searchParams.get('category') as SOPCategory | null;
    const status = searchParams.get('status') as ExecutionStatus | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const executions = await classSopService.execution.getExecutions({
      templateId: templateId || undefined,
      classId: classId || undefined,
      executorId: executorId || undefined,
      category: category || undefined,
      status: status || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    
    return NextResponse.json({
      success: true,
      data: executions,
    });
  } catch (error) {
    console.error('获取执行记录列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取执行记录列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必填字段
    if (!body.templateId || !body.classId || !body.executorId || !body.executorName || !body.className) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      );
    }
    
    const execution = await classSopService.execution.startExecution(
      { templateId: body.templateId, classId: body.classId },
      {
        executorId: body.executorId,
        executorName: body.executorName,
        className: body.className,
      }
    );
    
    return NextResponse.json({
      success: true,
      data: execution,
    });
  } catch (error) {
    console.error('创建执行记录失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建执行记录失败' },
      { status: 500 }
    );
  }
}
