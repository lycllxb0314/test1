/**
 * 批量创建家长 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { parentService } from '@/services/parent.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * POST - 批量创建家长
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    const parents = Array.isArray(body) ? body : body.parents || [];
    
    if (parents.length === 0) {
      return NextResponse.json(error('请提供家长数据', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await parentService.batchCreate(parents);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '批量创建失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      message: `成功创建 ${result.data?.success || 0} 个家长账号`,
    });
  } catch (err) {
    console.error('批量创建家长API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
