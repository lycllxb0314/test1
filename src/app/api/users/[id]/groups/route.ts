/**
 * 用户群组 API
 * 
 * 功能：
 * - 获取用户所属群组
 * - 更新用户群组成员身份
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/services/user.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import type { GroupType } from '@/types';

/**
 * GET - 获取用户所属群组
 */
export const GET = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const params = await context.params;
    const userId = params?.id;

    if (!userId) {
      return NextResponse.json(
        error('缺少用户ID', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    const result = await userService.getUserGroups(userId);
    
    if (!result.success) {
      return NextResponse.json(
        error(result.error || '获取用户群组失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json({ groups: result.data });
  } catch (err) {
    console.error('用户群组API错误:', err);
    return NextResponse.json(
      error('服务器内部错误', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
});

/**
 * PUT - 更新用户群组成员身份
 */
export const PUT = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const params = await context.params;
    const targetUserId = params?.id;

    if (!targetUserId) {
      return NextResponse.json(
        error('缺少用户ID', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    const body = await request.json();
    const { groups } = body as { groups: GroupType[] };

    // 使用当前用户的工号进行权限检查
    const result = await userService.updateUserGroups(
      targetUserId,
      groups,
      context.user?.employeeId || ''
    );

    if (!result.success) {
      const statusCode = result.code === 'FORBIDDEN' ? 403 : 500;
      return NextResponse.json(
        error(result.error || '更新用户群组失败', result.code as ErrorCode),
        { status: statusCode }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('更新用户群组API错误:', err);
    return NextResponse.json(
      error('服务器内部错误', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
});
