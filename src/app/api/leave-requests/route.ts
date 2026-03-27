/**
 * 请假申请 API
 * 
 * 数据源：Supabase 数据库（唯一数据源）
 * v3.0: 移除Mock fallback，数据库失败时返回错误响应
 * 
 * 流程：
 * 1. 创建 leave_requests 记录
 * 2. 创建 approval_instances 审批实例
 * 3. 发送消息给审批人
 */

import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { ok, fail, serverError, paginated, getQueryParams, notFound } from '@/lib/api';

/**
 * GET - 获取请假申请列表
 * 
 * 查询参数：
 * - applicantId: 申请人ID
 * - status: 状态筛选
 * - type: 请假类型
 * - startDate: 开始日期
 * - endDate: 结束日期
 * - page: 页码
 * - pageSize: 每页数量
 */
export async function GET(request: NextRequest) {
  const params = getQueryParams(request);
  const { filters, page, pageSize } = params;
  
  try {
    const client = getSupabaseClient();
    
    // 构建查询
    let query = client
      .from('leave_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    // 应用筛选
    if (filters.applicantId) {
      query = query.eq('applicant_id', filters.applicantId);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.startDate) {
      query = query.gte('start_time', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('end_time', filters.endDate);
    }
    
    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    query = query.range(from, to);
    
    const { data, error: dbError, count } = await query;
    
    if (dbError) {
      return fail('数据库查询失败: ' + dbError.message);
    }
    
    return paginated(data || [], count || 0, page, pageSize);
  } catch (err) {
    console.error('Failed to fetch leave requests:', err);
    return serverError('获取请假申请列表失败');
  }
}

/**
 * POST - 创建请假申请
 * 
 * 流程：
 * 1. 创建 leave_requests 记录
 * 2. 创建 approval_instances 审批实例
 * 3. 发送消息给审批人
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();
    
    // 1. 创建请假申请记录
    const leaveRequestData = {
      applicant_id: body.applicantId,
      applicant_name: body.applicantName,
      applicant_type: body.applicantType || 'teacher',
      applicant_grade: body.applicantGrade,
      type: body.type,
      start_date: body.startDate,
      end_date: body.endDate,
      start_time: body.startTime,
      end_time: body.endTime,
      duration: body.duration,
      duration_unit: body.durationUnit || 'day',
      reason: body.reason,
      attachments: body.attachments,
      need_adjustment: body.needAdjustment || false,
      affected_slots: body.affectedSlots,
      status: 'pending',
      current_step: 1,
      approver_selection: body.approverSelection,
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    
    const { data: leaveRequest, error: dbError } = await client
      .from('leave_requests')
      .insert(leaveRequestData)
      .select()
      .single();
    
    if (dbError) {
      console.error('创建请假申请失败:', dbError);
      return fail('创建请假申请失败: ' + dbError.message);
    }
    
    // 2. 创建审批实例
    const approverSelection = body.approverSelection || [];
    const signType = approverSelection[0]?.signType || 'countersign'; // 会签/或签，默认会签
    
    // 获取申请人用户信息（获取UUID）
    const { data: applicantUser } = await client
      .from('users')
      .select('id, department')
      .eq('employee_id', body.applicantId)
      .single();
    
    const approvalInstance = {
      flow_id: null as string | null, // 暂不关联固定流程
      flow_name: `${body.type}审批`,
      business_type: 'leave_request',
      business_id: leaveRequest.id,
      title: `${body.applicantName}的${body.type}申请`,
      applicant_id: applicantUser?.id || null, // 使用用户UUID
      applicant_name: body.applicantName,
      applicant_department: applicantUser?.department || '',
      current_node_order: 1,
      status: 'pending',
      submit_at: new Date().toISOString(),
      metadata: {
        leaveType: body.type,
        startDate: body.startDate,
        endDate: body.endDate,
        duration: body.duration,
        reason: body.reason,
        approvers: approverSelection,
        signType: signType,
        applicant_employee_id: body.applicantId, // 保存工号
        // 添加调课相关信息
        needAdjustment: body.needAdjustment || false,
        affectedSlots: body.affectedSlots || [],
        applicantGrade: body.applicantGrade || null,
      },
      created_at: new Date().toISOString(),
    };
    
    const { data: approvalInstanceResult, error: approvalError } = await client
      .from('approval_instances')
      .insert(approvalInstance)
      .select()
      .single();
    
    if (approvalError) {
      console.error('创建审批实例失败:', approvalError);
      // 审批实例创建失败不影响请假申请，继续执行
    }
    
    // 3. 发送消息给审批人
    const messagePromises = approverSelection.map(async (approver: { employeeId: string; userName: string; role: string }) => {
      // 获取审批人的用户ID
      const { data: approverUser } = await client
        .from('users')
        .select('id')
        .eq('employee_id', approver.employeeId)
        .single();
      
      if (!approverUser) {
        console.log(`未找到审批人: ${approver.employeeId}`);
        return null;
      }
      
      // 创建消息 - 使用UUID
      return client
        .from('messages')
        .insert({
          title: `【审批待办】${body.applicantName}的${body.type}申请`,
          content: `${body.applicantName}提交的${body.type}申请需要您审批。请假时间：${body.startDate || ''} 至 ${body.endDate || ''}，共${body.duration}${body.durationUnit === 'day' ? '天' : '小时'}。原因：${body.reason}`,
          type: 'leave_approval',
          priority: 'high',
          sender_id: applicantUser?.id || null, // 使用申请人UUID
          sender_name: body.applicantName,
          recipient_id: approverUser.id, // 审批人UUID
          recipient_type: 'individual',
          metadata: {
            instance_id: approvalInstanceResult?.id,
            leave_request_id: leaveRequest.id,
            approver_employee_id: approver.employeeId,
          },
          created_at: new Date().toISOString(),
        });
    });
    
    await Promise.all(messagePromises.filter(Boolean));
    
    return ok({
      id: leaveRequest.id,
      applicantId: leaveRequest.applicant_id,
      applicantName: leaveRequest.applicant_name,
      type: leaveRequest.type,
      startDate: leaveRequest.start_date,
      endDate: leaveRequest.end_date,
      duration: leaveRequest.duration,
      reason: leaveRequest.reason,
      status: leaveRequest.status,
      approvers: approverSelection,
      approvalInstanceId: approvalInstanceResult?.id,
    });
  } catch (err) {
    console.error('Failed to create leave request:', err);
    return serverError('创建请假申请失败');
  }
}

/**
 * PUT - 更新请假申请状态（审批）
 * 
 * 流程：
 * 1. 更新 leave_requests 状态
 * 2. 更新 approval_instances 状态
 * 3. 如果需要调课，发送消息给年段长
 * 4. 通知申请人审批结果
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();
    const { id, action, approverId, approverName, opinion } = body;
    
    // 1. 获取请假申请详情
    const { data: leaveRequest, error: fetchError } = await client
      .from('leave_requests')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !leaveRequest) {
      return notFound('请假申请');
    }
    
    // 2. 更新请假申请状态
    let updateData: Record<string, unknown> = { 
      updated_at: new Date().toISOString(),
    };
    
    if (action === 'approve') {
      updateData.status = 'approved';
      updateData.approved_by = approverId;
      updateData.approved_at = new Date().toISOString();
    } else if (action === 'reject') {
      updateData.status = 'rejected';
      updateData.reject_reason = opinion || '';
    }
    
    const { error: dbError } = await client
      .from('leave_requests')
      .update(updateData)
      .eq('id', id);
    
    if (dbError) {
      console.error('更新请假申请失败:', dbError);
      return fail('更新请假申请失败');
    }
    
    // 3. 更新审批实例状态
    await client
      .from('approval_instances')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        end_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', id)
      .eq('business_type', 'leave_request');
    
    // 4. 通知申请人审批结果
    const { data: applicantUser } = await client
      .from('users')
      .select('id')
      .eq('employee_id', leaveRequest.applicant_id)
      .single();
    
    // 获取审批人UUID
    const { data: approverUser } = await client
      .from('users')
      .select('id')
      .eq('employee_id', approverId)
      .single();
    
    if (applicantUser) {
      await client
        .from('messages')
        .insert({
          title: action === 'approve' 
            ? `【审批通过】您的${leaveRequest.type}申请已通过` 
            : `【审批拒绝】您的${leaveRequest.type}申请被拒绝`,
          content: action === 'approve'
            ? `${approverName}已批准您的${leaveRequest.type}申请。请假时间：${leaveRequest.start_date || ''} 至 ${leaveRequest.end_date || ''}。${leaveRequest.need_adjustment ? '请等待年段长安排调课。' : ''}`
            : `${approverName}拒绝了您的${leaveRequest.type}申请。拒绝原因：${opinion || '无'}`,
          type: action === 'approve' ? 'leave_approved' : 'leave_rejected',
          priority: 'high',
          sender_id: approverUser?.id || null,
          sender_name: approverName,
          recipient_id: applicantUser.id,
          recipient_type: 'individual',
          metadata: {
            leave_request_id: id,
          },
          created_at: new Date().toISOString(),
        });
    }
    
    // 5. 如果需要调课，通知年段长
    if (action === 'approve' && leaveRequest.need_adjustment) {
      // 查找对应年级的年段长
      const { data: gradeLeaders } = await client
        .from('users')
        .select('id, employee_id, name, grade_role')
        .eq('role', 'grade_leader');
      
      // 找到负责该教师所在年级的年段长
      const gradeLeader = gradeLeaders?.find((leader: { grade_role: string | null }) => 
        leader.grade_role && leaveRequest.applicant_grade && 
        leader.grade_role.includes(leaveRequest.applicant_grade)
      );
      
      if (gradeLeader) {
        await client
          .from('messages')
          .insert({
            title: `【调课待办】${leaveRequest.applicant_name}请假需要调课`,
            content: `${leaveRequest.applicant_name}的${leaveRequest.type}申请已通过，需要您安排调课。请假时间：${leaveRequest.start_date || ''} 至 ${leaveRequest.end_date || ''}。请及时处理。`,
            type: 'course_adjustment',
            priority: 'high',
            sender_id: null, // 系统消息
            sender_name: '系统',
            recipient_id: gradeLeader.id,
            recipient_type: 'individual',
            metadata: {
              leave_request_id: id,
              applicant_id: leaveRequest.applicant_id,
              applicant_name: leaveRequest.applicant_name,
              start_date: leaveRequest.start_date,
              end_date: leaveRequest.end_date,
            },
            created_at: new Date().toISOString(),
          });
      }
    }
    
    return ok({ 
      id, 
      status: action === 'approve' ? 'approved' : 'rejected',
    });
  } catch (err) {
    console.error('Failed to update leave request:', err);
    return serverError('更新请假申请失败');
  }
}
