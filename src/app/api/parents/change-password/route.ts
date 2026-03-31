/**
 * 家长修改密码 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { parentService } from '@/services/parent.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * POST - 修改密码
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const user = context.user;
    
    if (!user || user.role !== 'parent') {
      return NextResponse.json(error('只有家长角色可以访问', ErrorCode.FORBIDDEN), { status: 403 });
    }
    
    const body = await request.json();
    const { parentId, newPassword } = body;
    
    if (!parentId || !newPassword) {
      return NextResponse.json(error('缺少必要参数', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await parentService.changePassword(parentId, newPassword);
    
    if (!result.success) {
      const statusCode = result.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json(error(result.error || '修改密码失败', result.code as ErrorCode), { status: statusCode });
    }
    
    return NextResponse.json({ success: true, message: '密码修改成功' });
  } catch (err) {
    console.error('修改密码API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
