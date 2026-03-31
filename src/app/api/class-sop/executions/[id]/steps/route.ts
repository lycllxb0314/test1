/**
 * SOP 执行步骤 API
 * POST - 更新步骤状态（开始/完成/跳过）
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
 * POST - 更新步骤状态
 */
export const POST = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const { id } = await (context as ExtendedRouteContext & RouteParams).params;
    const body = await request.json();
    const { action, stepOrder, content, attachments } = body;
    
    if (!action || !stepOrder) {
      return NextResponse.json(
        error('缺少必填字段', ErrorCode.VALIDATION_ERROR),
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
          error('无效的操作', ErrorCode.VALIDATION_ERROR),
          { status: 400 }
        );
    }
    
    return NextResponse.json(success(execution));
  } catch (err) {
    console.error('更新步骤状态失败:', err);
    return NextResponse.json(
      error('更新步骤状态失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});
