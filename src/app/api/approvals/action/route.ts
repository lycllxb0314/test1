/**
 * 审批操作 API
 *
 * POST - 审批操作（通过/拒绝）
 */

import { withRoute } from '@/lib/api';
import { approvalService } from '@/services/approval.service';
import { ApiError } from '@/lib/api-error';

export const POST = withRoute(
  async (req, _ctx, user) => {
    if (!user) throw ApiError.Unauthorized();

    const body = await req.json();
    const { approvalId, action, comment } = body;

    if (!approvalId || !action) {
      throw ApiError.BadRequest('缺少必填字段');
    }

    if (!['approve', 'reject'].includes(action)) {
      throw ApiError.BadRequest('无效的审批操作');
    }

    const result = await approvalService.processApproval({
      approvalId,
      action,
      comment,
      processorId: user.id,
      processorName: user.name,
    });

    if (!result.success) {
      throw ApiError.BadRequest(result.error || '审批操作失败');
    }

    return result.data;
  },
  { requireAuth: true }
);
