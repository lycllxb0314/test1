/**
 * 请假申请 API v2
 * 
 * 功能：
 * - 提交请假申请（含调课信息、审批人选择）
 * - 获取请假列表
 * - 取消请假申请
 * - 审批请假申请
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest } from 'next/server';
import { leaveRequestService } from '@/services/leave-request.service';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/api';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// ==================== GET - 获取请假列表 ====================

export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');
    
    const client = getSupabaseClient();
    let query = client.from('leave_requests').select('*').order('created_at', { ascending: false });
    
    if (status === 'pending' && employeeId) {
      // 获取待审批列表
      query = query.contains('approver_selection', [{ employeeId }]);
    } else {
      // 获取我的请假列表 - 使用 employeeId 匹配（applicant_id 存储的是工号）
      const applicantId = user.employeeId || user.id;
      query = query.eq('applicant_id', applicantId);
    }
    
    const { data, error: dbError } = await query;
    
    if (dbError) {
      return fail('获取请假列表失败');
    }

    return ok(data || []);
  } catch (err) {
    console.error('获取请假列表失败:', err);
    return serverError('获取请假列表失败');
  }
});

// ==================== POST - 提交请假申请 ====================

export const POST = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    
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
      return fail(result.error || '提交请假申请失败');
    }

    return ok(result.data);
  } catch (err) {
    console.error('提交请假申请失败:', err);
    return serverError('提交请假申请失败');
  }
});

// ==================== PUT - 审批请假申请 ====================

export const PUT = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    const { id, action, rejectReason } = body;

    if (!id) {
      return fail('缺少请假申请ID');
    }

    const result = await leaveRequestService.approve({
      leaveRequestId: id,
      action: action === 'reject' ? 'reject' : 'approve',
      rejectReason,
      user: { id: user.id, employeeId: user.employeeId || '', name: user.name || '', role: user.role || '' },
    });

    if (!result.success) {
      return fail(result.error || '审批失败');
    }

    return ok(result.data);
  } catch (err) {
    console.error('审批请假申请失败:', err);
    return serverError('审批请假申请失败');
  }
});
