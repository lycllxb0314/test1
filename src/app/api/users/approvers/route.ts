/**
 * 审批人选项 API
 * 
 * 获取校长室领导列表（用于请假审批人选择）
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/services/user.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取审批人选项
 * 
 * 返回校长室领导列表：
 * - 校长 (principal)
 * - 书记 (secretary)
 * - 教学副校长 (academic_vice_principal)
 * - 德育副校长 (moral_vice_principal)
 * - 总务副校长 (general_vice_principal)
 */
export const GET = protectedRoute(async (
  request: NextRequest,
  { user }: ExtendedRouteContext
) => {
  try {
    const result = await userService.getApprovers();
    
    if (!result.success) {
      return NextResponse.json(
        error(result.error || '获取审批人列表失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('获取审批人列表失败:', err);
    return NextResponse.json(
      error('服务器错误', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
});
