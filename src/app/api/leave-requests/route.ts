/**
 * 请假申请 API
 * 
 * GET: 获取请假列表
 * POST: 创建请假申请
 * 
 * ⚠️ 架构原则：
 * - 使用统一认证中间件
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { ok, fail, serverError, paginated } from '@/lib/api';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET: 获取请假列表
 */
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const status = searchParams.get('status');
  const applicantId = searchParams.get('applicantId');

  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('leave_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    if (applicantId) {
      query = query.eq('applicant_id', applicantId);
    }
    
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      return fail(error.message);
    }
    
    const formattedData = (data || []).map(r => ({
      id: r.id,
      applicantId: r.applicant_id,
      applicantName: r.applicant_name,
      type: r.type,
      startDate: r.start_date,
      endDate: r.end_date,
      reason: r.reason,
      status: r.status,
      approverId: r.approver_id,
      approverName: r.approver_name,
      approvedAt: r.approved_at,
      createdAt: r.created_at,
    }));
    
    return paginated(formattedData, count || 0, page, pageSize);
  } catch (error) {
    console.error('获取请假列表失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * POST: 创建请假申请
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    if (!body.applicantId || !body.type || !body.startDate) {
      return fail('缺少必要参数');
    }
    
    const { data, error } = await client
      .from('leave_requests')
      .insert({
        id: `lr-${Date.now()}`,
        applicant_id: body.applicantId,
        applicant_name: body.applicantName,
        type: body.type,
        start_date: body.startDate,
        end_date: body.endDate || body.startDate,
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
    console.error('创建请假申请失败:', error);
    return serverError('服务器错误');
  }
});
