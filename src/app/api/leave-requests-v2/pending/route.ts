/**
 * 待审批请假列表 API
 * 
 * 获取当前用户需要审批的请假申请
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取待审批请假列表
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    
    // 构建查询
    let query = client
      .from('leave_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status === 'pending') {
      // 待审批：状态为pending，且当前用户在审批人列表中
      query = query.eq('status', 'pending');
    } else if (status === 'approved') {
      // 已审批：状态为approved或rejected
      query = query.in('status', ['approved', 'rejected']);
    } else if (status === 'my') {
      // 我发起的
      query = query.eq('applicant_id', user.employeeId);
    }

    const { data, error: dbError, count } = await query;

    if (dbError) {
      console.error('获取请假列表失败:', dbError);
      return NextResponse.json(error('获取请假列表失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }

    // 筛选出当前用户需要审批的申请
    let filteredData = data || [];
    if (status === 'pending') {
      filteredData = filteredData.filter(item => {
        const approverSelection = item.approver_selection || [];
        return approverSelection.some((a: any) => a.employeeId === user.employeeId);
      });
    } else if (status === 'approved') {
      // 筛选已处理的（当前用户已审批的）
      filteredData = filteredData.filter(item => {
        const approvedByList = item.approved_by_list || [];
        return approvedByList.some((a: any) => a.employeeId === user.employeeId);
      });
    }

    // 转换数据格式
    const leaveRequests = filteredData.map(mapLeaveRequest);

    return NextResponse.json({
      success: true,
      data: leaveRequests,
      total: filteredData.length,
    });

  } catch (err) {
    console.error('获取请假列表失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * 辅助函数：转换数据格式
 */
function mapLeaveRequest(data: any) {
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
