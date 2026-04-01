/**
 * 单条请假申请 API
 * 
 * GET: 获取请假申请详情
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { success, error, ErrorCode } from '@/lib/api';
import { leaveRepository } from '@/repositories/leave.repository';

/**
 * GET - 获取请假申请详情
 */
export const GET = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少请假申请ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }

    const leaveRequest = await leaveRepository.findByIdV2(id as string);
    
    if (!leaveRequest) {
      return NextResponse.json(error('请假申请不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }

    return NextResponse.json(success(leaveRequest, 'database'));
  } catch (err) {
    console.error('获取请假详情失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
