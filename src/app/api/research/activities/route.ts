/**
 * 教研活动 API
 * 
 * 功能：
 * - GET: 获取活动列表
 * - POST: 创建活动
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

const supabase = getSupabaseClient();

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  seminar: '研讨会',
  lesson_observation: '听课评课',
  collective_prep: '集体备课',
  training: '培训学习',
  workshop: '工作坊',
  salon: '教学沙龙',
};

const ACTIVITY_STATUS_LABELS: Record<string, string> = {
  scheduled: '已安排',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

/**
 * GET - 获取活动列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const themeId = searchParams.get('themeId');
    
    let query = supabase
      .from('research_activities')
      .select('*')
      .order('scheduled_at', { ascending: false });
    
    if (themeId) {
      query = query.eq('theme_id', themeId);
    }
    
    const { data, error: dbError } = await query;
    
    if (dbError) {
      console.error('查询活动失败:', dbError);
      return NextResponse.json(error('查询失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: data?.map(a => ({
        id: a.id,
        themeId: a.theme_id,
        title: a.title,
        type: a.type,
        typeLabel: ACTIVITY_TYPE_LABELS[a.type as string] || a.type,
        description: a.description,
        location: a.location,
        scheduledAt: a.scheduled_at,
        duration: a.duration,
        hostName: a.host_name,
        status: a.status,
        statusLabel: ACTIVITY_STATUS_LABELS[a.status as string] || a.status,
        createdAt: a.created_at,
      })) || [],
    });
  } catch (err) {
    console.error('获取活动列表失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * POST - 创建活动
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    const { 
      themeId, 
      title, 
      type, 
      description, 
      location, 
      scheduledAt, 
      duration,
      participantIds,
      participants,
    } = body;
    
    if (!themeId || !title) {
      return NextResponse.json(error('缺少必要参数', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    
    const { data, error: dbError } = await supabase
      .from('research_activities')
      .insert({
        theme_id: themeId,
        title,
        type: type || 'lesson_observation',
        description,
        location,
        scheduled_at: scheduledAt || null,
        duration: duration || null,
        host_id: user.id,
        host_name: user.name,
        status: 'scheduled',
        participants: participants || [],
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('创建活动失败:', dbError);
      return NextResponse.json(error('创建失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        themeId: data.theme_id,
        title: data.title,
        type: data.type,
        typeLabel: ACTIVITY_TYPE_LABELS[data.type as string],
        status: data.status,
        statusLabel: ACTIVITY_STATUS_LABELS[data.status as string],
        participants: data.participants,
      },
    });
  } catch (err) {
    console.error('创建活动失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
