/**
 * 经费审批 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { expenseService } from '@/services/expense.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * POST - 审批经费
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
    const { approved, comment } = body;
    
    if (approved === undefined) {
      return NextResponse.json(error('缺少审批结果', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await expenseService.approve(id, user.id, user.name, approved, comment);
    
    if (!result.success) {
      const statusCode = result.code === 'NOT_FOUND' ? 404 : 
                        result.code === 'ALREADY_PROCESSED' ? 400 : 500;
      return NextResponse.json(error(result.error || '审批失败', result.code as ErrorCode), { status: statusCode });
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      message: approved ? '审批通过' : '审批驳回',
    });
  } catch (err) {
    console.error('审批经费API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
