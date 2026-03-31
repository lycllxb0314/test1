/**
 * 数据采集 API
 * 
 * GET: 获取采集任务列表
 * POST: 创建采集任务
 * 
 * ⚠️ 架构原则：
 * - 使用统一认证中间件
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { ok, fail, serverError } from '@/lib/api';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET: 获取采集任务列表
 */
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');

  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('data_collections')
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
    
    const formattedData = (data || []).map(d => ({
      id: d.id,
      title: d.title,
      description: d.description,
      type: d.type,
      status: d.status,
      deadline: d.deadline,
      targetUsers: d.target_users || [],
      fields: d.fields || [],
      createdBy: d.created_by,
      createdByName: d.created_by_name,
      createdAt: d.created_at,
    }));
    
    return ok(formattedData);
  } catch (error) {
    console.error('获取数据采集列表失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * POST: 创建采集任务
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    if (!body.title || !body.type) {
      return fail('缺少必要参数');
    }
    
    const { data, error } = await client
      .from('data_collections')
      .insert({
        id: `dc-${Date.now()}`,
        title: body.title,
        description: body.description,
        type: body.type,
        status: body.status || 'draft',
        deadline: body.deadline,
        target_users: body.targetUsers || [],
        fields: body.fields || [],
        created_by: body.createdBy,
        created_by_name: body.createdByName,
      })
      .select()
      .single();
    
    if (error) {
      return fail(error.message);
    }
    
    return ok({
      id: data.id,
      title: data.title,
      status: data.status,
    });
  } catch (error) {
    console.error('创建数据采集任务失败:', error);
    return serverError('服务器错误');
  }
});
