/**
 * 财务记录 API
 * 
 * GET: 获取财务记录
 * POST: 创建财务记录
 * 
 * ⚠️ 架构原则：
 * - 使用统一认证中间件
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { ok, fail, serverError } from '@/lib/api';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET: 获取财务记录
 */
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('finance_records')
      .select('*')
      .order('date', { ascending: false });
    
    if (type) {
      query = query.eq('type', type);
    }
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return fail(error.message);
    }
    
    const formattedData = (data || []).map(r => ({
      id: r.id,
      type: r.type,
      category: r.category,
      amount: r.amount,
      date: r.date,
      description: r.description,
      operatorId: r.operator_id,
      operatorName: r.operator_name,
      status: r.status,
      createdAt: r.created_at,
    }));
    
    return ok(formattedData);
  } catch (error) {
    console.error('获取财务记录失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * POST: 创建财务记录
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    if (!body.type || !body.amount || !body.date) {
      return fail('缺少必要参数');
    }
    
    const { data, error } = await client
      .from('finance_records')
      .insert({
        id: `fin-${Date.now()}`,
        type: body.type,
        category: body.category,
        amount: body.amount,
        date: body.date,
        description: body.description,
        operator_id: body.operatorId,
        operator_name: body.operatorName,
        status: body.status || 'completed',
      })
      .select()
      .single();
    
    if (error) {
      return fail(error.message);
    }
    
    return ok({
      id: data.id,
      type: data.type,
      amount: data.amount,
    });
  } catch (error) {
    console.error('创建财务记录失败:', error);
    return serverError('服务器错误');
  }
});
