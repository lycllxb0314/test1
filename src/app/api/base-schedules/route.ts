/**
 * 基础课表 API
 * 
 * GET: 获取基础课表
 * POST: 创建基础课表
 * PUT: 更新基础课表
 * DELETE: 删除基础课表
 * 
 * ⚠️ 架构原则：
 * - 使用统一认证中间件
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { ok, fail, serverError, paginated } from '@/lib/api';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET: 获取基础课表
 */
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const grade = searchParams.get('grade');

  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('base_schedules')
      .select('*', { count: 'exact' });
    
    if (grade) {
      query = query.eq('grade', parseInt(grade));
    }
    
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      return fail(error.message);
    }
    
    const formattedData = (data || []).map(s => ({
      id: s.id,
      grade: s.grade,
      subject: s.subject,
      periodsPerWeek: s.periods_per_week,
      semester: s.semester,
      createdAt: s.created_at,
    }));
    
    return paginated(formattedData, count || 0, page, pageSize);
  } catch (error) {
    console.error('获取基础课表失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * POST: 创建基础课表
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    if (!body.grade || !body.subject) {
      return fail('缺少必要参数');
    }
    
    const { data, error } = await client
      .from('base_schedules')
      .insert({
        id: `bs-${Date.now()}`,
        grade: body.grade,
        subject: body.subject,
        periods_per_week: body.periodsPerWeek || 0,
        semester: body.semester,
      })
      .select()
      .single();
    
    if (error) {
      return fail(error.message);
    }
    
    return ok({ id: data.id, grade: data.grade, subject: data.subject });
  } catch (error) {
    console.error('创建基础课表失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * PUT: 更新基础课表
 */
export const PUT = withAuth(async (request: NextRequest) => {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    if (!body.id) {
      return fail('缺少ID');
    }
    
    const { data, error } = await client
      .from('base_schedules')
      .update({
        periods_per_week: body.periodsPerWeek,
        semester: body.semester,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.id)
      .select()
      .single();
    
    if (error) {
      return fail(error.message);
    }
    
    return ok({ id: data.id });
  } catch (error) {
    console.error('更新基础课表失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * DELETE: 删除基础课表
 */
export const DELETE = withAuth(async (request: NextRequest) => {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return fail('缺少ID');
    }
    
    const { error } = await client
      .from('base_schedules')
      .delete()
      .eq('id', id);
    
    if (error) {
      return fail(error.message);
    }
    
    return ok({ id, message: '删除成功' });
  } catch (error) {
    console.error('删除基础课表失败:', error);
    return serverError('服务器错误');
  }
});
