/**
 * 教研主题审核 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { researchThemeService } from '@/services/research.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * POST - 提交审核
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    const user = context.user;
    
    if (!id) {
      return NextResponse.json(error('缺少主题ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const result = await researchThemeService.submitForApproval(id);
    
    if (!result.success) {
      const statusCode = result.code === 'VALIDATION_ERROR' ? 400 : 500;
      return NextResponse.json(error(result.error || '提交审核失败', result.code as ErrorCode), { status: statusCode });
    }
    
    return NextResponse.json({ success: true, message: '已提交审核' });
  } catch (err) {
    console.error('提交审核API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * PUT - 审核通过/驳回
 */
export const PUT = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    const user = context.user;
    
    if (!id) {
      return NextResponse.json(error('缺少主题ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    
    if (body.approved === undefined) {
      return NextResponse.json(error('缺少审核结果', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await researchThemeService.approve(id, body.approved, user.id, user.name);
    
    if (!result.success) {
      const statusCode = result.code === 'VALIDATION_ERROR' ? 400 : 500;
      return NextResponse.json(error(result.error || '审核失败', result.code as ErrorCode), { status: statusCode });
    }
    
    return NextResponse.json({ success: true, message: body.approved ? '审核通过' : '审核驳回' });
  } catch (err) {
    console.error('审核API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
