/**
 * 请假申请 API v2
 * 
 * 功能：
 * - 提交请假申请（含调课信息、审批人选择）
 * - 获取请假列表
 * - 取消请假申请
 * - 审批请假申请
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { success, error, ErrorCode, parseQueryParams, createPagination } from '@/lib/api-route-utils';

// ==================== GET - 获取请假列表 ====================

export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const params = parseQueryParams(request);
    
    // 构建查询
    let query = client
      .from('leave_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    // 筛选条件
    if (params.applicantId) {
      query = query.eq('applicant_id', params.applicantId);
    } else if (params.my) {
      // 我的请假：使用当前用户的工号
      query = query.eq('applicant_id', user.employeeId);
    }
    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.type) {
      query = query.eq('type', params.type);
    }
    if (params.startDate) {
      query = query.gte('start_date', params.startDate);
    }
    if (params.endDate) {
      query = query.lte('end_date', params.endDate);
    }
    
    // 分页
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    query = query.range(from, to);
    
    const { data, error: dbError, count } = await query;
    
    if (dbError) {
      console.error('获取请假列表失败:', dbError);
      return NextResponse.json(error('获取请假列表失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 转换数据格式
    const leaveRequests = (data || []).map(mapLeaveRequest);
    
    return NextResponse.json({
      ...success(leaveRequests, 'database'),
      pagination: createPagination(count || 0, page, pageSize),
    });
    
  } catch (err) {
    console.error('获取请假列表失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

// ==================== POST - 提交请假申请 ====================

export const POST = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    // 验证必填字段
    if (!body.type || !body.startDate || !body.endDate || !body.reason) {
      return NextResponse.json(error('缺少必填字段', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 获取申请人信息
    const applicantId = body.applicantId || user.employeeId;
    const applicantName = body.applicantName || user.name;
    
    // 获取申请人年级（如果是教师）
    let applicantGrade = null;
    if (user.role === 'head_teacher' || user.role === 'subject_teacher') {
      const { data: teacherData } = await client
        .from('teachers')
        .select('id')
        .eq('employee_id', applicantId)
        .single();
      
      if (teacherData) {
        const { data: classData } = await client
          .from('classes')
          .select('grade')
          .or(`head_teacher_id.eq.${teacherData.id},sub_teacher_id.eq.${teacherData.id}`)
          .limit(1)
          .single();
        
        applicantGrade = classData?.grade;
      }
    }
    
    // 创建请假申请
    const { data, error: dbError } = await client
      .from('leave_requests')
      .insert({
        applicant_id: applicantId,
        applicant_name: applicantName,
        applicant_type: body.applicantType || 'teacher',
        applicant_grade: applicantGrade,
        type: body.type,
        start_date: body.startDate,
        end_date: body.endDate,
        start_time: body.startTime || null,
        end_time: body.endTime || null,
        duration: body.duration || calculateDuration(body.startDate, body.endDate),
        duration_unit: body.durationUnit || 'day',
        reason: body.reason,
        attachments: body.attachments || [],
        need_adjustment: body.needAdjustment || false,
        affected_slots: body.affectedSlots || [],
        approver_selection: body.approverSelection || [],
        status: 'pending',
        current_step: 1,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('创建请假申请失败:', dbError);
      return NextResponse.json(error('创建请假申请失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 2. 如果需要调课，创建调课记录
    if (body.needAdjustment && body.affectedSlots?.length > 0) {
      const adjustmentRecords = body.affectedSlots.map((slot: any) => ({
        leave_request_id: data.id,
        applicant_id: applicantId,
        applicant_name: applicantName,
        adjust_type: 'substitute',  // 默认代课
        status: 'pending',
        effective_week: getWeekMonday(new Date(slot.weekStartDate || body.startDate)),
        class_id: slot.classId,
        class_name: slot.className,
        grade: slot.grade,
        week_day: slot.weekDay,
        period_index: slot.periodIndex,
        subject: slot.subject,
        original_slot: {
          teacherId: slot.teacherId,
          teacherName: slot.teacherName,
          employeeId: slot.employeeId,
        },
        reason: body.reason,
        reason_type: body.type,
      }));
      
      const { error: adjustError } = await client
        .from('course_adjustments')
        .insert(adjustmentRecords);
      
      if (adjustError) {
        console.error('创建调课记录失败:', adjustError);
        // 不影响请假申请创建
      }
    }
    
    // 3. 发送审批通知
    if (body.approverSelection?.length > 0) {
      // 创建消息通知审批人
      const notifications = body.approverSelection.map((approver: any) => ({
        title: `请假审批：${applicantName}`,
        content: `${applicantName}申请${body.type}（${body.startDate}至${body.endDate}），请审批。`,
        event: 'leave_approval',
        priority: 'high',
        sender_id: applicantId,
        sender_name: applicantName,
        sender_role: user.role,
        recipient_id: approver.employeeId,
        metadata: {
          leaveRequestId: data.id,
          leaveType: body.type,
          signType: approver.signType,
        },
      }));
      
      const { error: msgError } = await client
        .from('messages')
        .insert(notifications);
      
      if (msgError) {
        console.error('发送审批通知失败:', msgError);
      }
    }
    
    return NextResponse.json(success(mapLeaveRequest(data), 'database'));
    
  } catch (err) {
    console.error('提交请假申请失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

// ==================== 辅助函数 ====================

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
    workflowInstanceId: data.workflow_instance_id,
    status: data.status,
    currentStep: data.current_step,
    approverSelection: data.approver_selection || [],
    approvedBy: data.approved_by,
    approvedAt: data.approved_at,
    rejectReason: data.reject_reason,
    adjustmentStatus: data.adjustment_status,
    adjustedBy: data.adjusted_by,
    adjustedAt: data.adjusted_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    submittedAt: data.submitted_at,
  };
}

function calculateDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
}

function getWeekMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}
