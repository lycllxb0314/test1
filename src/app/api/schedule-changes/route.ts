/**
 * 调课申请 API
 * 
 * GET: 获取调课列表
 * POST: 创建调课申请
 * 
 * ⚠️ 架构原则：
 * - 使用统一认证中间件
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { ok, fail, serverError } from '@/lib/api';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET: 获取调课列表
 */
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const applicantId = searchParams.get('applicantId');

  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('schedule_changes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    if (applicantId) {
      query = query.eq('applicant_id', applicantId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return fail(error.message);
    }
    
    const formattedData = (data || []).map(c => ({
      id: c.id,
      applicantId: c.applicant_id,
      applicantName: c.applicant_name,
      originalScheduleId: c.original_schedule_id,
      newScheduleId: c.new_schedule_id,
      changeType: c.change_type,
      reason: c.reason,
      status: c.status,
      approverId: c.approver_id,
      approverName: c.approver_name,
      approvedAt: c.approved_at,
      createdAt: c.created_at,
    }));
    
    return ok(formattedData);
  } catch (error) {
    console.error('获取调课列表失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * POST: 创建调课申请
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    if (!body.applicantId || !body.changeType) {
      return fail('缺少必要参数');
    }
    
    const { data, error } = await client
      .from('schedule_changes')
      .insert({
        id: `sc-${Date.now()}`,
        applicant_id: body.applicantId,
        applicant_name: body.applicantName,
        original_schedule_id: body.originalScheduleId,
        new_schedule_id: body.newScheduleId,
        change_type: body.changeType,
        reason: body.reason,
        status: 'pending',
      })
      .select()
      .single();
    
    if (error) {
      return fail(error.message);
    }
    
    return ok({
      id: data.id,
      applicantId: data.applicant_id,
      status: data.status,
    });
  } catch (error) {
    console.error('创建调课申请失败:', error);
    return serverError('服务器错误');
  }
});
