/**
 * 单条请假申请 API
 *
 * GET - 获取请假申请详情
 */

import { withRoute } from '@/lib/api';
import { leaveRepository } from '@/repositories/leave.repository';
import { ApiError } from '@/lib/api-error';

export const GET = withRoute(
  async (req, ctx) => {
    const { id } = ctx.params;
    if (!id) throw ApiError.BadRequest('缺少请假申请ID');

    const leaveRequest = await leaveRepository.findByIdV2(id as string);

    if (!leaveRequest) {
      throw ApiError.NotFound('请假申请不存在');
    }

    return leaveRequest;
  },
  { requireAuth: true }
);
