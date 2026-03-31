/**
 * 用户修改密码 API
 * 
 * 功能：
 * - POST /api/users/change-password: 修改密码
 * 
 * 两种模式：
 * 1. 用户修改自己的密码 - 需要 oldPassword + newPassword
 * 2. 管理员修改他人密码 - 需要 targetUserId + newPassword（无需旧密码）
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/services/user.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import type { AdministrativeRole } from '@/types';

/**
 * POST - 修改密码
 */
const handleChangePassword = async (
  request: NextRequest,
  { user }: ExtendedRouteContext
) => {
  try {
    const body = await request.json();
    const { oldPassword, newPassword, targetUserId, targetEmployeeId } = body;

    // 参数验证
    if (!newPassword) {
      return NextResponse.json(
        error('请输入新密码', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        error('新密码长度不能少于6位', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    const result = await userService.changePasswordWithAuth({
      userId: user.id,
      employeeId: user.employeeId || undefined,
      oldPassword,
      newPassword,
      targetUserId,
      targetEmployeeId,
      userRoles: [user.role],
      additionalRoles: (user.additionalRoles || []) as AdministrativeRole[],
    });

    if (!result.success) {
      const statusCode = result.code === 'FORBIDDEN' ? 403 :
                        result.code === 'NOT_FOUND' ? 404 :
                        result.code === 'VALIDATION_ERROR' ? 400 : 500;
      return NextResponse.json(
        error(result.error || '密码修改失败', result.code as ErrorCode),
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.data?.message || '密码修改成功',
    });
  } catch (err) {
    console.error('Change password error:', err);
    return NextResponse.json(
      error('密码修改失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
};

export const POST = protectedRoute(handleChangePassword);
