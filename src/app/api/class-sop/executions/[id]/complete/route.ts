/**
 * SOP 执行完成 API
 * POST - 完成执行
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用 protectedRoute 进行认证保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { classSopService } from '@/services/class-sop.service';
import { success, error, ErrorCode } from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST - 完成执行
 */
export const POST = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const { id } = await (context as ExtendedRouteContext & RouteParams).params;
    const body = await request.json();
    
    if (!body.summary) {
      return NextResponse.json(
        error('缺少执行总结', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }
    
    const execution = await classSopService.execution.complete({
      executionId: id,
      summary: body.summary,
      signatures: body.signatures,
    });
    
    return NextResponse.json(success(execution));
  } catch (err) {
    console.error('完成执行失败:', err);
    return NextResponse.json(
      error('完成执行失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});
