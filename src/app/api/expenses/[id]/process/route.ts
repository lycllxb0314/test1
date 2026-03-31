/**
 * 经费处理 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { expenseService } from '@/services/expense.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * POST - 处理经费（完成/取消）
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    const user = context.user;
    
    if (!id) {
      return NextResponse.json(error('缺少经费ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    const { action, note } = body;
    
    if (!action || !['complete', 'cancel'].includes(action)) {
      return NextResponse.json(error('无效的操作类型', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await expenseService.process(id, action, user.id, user.name, note);
    
    if (!result.success) {
      const statusCode = result.code === 'NOT_FOUND' ? 404 : 
                        result.code === 'INVALID_STATUS' ? 400 : 500;
      return NextResponse.json(error(result.error || '处理失败', result.code as ErrorCode), { status: statusCode });
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      message: action === 'complete' ? '处理完成' : '已取消',
    });
  } catch (err) {
    console.error('处理经费API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
