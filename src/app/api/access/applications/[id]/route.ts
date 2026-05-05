/**
 * 门禁申请审批 API
 * PUT - 审批/驳回申请
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, ExtendedRouteContext } from '@/lib/auth/route-protection';
import { accessControlService } from '@/services/access-control.service';
import { success, error, ErrorCode } from '@/lib/api';

export const PUT = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  const params = await context.params;
  const id = params?.id;
  if (!id) {
    return NextResponse.json(error('缺少申请ID', ErrorCode.BAD_REQUEST), { status: 400 });
  }
  const body = await request.json();
  const { action, reason } = body;

  const userId = request.headers.get('x-user-id') || 'unknown';
  const userName = request.headers.get('x-user-name') || '未知';

  let result;

  if (action === 'approve') {
    result = await accessControlService.approveApplication(id, userId, userName);
  } else if (action === 'reject') {
    if (!reason) {
      return NextResponse.json(error('驳回原因不能为空', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    result = await accessControlService.rejectApplication(id, reason);
  } else {
    return NextResponse.json(error('无效的操作', ErrorCode.BAD_REQUEST), { status: 400 });
  }

  if (!result.success) {
    return NextResponse.json(error(result.error || '操作失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }

  return NextResponse.json(success(result.data));
});
