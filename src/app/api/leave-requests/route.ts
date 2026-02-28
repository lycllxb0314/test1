/**
 * 请假申请 API
 * 
 * 使用统一的路由处理模式和集中的Mock数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { 
  getMockLeaveRequests,
  MOCK_LEAVE_REQUESTS,
} from '@/lib/mock/academic.mock';
import { 
  success, 
  error, 
  parseQueryParams, 
  createPagination,
  ErrorCode 
} from '@/lib/api-route-utils';
import type { LeaveRequest } from '@/types';

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
  const params = parseQueryParams(request);
  
  try {
    const client = getSupabaseClient();
    
    // 构建查询
    let query = client
      .from('leave_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    // 应用筛选
    if (params.applicantId) {
      query = query.eq('applicant_id', params.applicantId);
    }
    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.type) {
      query = query.eq('type', params.type);
    }
    if (params.startDate) {
      query = query.gte('start_time', params.startDate);
    }
    if (params.endDate) {
      query = query.lte('end_time', params.endDate);
    }
    
    // 分页
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    query = query.range(from, to);
    
    const { data, error: dbError, count } = await query;
    
    if (dbError) {
      console.log('Database query failed, using mock data:', dbError.message);
      
      // 使用Mock数据
      const mockData = getMockLeaveRequests({
        applicantId: params.applicantId as string,
        status: params.status as string,
        type: params.type as string,
      });
      
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      
      return NextResponse.json({
        success: true,
        data: mockData.slice(start, end),
        pagination: createPagination(mockData.length, page, pageSize),
        source: 'mock',
      });
    }
    
    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: createPagination(count || 0, page, pageSize),
      source: 'database',
    });
  } catch (err) {
    console.error('Failed to fetch leave requests:', err);
    
    // 使用Mock数据作为fallback
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const mockData = getMockLeaveRequests({
      applicantId: params.applicantId as string,
      status: params.status as string,
      type: params.type as string,
    });
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    return NextResponse.json({
      success: true,
      data: mockData.slice(start, end),
      pagination: createPagination(mockData.length, page, pageSize),
      source: 'mock',
    });
  }
}

/**
 * POST - 创建请假申请
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();
    
    const { data, error: dbError } = await client
      .from('leave_requests')
      .insert({
        applicant_id: body.applicantId,
        applicant_name: body.applicantName,
        applicant_type: body.applicantType || 'teacher',
        applicant_grade_role: body.applicantGradeRole,
        applicant_department_role: body.applicantDepartmentRole,
        type: body.type,
        start_time: body.startTime,
        end_time: body.endTime,
        duration: body.duration,
        reason: body.reason,
        status: 'pending',
        current_step: 1,
        attachment_url: body.attachmentUrl,
        replacement_id: body.replacementId,
        replacement_name: body.replacementName,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('Database insert error:', dbError);
      
      // 返回mock成功响应
      const newLeaveRequest = {
        id: `lr_${Date.now()}`,
        applicantId: body.applicantId,
        applicantName: body.applicantName,
        applicantType: body.applicantType || 'teacher',
        type: body.type,
        startTime: body.startTime,
        endTime: body.endTime,
        duration: body.duration,
        reason: body.reason,
        status: 'pending',
        currentStep: 1,
        createdAt: new Date().toISOString(),
      };
      
      return NextResponse.json(success(newLeaveRequest, 'mock'));
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        applicantId: data.applicant_id,
        applicantName: data.applicant_name,
        applicantType: data.applicant_type,
        type: data.type,
        startTime: data.start_time,
        endTime: data.end_time,
        duration: data.duration,
        reason: data.reason,
        status: data.status,
        currentStep: data.current_step,
        createdAt: data.created_at,
      },
      source: 'database',
    });
  } catch (err) {
    console.error('Failed to create leave request:', err);
    return NextResponse.json(
      error('创建请假申请失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * PUT - 更新请假申请状态（审批）
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();
    const { id, action, nextStep, leaveDetails } = body;
    
    let updateData: Record<string, unknown> = { 
      current_step: nextStep,
      updated_at: new Date().toISOString(),
    };
    
    if (action === 'approve') {
      updateData.status = 'approved';
    } else if (action === 'reject') {
      updateData.status = 'rejected';
    }
    
    const { error: dbError } = await client
      .from('leave_requests')
      .update(updateData)
      .eq('id', id);
    
    if (dbError) {
      console.error('Database update error:', dbError);
      return NextResponse.json(success({ id, status: updateData.status }, 'mock'));
    }
    
    return NextResponse.json({
      success: true,
      data: { id, status: updateData.status },
      message: action === 'approve' ? '审批通过' : '已拒绝',
      source: 'database',
    });
  } catch (err) {
    console.error('Failed to update leave request:', err);
    return NextResponse.json(
      error('更新请假申请失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
