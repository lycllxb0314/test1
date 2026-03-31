/**
 * SOP 执行记录 API
 * GET  - 获取执行记录列表
 * POST - 创建执行记录（开始执行）
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用 protectedRoute 进行认证保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { classSopService } from '@/services/class-sop.service';
import { SOPCategory, ExecutionStatus } from '@/types/class-sop';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取执行记录列表
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
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
    
    return NextResponse.json(success(executions));
  } catch (err) {
    console.error('获取执行记录列表失败:', err);
    return NextResponse.json(
      error('获取执行记录列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});

/**
 * POST - 创建执行记录（开始执行）
 */
export const POST = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    
    // 验证必填字段
    if (!body.templateId || !body.classId || !body.className) {
      return NextResponse.json(
        error('缺少必填字段', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }
    
    const execution = await classSopService.execution.startExecution(
      { templateId: body.templateId, classId: body.classId },
      {
        executorId: user.id,
        executorName: user.name || '',
        className: body.className,
      }
    );
    
    return NextResponse.json(success(execution));
  } catch (err) {
    console.error('创建执行记录失败:', err);
    return NextResponse.json(
      error(err instanceof Error ? err.message : '创建执行记录失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});
