/**
 * 待审批请假列表 API
 * 
 * 获取当前用户需要审批的请假申请
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { success, error, ErrorCode } from '@/lib/api';
import { getService } from '@/lib/di';
import { SERVICE_IDENTIFIERS } from '@/lib/di/container';
import type { LeaveRequestService } from '@/services/leave-request.service';
import type { LeaveRequestRow } from '@/repositories/leave.repository';

/**
 * GET - 获取待审批请假列表
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') || 'pending') as 'pending' | 'approved' | 'my';

    // 通过 DI 获取 Service
    const leaveRequestService = getService<LeaveRequestService>(SERVICE_IDENTIFIERS.LeaveRequestService);

    const result = await leaveRequestService.getPendingList({
      employeeId: user.employeeId || '',
      status,
    });

    if (!result.success) {
      return NextResponse.json(error(result.error || '获取请假列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }

    // 转换数据格式
    const leaveRequests = (result.data || []).map(mapLeaveRequest);

    return NextResponse.json({
      success: true,
      data: leaveRequests,
      total: leaveRequests.length,
    });
  } catch (err) {
    console.error('获取请假列表失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * 辅助函数：转换数据格式
 */
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
