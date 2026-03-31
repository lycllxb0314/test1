/**
 * 当前登录家长信息 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { parentService } from '@/services/parent.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取当前登录家长信息
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const user = context.user;
    
    if (!user || user.role !== 'parent') {
      return NextResponse.json(error('只有家长角色可以访问', ErrorCode.FORBIDDEN), { status: 403 });
    }
    
    const result = await parentService.getMyInfo(user.phone || '');
    
    if (!result.success) {
      const statusCode = result.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json(error(result.error || '获取家长信息失败', result.code as ErrorCode), { status: statusCode });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('获取家长信息失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * PUT - 更新当前登录家长信息
 */
export const PUT = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const user = context.user;
    
    if (!user || user.role !== 'parent') {
      return NextResponse.json(error('只有家长角色可以访问', ErrorCode.FORBIDDEN), { status: 403 });
    }
    
    const body = await request.json();
    const result = await parentService.updateMyInfo(user.phone || '', body);
    
    if (!result.success) {
      const statusCode = result.code === 'NOT_FOUND' || result.code === 'VALIDATION_ERROR' ? 400 : 500;
      return NextResponse.json(error(result.error || '更新家长信息失败', result.code as ErrorCode), { status: statusCode });
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      message: '更新成功',
    });
  } catch (err) {
    console.error('更新家长信息失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
