/**
 * 教研阶段 API
 * 
 * 功能：
 * - GET: 获取教研阶段列表
 * - POST: 创建教研阶段
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { error, ErrorCode } from '@/lib/api-route-utils';

/**
 * GET - 获取教研阶段列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const themeId = searchParams.get('themeId');
    const status = searchParams.get('status');
    
    if (!themeId) {
      return NextResponse.json(error('缺少主题ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    let query = supabase
      .from('research_stages')
      .select('*')
      .eq('theme_id', themeId);
    
    if (status) query = query.eq('status', status);
    
    query = query.order('order_num', { ascending: true });
    
    const { data, error: fetchError } = await query;
    
    if (fetchError) {
      console.error('获取教研阶段失败:', fetchError);
      return NextResponse.json(error('获取教研阶段失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 解析 JSON 字段
    const stages = (data || []).map((item: Record<string, unknown>) => ({
      ...item,
      tasks: item.tasks ? (typeof item.tasks === 'string' ? JSON.parse(item.tasks) : item.tasks) : [],
    }));
    
    return NextResponse.json({ success: true, data: stages });
  } catch (err) {
    console.error('教研阶段API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * POST - 创建教研阶段
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    
    if (!body.themeId || !body.name) {
      return NextResponse.json(error('缺少必填字段', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 获取当前最大序号
    const { data: existingStages } = await supabase
      .from('research_stages')
      .select('order_num')
      .eq('theme_id', body.themeId)
      .order('order_num', { ascending: false })
      .limit(1);
    
    const nextOrder = existingStages && existingStages.length > 0 
      ? (existingStages[0].order_num || 0) + 1 
      : 1;
    
    const insertData: Record<string, unknown> = {
      theme_id: body.themeId,
      name: body.name,
      description: body.description || '',
      order_num: body.orderNum ?? nextOrder,
      start_date: body.startDate || null,
      end_date: body.endDate || null,
      status: 'pending',
      tasks: body.tasks || [],
      responsible_ids: body.responsibleIds || [],
    };
    
    const { data, error: createError } = await supabase
      .from('research_stages')
      .insert(insertData)
      .select()
      .single();
    
    if (createError) {
      console.error('创建教研阶段失败:', createError);
      return NextResponse.json(error('创建教研阶段失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data,
      message: '教研阶段创建成功',
    });
  } catch (err) {
    console.error('创建教研阶段API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
