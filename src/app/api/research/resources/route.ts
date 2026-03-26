/**
 * 教研资源 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

/**
 * GET - 获取教研资源列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type');
    const themeType = searchParams.get('themeType');
    const subject = searchParams.get('subject');
    const tag = searchParams.get('tag');
    
    let query = supabase
      .from('research_resources')
      .select('*')
      .eq('is_active', true);
    
    if (type) query = query.eq('type', type);
    if (themeType) query = query.eq('theme_type', themeType);
    if (subject) query = query.eq('subject', subject);
    if (tag) query = query.contains('tags', [tag]);
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error: fetchError } = await query;
    
    if (fetchError) {
      console.error('获取教研资源失败:', fetchError);
      return NextResponse.json(error('获取教研资源失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('教研资源API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * POST - 创建教研资源
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    
    if (!body.title || !body.type) {
      return NextResponse.json(error('缺少必填字段', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const { data, error: createError } = await supabase
      .from('research_resources')
      .insert({
        title: body.title,
        description: body.description || '',
        type: body.type,
        theme_type: body.themeType || null,
        subject: body.subject || null,
        tags: body.tags || [],
        file_url: body.fileUrl || null,
        file_name: body.fileName || null,
        content: body.content || null,
        view_count: 0,
        download_count: 0,
        is_active: true,
      })
      .select()
      .single();
    
    if (createError) {
      console.error('创建教研资源失败:', createError);
      return NextResponse.json(error('创建教研资源失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data, message: '资源创建成功' });
  } catch (err) {
    console.error('创建教研资源API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
