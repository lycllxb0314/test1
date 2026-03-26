/**
 * 教研活动详情 API
 * 
 * 功能：
 * - GET: 获取教研活动详情
 * - PUT: 更新教研活动
 * - DELETE: 删除教研活动
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { error, ErrorCode } from '@/lib/api-route-utils';
import { 
  ACTIVITY_TYPE_LABELS, 
  ACTIVITY_STATUS_LABELS,
  type ActivityStatus 
} from '@/types/research';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET - 获取教研活动详情
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();
    
    // 获取活动基本信息
    const { data: activity, error: fetchError } = await supabase
      .from('research_activities')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !activity) {
      return NextResponse.json(error('教研活动不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    // 获取参与记录
    const { data: participations } = await supabase
      .from('research_participations')
      .select('*')
      .eq('activity_id', id)
      .order('created_at', { ascending: true });
    
    // 获取关联的主题信息
    let themeInfo = null;
    if (activity.theme_id) {
      const { data: theme } = await supabase
        .from('research_themes')
        .select('id, title, type, subject')
        .eq('id', activity.theme_id)
        .single();
      themeInfo = theme;
    }
    
    // 获取关联的阶段信息
    let stageInfo = null;
    if (activity.stage_id) {
      const { data: stage } = await supabase
        .from('research_stages')
        .select('id, name, status')
        .eq('id', activity.stage_id)
        .single();
      stageInfo = stage;
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...activity,
        typeLabel: ACTIVITY_TYPE_LABELS[activity.type as keyof typeof ACTIVITY_TYPE_LABELS] || activity.type,
        statusLabel: ACTIVITY_STATUS_LABELS[activity.status as ActivityStatus] || activity.status,
        participations: participations || [],
        theme: themeInfo,
        stage: stageInfo,
      },
    });
  } catch (err) {
    console.error('获取教研活动详情失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * PUT - 更新教研活动
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
    
    // 检查活动是否存在
    const { data: existingActivity, error: fetchError } = await supabase
      .from('research_activities')
      .select('id, status, theme_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !existingActivity) {
      return NextResponse.json(error('教研活动不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    // 构建更新数据
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.scheduledAt !== undefined) updateData.scheduled_at = body.scheduledAt;
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.hostId !== undefined) updateData.host_id = body.hostId;
    if (body.hostName !== undefined) updateData.host_name = body.hostName;
    if (body.participantIds !== undefined) updateData.participant_ids = body.participantIds;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.meetingMinutes !== undefined) updateData.meeting_minutes = body.meetingMinutes;
    if (body.attachments !== undefined) updateData.attachments = body.attachments;
    
    const { data, error: updateError } = await supabase
      .from('research_activities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('更新教研活动失败:', updateError);
      return NextResponse.json(error('更新教研活动失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 如果状态变更为完成，更新统计
    if (body.status === 'completed' && existingActivity.status !== 'completed') {
      const { data: currentStats } = await supabase
        .from('research_statistics')
        .select('completed_activities')
        .eq('theme_id', existingActivity.theme_id)
        .single();
      
      if (currentStats) {
        await supabase
          .from('research_statistics')
          .update({
            completed_activities: (currentStats.completed_activities || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('theme_id', existingActivity.theme_id);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...data,
        typeLabel: ACTIVITY_TYPE_LABELS[data.type as keyof typeof ACTIVITY_TYPE_LABELS] || data.type,
        statusLabel: ACTIVITY_STATUS_LABELS[data.status as ActivityStatus] || data.status,
      },
    });
  } catch (err) {
    console.error('更新教研活动API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * DELETE - 删除教研活动
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    // 检查活动是否存在
    const { data: activity, error: fetchError } = await supabase
      .from('research_activities')
      .select('id, theme_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !activity) {
      return NextResponse.json(error('教研活动不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    // 删除参与记录
    await supabase
      .from('research_participations')
      .delete()
      .eq('activity_id', id);
    
    // 删除活动
    const { error: deleteError } = await supabase
      .from('research_activities')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('删除教研活动失败:', deleteError);
      return NextResponse.json(error('删除教研活动失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 更新统计
    if (activity.theme_id) {
      const { data: currentStats } = await supabase
        .from('research_statistics')
        .select('total_activities')
        .eq('theme_id', activity.theme_id)
        .single();
      
      if (currentStats) {
        await supabase
          .from('research_statistics')
          .update({
            total_activities: Math.max(0, (currentStats.total_activities || 1) - 1),
            updated_at: new Date().toISOString(),
          })
          .eq('theme_id', activity.theme_id);
      }
    }
    
    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('删除教研活动API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
