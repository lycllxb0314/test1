/**
 * 用户子女 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { parentService } from '@/services/parent.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取用户的子女信息
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const userId = params?.id;
    
    if (!userId) {
      return NextResponse.json(error('缺少用户ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await parentService.getChildrenByUser(userId);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取子女信息失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('获取子女信息失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
