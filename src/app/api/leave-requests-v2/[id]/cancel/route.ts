/**
 * 撤销请假申请 API
 * 
 * 仅限申请人撤销自己的请假申请
 * 只能撤销 pending 状态的申请
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { success, error, ErrorCode } from '@/lib/api';
import { getService } from '@/lib/di';
import { SERVICE_IDENTIFIERS } from '@/lib/di/container';
import type { LeaveRequestService } from '@/services/leave-request.service';

/**
 * POST - 撤销请假申请
 */
export const POST = protectedRoute(async (
  request: NextRequest, 
  context: ExtendedRouteContext
) => {
  try {
    const params = await context.params;
    
    if (!params?.id) {
      return NextResponse.json(error('缺少请假申请ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }

    const { user } = context;

    // 通过 DI 获取 Service
    const leaveRequestService = getService<LeaveRequestService>(SERVICE_IDENTIFIERS.LeaveRequestService);

    const result = await leaveRequestService.cancel({
      leaveRequestId: params.id as string,
      user: {
        id: user.id,
        employeeId: user.employeeId || '',
        name: user.name,
        role: user.role,
      },
    });

    if (!result.success) {
      const statusCode = result.code === 'NOT_FOUND' ? 404 :
                         result.code === 'FORBIDDEN' ? 403 :
                         result.code === 'VALIDATION_ERROR' ? 400 : 500;
      return NextResponse.json(error(result.error || '操作失败', result.code as ErrorCode || ErrorCode.INTERNAL_ERROR), { status: statusCode });
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('撤销失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
