/**
 * 教学设计 API
 * 
 * 功能：
 * - POST: 创建教学设计（自动同步到资源库）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

const supabase = getSupabaseClient();

/**
 * POST - 创建教学设计
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    const { activityId, themeId, teacherName, title, designType, content } = body;
    
    if (!activityId || !themeId || !teacherName || !title) {
      return NextResponse.json(error('缺少必要参数', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    
    // 获取活动信息
    const { data: activity, error: activityError } = await supabase
      .from('research_activities')
      .select('*')
      .eq('id', activityId)
      .single();
    
    if (activityError || !activity) {
      return NextResponse.json(error('活动不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    // 创建教学设计
    const { data: design, error: dbError } = await supabase
      .from('lesson_designs')
      .insert({
        activity_id: activityId,
        theme_id: themeId,
        teacher_id: user.id,
        teacher_name: teacherName,
        title,
        design_type: designType || 'big_unit',
        content: content ? JSON.stringify(content) : null,
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('创建教学设计失败:', dbError);
      return NextResponse.json(error('创建失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 自动同步到资源库
    await supabase
      .from('research_resources')
      .insert({
        theme_id: themeId,
        title: `${activity.title} - ${teacherName} - ${title}`,
        folder_id: 'teaching_design',
        type: 'design',
        source_type: 'activity',
        source_id: design.id,
        teacher_name: teacherName,
        activity_title: activity.title,
        content: content ? JSON.stringify(content) : null,
        creator_id: user.id,
      });
    
    return NextResponse.json({
      success: true,
      data: {
        id: design.id,
        activityId: design.activity_id,
        teacherName: design.teacher_name,
        title: design.title,
        designType: design.design_type,
        createdAt: design.created_at,
      },
    });
  } catch (err) {
    console.error('创建教学设计失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * GET - 获取教学设计列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get('activityId');
    const themeId = searchParams.get('themeId');
    
    let query = supabase
      .from('lesson_designs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (activityId) {
      query = query.eq('activity_id', activityId);
    }
    
    if (themeId) {
      query = query.eq('theme_id', themeId);
    }
    
    const { data, error: dbError } = await query;
    
    if (dbError) {
      console.error('查询教学设计失败:', dbError);
      return NextResponse.json(error('查询失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: data?.map(d => ({
        id: d.id,
        activityId: d.activity_id,
        themeId: d.theme_id,
        teacherId: d.teacher_id,
        teacherName: d.teacher_name,
        title: d.title,
        designType: d.design_type,
        content: d.content ? JSON.parse(d.content as string) : null,
        createdAt: d.created_at,
      })) || [],
    });
  } catch (err) {
    console.error('获取教学设计列表失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
