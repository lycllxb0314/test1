/**
 * 课后服务 API
 * 
 * GET: 获取课后服务列表
 * POST: 创建课后服务
 * 
 * ⚠️ 架构原则：
 * - 使用统一认证中间件
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { ok, fail, serverError } from '@/lib/api';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET: 获取课后服务列表
 */
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');

  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('after_school_services')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return fail(error.message);
    }
    
    const formattedData = (data || []).map(s => ({
      id: s.id,
      name: s.name,
      type: s.type,
      description: s.description,
      teacherId: s.teacher_id,
      teacherName: s.teacher_name,
      schedule: s.schedule,
      location: s.location,
      capacity: s.capacity,
      enrolledCount: s.enrolled_count || 0,
      status: s.status,
      startDate: s.start_date,
      endDate: s.end_date,
      createdAt: s.created_at,
    }));
    
    return ok(formattedData);
  } catch (error) {
    console.error('获取课后服务列表失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * POST: 创建课后服务
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    if (!body.name || !body.type) {
      return fail('缺少必要参数');
    }
    
    const { data, error } = await client
      .from('after_school_services')
      .insert({
        id: `as-${Date.now()}`,
        name: body.name,
        type: body.type,
        description: body.description,
        teacher_id: body.teacherId,
        teacher_name: body.teacherName,
        schedule: body.schedule,
        location: body.location,
        capacity: body.capacity || 30,
        enrolled_count: 0,
        status: body.status || 'active',
        start_date: body.startDate,
        end_date: body.endDate,
      })
      .select()
      .single();
    
    if (error) {
      return fail(error.message);
    }
    
    return ok({
      id: data.id,
      name: data.name,
      type: data.type,
      status: data.status,
    });
  } catch (error) {
    console.error('创建课后服务失败:', error);
    return serverError('服务器错误');
  }
});
