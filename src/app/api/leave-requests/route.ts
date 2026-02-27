import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取请假申请列表
 * 查询参数：
 * - applicantId: 申请人ID
 * - status: 状态
 * - type: 请假类型
 * - startDate: 开始日期
 * - endDate: 结束日期
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const applicantId = searchParams.get('applicantId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 构建查询
    let query = client
      .from('leave_requests')
      .select(`
        id,
        applicant_id,
        applicant_name,
        applicant_type,
        type,
        start_time,
        end_time,
        duration,
        reason,
        status,
        current_step,
        attachment_url,
        replacement_id,
        replacement_name,
        created_at,
        teachers (
          id,
          name,
          employee_id,
          grade_role,
          department_role
        )
      `)
      .order('created_at', { ascending: false });

    // 应用筛选条件
    if (applicantId) {
      query = query.eq('applicant_id', applicantId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (startDate) {
      query = query.gte('start_time', startDate);
    }

    if (endDate) {
      query = query.lte('end_time', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 格式化返回数据
    const formattedData = (data || []).map((leave: any) => ({
      id: leave.id,
      applicantId: leave.applicant_id,
      applicantName: leave.applicant_name,
      applicantType: leave.applicant_type,
      applicantGradeRole: leave.teachers?.grade_role || '',
      applicantDepartmentRole: leave.teachers?.department_role || '',
      type: leave.type,
      startTime: leave.start_time,
      endTime: leave.end_time,
      duration: leave.duration,
      reason: leave.reason,
      status: leave.status,
      currentStep: leave.current_step,
      attachmentUrl: leave.attachment_url,
      replacementId: leave.replacement_id,
      replacementName: leave.replacement_name,
      createdAt: leave.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Failed to fetch leave requests:', error);
    return NextResponse.json({
      success: false,
      error: '获取请假申请列表失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建请假申请
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      applicantId,
      applicantName,
      applicantType,
      type,
      startTime,
      endTime,
      duration,
      reason,
      attachmentUrl,
      replacementId,
      replacementName,
    } = body;

    const { data, error } = await client
      .from('leave_requests')
      .insert({
        applicant_id: applicantId,
        applicant_name: applicantName,
        applicant_type: applicantType || 'teacher',
        type,
        start_time: startTime,
        end_time: endTime,
        duration,
        reason,
        status: 'pending',
        current_step: 1,
        attachment_url: attachmentUrl,
        replacement_id: replacementId,
        replacement_name: replacementName,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to create leave request:', error);
    return NextResponse.json({
      success: false,
      error: '创建请假申请失败',
    }, { status: 500 });
  }
}

/**
 * PUT - 更新请假申请状态（审批）
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { id, action, approverId, approverName, comments, nextStep } = body;

    // 获取当前请假申请
    const { data: leaveRequest, error: fetchError } = await client
      .from('leave_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const updateData: any = {
      current_step: nextStep || leaveRequest.current_step,
    };

    if (action === 'approve') {
      // 如果是最后一步审批，更新为已通过
      updateData.status = 'approved';
    } else if (action === 'reject') {
      updateData.status = 'rejected';
    }

    const { data, error } = await client
      .from('leave_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 记录审批历史
    await client
      .from('leave_approval_records')
      .insert({
        leave_request_id: id,
        approver_id: approverId,
        approver_name: approverName,
        action,
        comments,
        created_at: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to update leave request:', error);
    return NextResponse.json({
      success: false,
      error: '更新请假申请失败',
    }, { status: 500 });
  }
}
