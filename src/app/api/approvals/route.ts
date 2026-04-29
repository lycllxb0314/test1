/**
 * 审批列表 API
 *
 * GET - 获取待审批列表
 * POST - 创建审批申请
 */

import { withRoute } from '@/lib/api';
import { approvalService } from '@/services/approval.service';
import { approvalRepository } from '@/repositories/approval.repository';
import { ApiError } from '@/lib/api-error';
import type { Approval } from '@/types/approval';

/**
 * GET - 获取审批列表
 */
export const GET = withRoute(
  async (req, _ctx, user) => {
    if (!user) throw ApiError.Unauthorized();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const type = searchParams.get('type') || undefined;

    let approvals: Approval[] = [];

    // 如果是按状态查询待处理的审批
    if (status === 'pending') {
      const result = await approvalRepository.findPendingApprovals(user.id);
      approvals = (result || []) as unknown as Approval[];
    } else {
      // 查询用户相关的审批
      const result = await approvalRepository.findByApproverId(user.id);
      approvals = (result || []) as unknown as Approval[];
    }

    // 按类型过滤
    if (type) {
      approvals = approvals.filter(a => a.type === type);
    }

    // 按状态过滤
    if (status && status !== 'pending') {
      approvals = approvals.filter(a => a.status === status);
    }

    return approvals;
  },
  { requireAuth: true }
);

/**
 * POST - 创建审批申请
 */
export const POST = withRoute(
  async (req, _ctx, user) => {
    if (!user) throw ApiError.Unauthorized();

    const body = await req.json();
    const { type, title, description, metadata, approverIds } = body;

    if (!type || !title || !approverIds) {
      throw ApiError.BadRequest('缺少必填字段');
    }

    const result = await approvalService.createApproval({
      type,
      title,
      description,
      metadata,
      applicantId: user.id,
      applicantName: user.name,
      approverIds,
    });

    if (!result.success) {
      throw ApiError.BadRequest(result.error || '创建审批失败');
    }

    return result.data;
  },
  { requireAuth: true }
);
