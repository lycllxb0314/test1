/**
 * 家长数据迁移 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { parentService } from '@/services/parent.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * POST - 迁移家长数据（创建对应用户账号）
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const user = context.user;
    
    // 仅管理员可执行
    if (!user || (user.role !== 'admin' as string && user.role !== 'super_admin' as string)) {
      return NextResponse.json(error('只有管理员可以执行迁移', ErrorCode.FORBIDDEN), { status: 403 });
    }
    
    const result = await parentService.migrate();
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '迁移失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      message: `成功迁移 ${result.data?.migrated || 0} 条家长数据`,
    });
  } catch (err) {
    console.error('迁移家长数据API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
