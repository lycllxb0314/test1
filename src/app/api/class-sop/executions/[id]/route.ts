/**
 * SOP 执行记录详情 API
 * GET    - 获取执行记录详情
 * DELETE - 中止执行
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
 * GET - 获取执行记录详情
 */
export const GET = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const { id } = await (context as ExtendedRouteContext & RouteParams).params;
    const execution = await classSopService.execution.getExecution(id);
    
    if (!execution) {
      return NextResponse.json(
        error('执行记录不存在', ErrorCode.NOT_FOUND),
        { status: 404 }
      );
    }
    
    return NextResponse.json(success(execution));
  } catch (err) {
    console.error('获取执行记录详情失败:', err);
    return NextResponse.json(
      error('获取执行记录详情失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});

/**
 * DELETE - 中止执行
 */
export const DELETE = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const { id } = await (context as ExtendedRouteContext & RouteParams).params;
    const execution = await classSopService.execution.abort(id);
    
    return NextResponse.json(success(execution));
  } catch (err) {
    console.error('中止执行失败:', err);
    return NextResponse.json(
      error('中止执行失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});
