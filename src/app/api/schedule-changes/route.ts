/**
 * 调课管理 API
 * 
 * 数据源：Supabase 数据库（唯一数据源）
 * v3.0: 移除Mock fallback，数据库失败时返回错误响应
 * 
 * 功能：
 * 1. 获取调课记录列表
 * 2. 从请假记录创建调课记录（内部调用）
 * 3. 年段长安排代课/调换
 * 4. 调课完成后同步到各系统
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, parseQueryParams, ErrorCode } from '@/lib/api-route-utils';

/**
 * GET - 获取调课记录
 * 
 * 查询参数：
 * - action: 操作类型（pending/history）
 * - status: 状态筛选
 * - grade: 年级筛选
 * - teacherId: 教师ID筛选
 */
export async function GET(request: NextRequest) {
  const params = parseQueryParams(request);
  
  try {
    const client = getSupabaseClient();
    
    // 构建数据库查询
    let query = client
      .from('schedule_changes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    // 应用筛选
    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.grade) {
      query = query.eq('applicant_grade', params.grade);
    }
    if (params.teacherId) {
      query = query.eq('applicant_id', params.teacherId);
    }
    
    const { data, error: dbError, count } = await query;
    
    if (dbError) {
      return NextResponse.json(
        error('数据库查询失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }
    
    // 处理特殊操作
    if (params.action === 'pending') {
      const pendingRecords = (data || []).filter(r => r.status === 'pending');
      return NextResponse.json(success(pendingRecords, 'database'));
    }
    
    return NextResponse.json({
      ...success(data || [], 'database'),
      pagination: { total: count || 0, page: params.page || 1, pageSize: params.pageSize || 20, totalPages: Math.ceil((count || 0) / (params.pageSize || 20)) },
    });
  } catch (err) {
    console.error('Failed to fetch schedule changes:', err);
    return NextResponse.json(
      error('获取调课记录失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * POST - 创建调课记录
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();
    
    const { data, error: dbError } = await client
      .from('schedule_changes')
      .insert({
        leave_request_id: body.leaveRequestId,
        applicant_id: body.applicantId,
        applicant_name: body.applicantName,
        applicant_subject: body.applicantSubject,
        applicant_grade: body.applicantGrade,
        leave_type: body.leaveType,
        leave_start_date: body.leaveStartDate,
        leave_end_date: body.leaveEndDate,
        leave_reason: body.leaveReason,
        original_class_id: body.originalClassId,
        original_class_name: body.originalClassName,
        original_subject: body.originalSubject,
        original_week_day: body.originalWeekDay,
        original_period_index: body.originalPeriodIndex,
        original_period_name: body.originalPeriodName,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (dbError) {
      return NextResponse.json(
        error('创建调课记录失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }
    
    return NextResponse.json(success(data, 'database'));
  } catch (err) {
    console.error('Failed to create schedule change:', err);
    return NextResponse.json(
      error('创建调课记录失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * PUT - 更新调课记录（安排代课/调换）
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, ...updates } = body;
    const client = getSupabaseClient();
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (action === 'substitute') {
      updateData.status = 'completed';
      updateData.adjust_type = 'substitute';
      updateData.substitute_teacher_id = updates.substituteTeacherId;
      updateData.substitute_teacher_name = updates.substituteTeacherName;
      updateData.handler_id = updates.handlerId;
      updateData.handler_name = updates.handlerName;
      updateData.handled_at = new Date().toISOString();
      updateData.remark = updates.remark;
    } else if (action === 'swap') {
      updateData.status = 'processing';
      updateData.adjust_type = 'swap';
      updateData.swap_with_slot = updates.swapWithSlot;
    } else if (action === 'cancel') {
      updateData.status = 'cancelled';
      updateData.remark = updates.remark;
    }
    
    const { data, error: dbError } = await client
      .from('schedule_changes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (dbError) {
      return NextResponse.json(
        error('更新调课记录失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        error('调课记录不存在', ErrorCode.NOT_FOUND),
        { status: 404 }
      );
    }
    
    return NextResponse.json(success(data, 'database'));
  } catch (err) {
    console.error('Failed to update schedule change:', err);
    return NextResponse.json(
      error('更新调课记录失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
