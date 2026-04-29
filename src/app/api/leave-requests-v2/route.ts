/**
 * 请假申请 API v2
 *
 * GET  - 获取请假列表
 * POST - 提交请假申请
 * PUT  - 审批请假申请
 */

import { withRoute } from '@/lib/api';
import { leaveRequestService } from '@/services/leave-request.service';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { ApiError } from '@/lib/api-error';

/**
 * GET - 获取请假列表
 */
export const GET = withRoute(
  async (req, _ctx, user) => {
    if (!user) throw ApiError.Unauthorized();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');

    const client = getSupabaseClient();
    let query = client.from('leave_requests').select('*').order('created_at', { ascending: false });

    if (status === 'pending' && employeeId) {
      query = query.contains('approver_selection', [{ employeeId }]);
    } else {
      const applicantId = user.employeeId || user.id;
      query = query.eq('applicant_id', applicantId);
    }

    const { data, error: dbError } = await query;

    if (dbError) {
      throw ApiError.Internal('获取请假列表失败');
    }

    return data || [];
  },
  { requireAuth: true }
);

/**
 * POST - 提交请假申请
 */
export const POST = withRoute(
  async (req, _ctx, user) => {
    if (!user) throw ApiError.Unauthorized();

    const body = await req.json();

    const result = await leaveRequestService.submitLeaveRequest({
      applicantId: user.employeeId || user.id,
      applicantName: body.applicantName || user.name,
      type: body.type,
      startDate: body.startDate,
      endDate: body.endDate,
      duration: body.duration,
      reason: body.reason,
      attachments: body.attachments || [],
      needAdjustment: body.needAdjustment || false,
      affectedSlots: body.affectedSlots || [],
      approverSelection: body.approverSelection || [],
    });

    if (!result.success) {
      throw ApiError.BadRequest(result.error || '提交请假申请失败');
    }

    return result.data;
  },
  { requireAuth: true }
);

/**
 * PUT - 审批请假申请
 */
export const PUT = withRoute(
  async (req, _ctx, user) => {
    if (!user) throw ApiError.Unauthorized();

    const body = await req.json();
    const { id, action, rejectReason } = body;

    if (!id) {
      throw ApiError.BadRequest('缺少请假申请ID');
    }

    const result = await leaveRequestService.approve({
      leaveRequestId: id,
      action: action === 'reject' ? 'reject' : 'approve',
      rejectReason,
      user: { id: user.id, employeeId: user.employeeId || '', name: user.name || '', role: user.role || '' },
    });

    if (!result.success) {
      const code = result.code;
      if (code === 'NOT_FOUND') throw ApiError.NotFound(result.error || '请假申请不存在');
      if (code === 'FORBIDDEN') throw ApiError.Forbidden(result.error || '无权操作');
      throw ApiError.BadRequest(result.error || '审批失败');
    }

    return result.data;
  },
  { requireAuth: true }
);
