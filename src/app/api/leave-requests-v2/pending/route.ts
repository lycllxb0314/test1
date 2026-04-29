/**
 * 待审批请假列表 API
 *
 * GET - 获取当前用户需要审批的请假申请
 */

import { withRoute } from '@/lib/api';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { ApiError } from '@/lib/api-error';
import type { LeaveRequestService } from '@/services/leave-request.service';
import type { LeaveRequestRow } from '@/repositories/leave.repository';

function mapLeaveRequest(data: LeaveRequestRow) {
  return {
    id: data.id,
    applicantId: data.applicant_id,
    applicantName: data.applicant_name,
    applicantType: data.applicant_type,
    applicantGrade: data.applicant_grade,
    type: data.type,
    startDate: data.start_date,
    endDate: data.end_date,
    startTime: data.start_time,
    endTime: data.end_time,
    duration: data.duration,
    durationUnit: data.duration_unit,
    reason: data.reason,
    attachments: data.attachments || [],
    needAdjustment: data.need_adjustment,
    affectedSlots: data.affected_slots || [],
    approverSelection: data.approver_selection || [],
    status: data.status,
    currentStep: data.current_step,
    approvedByList: data.approved_by_list || [],
    rejectReason: data.reject_reason,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    submittedAt: data.submitted_at,
  };
}

export const GET = withRoute(
  async (req, _ctx, user) => {
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') || 'pending') as 'pending' | 'approved' | 'my';

    const leaveRequestService = getService<LeaveRequestService>(SERVICE_IDENTIFIERS.LeaveRequestService);

    const result = await leaveRequestService.getPendingList({
      employeeId: user.employeeId || '',
      status,
    });

    if (!result.success) {
      throw ApiError.Internal(result.error || '获取请假列表失败');
    }

    const leaveRequests = (result.data || []).map(mapLeaveRequest);

    return {
      data: leaveRequests,
      total: leaveRequests.length,
    };
  },
  { requireAuth: true }
);
