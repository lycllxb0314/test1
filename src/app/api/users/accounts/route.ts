/**
 * 用户账号列表 API
 * 
 * 功能：获取用户账号列表（仅管理员可用）
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/services/user.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET /api/users/accounts
 * 获取用户账号列表
 */
export const GET = protectedRoute(async (
  request: NextRequest,
  { user }: ExtendedRouteContext
) => {
  try {
    // 权限检查：仅管理员可访问
    const adminRoles = ['principal', 'secretary', 'academic_vice_principal'];
    const userAdditionalRoles = user.additionalRoles || [];
    const isAdmin = adminRoles.includes(user.role) || 
                     userAdditionalRoles.some(r => ['academic_director', 'grade_leader'].includes(r));
    
    if (!isAdmin) {
      return NextResponse.json(
        error('无权限访问', ErrorCode.FORBIDDEN),
        { status: 403 }
      );
    }

    const result = await userService.getAccountList();
    
    if (!result.success) {
      return NextResponse.json(
        error(result.error || '获取用户列表失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (err) {
    console.error('获取用户账号列表失败:', err);
    return NextResponse.json(
      error('服务器错误', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
});
