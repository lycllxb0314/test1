/**
 * 请假审批 API
 *
 * POST - 审批请假申请
 */

import { withRoute } from '@/lib/api';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { ApiError } from '@/lib/api-error';
import type { LeaveRequestService } from '@/services/leave-request.service';

export const POST = withRoute(
  async (req, ctx, user) => {
    const { id } = ctx.params;
    if (!id) throw ApiError.BadRequest('缺少请假申请ID');

    const body = await req.json();
    const { action, rejectReason } = body;

    const leaveRequestService = getService<LeaveRequestService>(SERVICE_IDENTIFIERS.LeaveRequestService);

    const result = await leaveRequestService.approve({
      leaveRequestId: id as string,
      action,
      rejectReason,
      user: {
        id: user.id,
        employeeId: user.employeeId || '',
        name: user.name,
        role: user.role,
      },
    });

    if (!result.success) {
      const code = result.code;
      if (code === 'NOT_FOUND') throw ApiError.NotFound(result.error || '请假申请不存在');
      if (code === 'FORBIDDEN') throw ApiError.Forbidden(result.error || '无权审批');
      throw ApiError.BadRequest(result.error || '审批失败');
    }

    return result.data;
  },
  { requireAuth: true }
);
