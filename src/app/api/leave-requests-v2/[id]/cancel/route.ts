/**
 * 撤销请假申请 API
 *
 * POST - 撤销请假申请（仅限申请人撤销 pending 状态）
 */

import { withRoute } from '@/lib/api';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { ApiError } from '@/lib/api-error';
import type { LeaveRequestService } from '@/services/leave-request.service';

export const POST = withRoute(
  async (req, ctx, user) => {
    const { id } = ctx.params;
    if (!id) throw ApiError.BadRequest('缺少请假申请ID');

    const leaveRequestService = getService<LeaveRequestService>(SERVICE_IDENTIFIERS.LeaveRequestService);

    const result = await leaveRequestService.cancel({
      leaveRequestId: id as string,
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
      if (code === 'FORBIDDEN') throw ApiError.Forbidden(result.error || '无权撤销');
      throw ApiError.BadRequest(result.error || '撤销失败');
    }

    return result.data;
  },
  { requireAuth: true }
);
