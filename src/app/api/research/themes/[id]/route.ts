/**
 * 教研主题详情 API
 * 
 * 功能：
 * - GET: 获取教研主题详情
 * - PUT: 更新教研主题
 * - DELETE: 删除教研主题
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { success, error, ErrorCode } from '@/lib/api';

const THEME_TYPE_LABELS: Record<string, string> = {
  big_unit: '大单元教学',
  project: '项目式教学',
  practice: '学科实践',
  ai_enabled: 'AI赋能教学',
  custom: '自定义主题',
};

const THEME_LEVEL_LABELS: Record<string, string> = {
  school: '校级重点教研',
  grade: '年级组教研',
  subject_group: '备课组微教研',
};

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET - 获取教研主题详情
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();
    
    // 获取主题基本信息
    const { data: theme, error: themeError } = await supabase
      .from('research_themes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (themeError || !theme) {
      return NextResponse.json(error('教研主题不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    // 获取关联的阶段
    const { data: stages } = await supabase
      .from('research_stages')
      .select('*')
      .eq('theme_id', id)
      .order('order_num', { ascending: true });
    
    // 获取关联的活动
    const { data: activities } = await supabase
      .from('research_activities')
      .select('*')
      .eq('theme_id', id)
      .order('scheduled_at', { ascending: false });
    
    // 获取统计信息
    const { data: statistics } = await supabase
      .from('research_statistics')
      .select('*')
      .eq('theme_id', id)
      .single();
    
    // 获取关联的专项教研数据
    let specialData = null;
    if (theme.type === 'big_unit') {
      const { data } = await supabase
        .from('big_unit_designs')
        .select('*')
        .eq('theme_id', id)
        .single();
      specialData = data;
    } else if (theme.type === 'project') {
      const { data } = await supabase
        .from('project_designs')
        .select('*')
        .eq('theme_id', id)
        .single();
      specialData = data;
    } else if (theme.type === 'practice') {
      const { data } = await supabase
        .from('practice_activities')
        .select('*')
        .eq('theme_id', id)
        .single();
      specialData = data;
    } else if (theme.type === 'ai_enabled') {
      const { data } = await supabase
        .from('ai_teaching_apps')
        .select('*')
        .eq('theme_id', id)
        .single();
      specialData = data;
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...theme,
        typeLabel: THEME_TYPE_LABELS[theme.type as string],
        levelLabel: THEME_LEVEL_LABELS[theme.level as string],
        objectives: theme.objectives ? JSON.parse(theme.objectives as string) : [],
        keyPoints: theme.key_points ? JSON.parse(theme.key_points as string) : [],
        stages: stages || [],
        activities: activities || [],
        statistics: statistics || null,
        specialData,
      },
    });
  } catch (err) {
    console.error('获取教研主题详情失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * PUT - 更新教研主题
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    
    // 更新数据
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.objectives !== undefined) updateData.objectives = JSON.stringify(body.objectives);
    if (body.keyPoints !== undefined) updateData.key_points = JSON.stringify(body.keyPoints);
    if (body.startDate !== undefined) updateData.start_date = body.startDate;
    if (body.endDate !== undefined) updateData.end_date = body.endDate;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.participantIds !== undefined) updateData.participant_ids = body.participantIds;
    
    const { data, error: updateError } = await supabase
      .from('research_themes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('更新教研主题失败:', updateError);
      return NextResponse.json(error('更新教研主题失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...data,
        typeLabel: THEME_TYPE_LABELS[data.type as string],
        levelLabel: THEME_LEVEL_LABELS[data.level as string],
      },
    });
  } catch (err) {
    console.error('更新教研主题API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * DELETE - 删除教研主题
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    // 检查是否有关联数据
    const { data: activities } = await supabase
      .from('research_activities')
      .select('id')
      .eq('theme_id', id)
      .limit(1);
    
    if (activities && activities.length > 0) {
      return NextResponse.json(
        error('该主题下有教研活动，无法删除', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }
    
    const { error: deleteError } = await supabase
      .from('research_themes')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('删除教研主题失败:', deleteError);
      return NextResponse.json(error('删除教研主题失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('删除教研主题API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
