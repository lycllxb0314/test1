/**
 * 教研成果 API
 * 
 * 功能：
 * - GET: 获取教研成果列表
 * - POST: 创建教研成果
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { error, ErrorCode } from '@/lib/api-route-utils';
import { 
  ACHIEVEMENT_TYPE_LABELS, 
  type AchievementType,
  type AchievementStatus 
} from '@/types/research';

/**
 * GET - 获取教研成果列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const themeId = searchParams.get('themeId');
    const type = searchParams.get('type');
    const subject = searchParams.get('subject');
    const status = searchParams.get('status');
    const authorId = searchParams.get('authorId');
    const isPublic = searchParams.get('isPublic');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    
    let query = supabase
      .from('research_achievements')
      .select('*', { count: 'exact' });
    
    if (themeId) query = query.eq('theme_id', themeId);
    if (type) query = query.eq('type', type);
    if (subject) query = query.eq('subject', subject);
    if (status) query = query.eq('status', status);
    if (authorId) query = query.contains('author_ids', [authorId]);
    if (isPublic !== null) query = query.eq('is_public', isPublic === 'true');
    
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    query = query.order('created_at', { ascending: false });
    
    const { data, error: fetchError, count } = await query;
    
    if (fetchError) {
      console.error('获取教研成果失败:', fetchError);
      return NextResponse.json(error('获取教研成果失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    const achievements = (data || []).map((item: Record<string, unknown>) => ({
      ...item,
      typeLabel: ACHIEVEMENT_TYPE_LABELS[item.type as AchievementType] || item.type,
      content: item.content ? (typeof item.content === 'string' ? JSON.parse(item.content) : item.content) : null,
    }));
    
    return NextResponse.json({
      success: true,
      data: achievements,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (err) {
    console.error('教研成果API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * POST - 创建教研成果
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
    
    const insertData: Record<string, unknown> = {
      title: body.title,
      type: body.type,
      subject: body.subject || null,
      theme_id: body.themeId || null,
      description: body.description || '',
      content: body.content || null,
      file_url: body.fileUrl || null,
      file_name: body.fileName || null,
      author_ids: body.authorIds || [user.id],
      author_names: body.authorNames || [user.name],
      status: body.status || 'draft',
      is_public: body.isPublic || false,
      view_count: 0,
    };
    
    const { data, error: createError } = await supabase
      .from('research_achievements')
      .insert(insertData)
      .select()
      .single();
    
    if (createError) {
      console.error('创建教研成果失败:', createError);
      return NextResponse.json(error('创建教研成果失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 更新主题统计
    if (body.themeId) {
      const { data: currentStats } = await supabase
        .from('research_statistics')
        .select('achievements_count')
        .eq('theme_id', body.themeId)
        .single();
      
      if (currentStats) {
        await supabase
          .from('research_statistics')
          .update({
            achievements_count: (currentStats.achievements_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('theme_id', body.themeId);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...data,
        typeLabel: ACHIEVEMENT_TYPE_LABELS[data.type as AchievementType] || data.type,
      },
      message: '教研成果创建成功',
    });
  } catch (err) {
    console.error('创建教研成果API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
