/**
 * 教研活动 API
 * 
 * 功能：
 * - GET: 获取教研活动列表
 * - POST: 创建教研活动
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

// 活动类型标签映射
const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  seminar: '研讨会',
  lesson_observation: '听课评课',
  collective_prep: '集体备课',
  training: '培训学习',
  workshop: '工作坊',
  salon: '教学沙龙',
};

/**
 * GET - 获取教研活动列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const themeId = searchParams.get('themeId');
    const stageId = searchParams.get('stageId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const hostId = searchParams.get('hostId');
    const participantId = searchParams.get('participantId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    
    let query = supabase
      .from('research_activities')
      .select('*', { count: 'exact' });
    
    if (themeId) query = query.eq('theme_id', themeId);
    if (stageId) query = query.eq('stage_id', stageId);
    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);
    if (hostId) query = query.eq('host_id', hostId);
    if (participantId) {
      query = query.contains('participant_ids', [participantId]);
    }
    if (startDate) query = query.gte('scheduled_at', startDate);
    if (endDate) query = query.lte('scheduled_at', endDate);
    
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    query = query.order('scheduled_at', { ascending: false });
    
    const { data, error: fetchError, count } = await query;
    
    if (fetchError) {
      console.error('获取教研活动失败:', fetchError);
      return NextResponse.json(error('获取教研活动失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    const activities = (data || []).map((item: Record<string, unknown>) => ({
      ...item,
      typeLabel: ACTIVITY_TYPE_LABELS[item.type as string] || item.type,
    }));
    
    return NextResponse.json({
      success: true,
      data: activities,
      total: count || 0,
      page,
      pageSize,
    });
  } catch (err) {
    console.error('教研活动API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * POST - 创建教研活动
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    
    if (!body.themeId || !body.title || !body.type) {
      return NextResponse.json(error('缺少必填字段', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const insertData: Record<string, unknown> = {
      theme_id: body.themeId,
      stage_id: body.stageId || null,
      title: body.title,
      type: body.type,
      description: body.description || '',
      location: body.location || '',
      scheduled_at: body.scheduledAt || null,
      duration: body.duration || 60,
      host_id: body.hostId || user.id,
      host_name: body.hostName || user.name,
      participant_ids: body.participantIds || [],
      actual_participant_ids: [],
      status: 'scheduled',
      meeting_minutes: body.meetingMinutes || '',
      attachments: body.attachments || [],
    };
    
    const { data, error: createError } = await supabase
      .from('research_activities')
      .insert(insertData)
      .select()
      .single();
    
    if (createError) {
      console.error('创建教研活动失败:', createError);
      return NextResponse.json(error('创建教研活动失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 更新统计
    const { data: currentStats } = await supabase
      .from('research_statistics')
      .select('total_activities')
      .eq('theme_id', body.themeId)
      .single();
    
    if (currentStats) {
      await supabase
        .from('research_statistics')
        .update({
          total_activities: (currentStats.total_activities || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('theme_id', body.themeId);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...data,
        typeLabel: ACTIVITY_TYPE_LABELS[data.type as string] || data.type,
      },
      message: '教研活动创建成功',
    });
  } catch (err) {
    console.error('创建教研活动API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
