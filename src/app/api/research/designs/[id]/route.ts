/**
 * 教学设计 API
 * 
 * 功能：
 * - GET: 获取教学设计详情
 * - POST: 创建教学设计（自动同步到资源库）
 * - PUT: 更新教学设计
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

const supabase = getSupabaseClient();

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET - 获取教学设计详情
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const { data, error: dbError } = await supabase
      .from('lesson_designs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (dbError || !data) {
      return NextResponse.json(error('教学设计不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        activityId: data.activity_id,
        teacherId: data.teacher_id,
        teacherName: data.teacher_name,
        title: data.title,
        designType: data.design_type,
        content: data.content ? JSON.parse(data.content as string) : null,
        createdAt: data.created_at,
      },
    });
  } catch (err) {
    console.error('获取教学设计失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * PUT - 更新教学设计
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const { id } = await params;
    const body = await request.json();
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = JSON.stringify(body.content);
    
    const { data, error: dbError } = await supabase
      .from('lesson_designs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (dbError) {
      console.error('更新教学设计失败:', dbError);
      return NextResponse.json(error('更新失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 同步更新资源库
    if (body.content !== undefined) {
      await supabase
        .from('research_resources')
        .update({
          content: JSON.stringify(body.content),
          updated_at: new Date().toISOString(),
        })
        .eq('source_id', id)
        .eq('source_type', 'activity');
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        title: data.title,
      },
    });
  } catch (err) {
    console.error('更新教学设计失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
