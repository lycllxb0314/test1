/**
 * 教师教研活动 API
 * 
 * 功能：
 * - GET: 获取教师参与的教研活动和主题
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { success, error, ErrorCode } from '@/lib/api';

const supabase = getSupabaseClient();

const THEME_TYPE_LABELS: Record<string, string> = {
  big_unit: '大单元教学',
  project: '项目式教学',
  practice: '学科实践',
  ai_enabled: 'AI赋能教学',
  custom: '自定义主题',
};

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
 * GET - 获取教师参与的教研活动
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId') || user.id;
    
    // 查询教师参与的活动（通过 participants 字段）
    const { data: activities, error: dbError } = await supabase
      .from('research_activities')
      .select(`
        id,
        title,
        type,
        description,
        location,
        scheduled_at,
        status,
        theme_id,
        participants,
        created_at,
        research_themes (
          id,
          title,
          type,
          subject,
          status
        )
      `)
      .contains('participants', JSON.stringify([{ id: teacherId }]))
      .or(`participants.cs.[{"id":"${teacherId}"}]`)
      .order('scheduled_at', { ascending: false });
    
    if (dbError) {
      console.error('查询教研活动失败:', dbError);
      // 尝试另一种查询方式
      const { data: allActivities, error: allError } = await supabase
        .from('research_activities')
        .select(`
          id,
          title,
          type,
          description,
          location,
          scheduled_at,
          status,
          theme_id,
          participants,
          created_at
        `);
      
      if (allError) {
        return NextResponse.json(error('查询失败', ErrorCode.DATABASE_ERROR), { status: 500 });
      }
      
      // 在应用层过滤
      const filteredActivities = (allActivities || []).filter(act => {
        const participants = act.participants as Array<{ id: string }> || [];
        return participants.some(p => p.id === teacherId);
      });
      
      // 获取主题信息
      const themeIds = [...new Set(filteredActivities.map(a => a.theme_id))];
      const { data: themes } = await supabase
        .from('research_themes')
        .select('id, title, type, subject, status')
        .in('id', themeIds);
      
      const themeMap = new Map((themes || []).map(t => [t.id, t]));
      
      // 组装数据
      const result = buildResult(filteredActivities, themeMap, teacherId);
      return NextResponse.json(success(result));
    }
    
    // 获取主题信息
    const themeIds = [...new Set((activities || []).map(a => a.theme_id))];
    const { data: themes } = await supabase
      .from('research_themes')
      .select('id, title, type, subject, status')
      .in('id', themeIds);
    
    const themeMap = new Map((themes || []).map(t => [t.id, t]));
    
    // 组装数据
    const result = buildResult(activities || [], themeMap, teacherId);
    return NextResponse.json(success(result));
    
  } catch (err) {
    console.error('获取教师教研活动失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

function buildResult(
  activities: any[], 
  themeMap: Map<string, any>,
  teacherId: string
) {
  // 按主题分组
  const themeGroups = new Map<string, {
    id: string;
    title: string;
    type: string;
    typeLabel: string;
    subject: string;
    status: string;
    statusLabel: string;
    activityCount: number;
    resourceCount: number;
    activities: any[];
  }>();
  
  for (const activity of activities) {
    const theme = themeMap.get(activity.theme_id);
    if (!theme) continue;
    
    if (!themeGroups.has(activity.theme_id)) {
      themeGroups.set(activity.theme_id, {
        id: theme.id,
        title: theme.title,
        type: theme.type,
        typeLabel: THEME_TYPE_LABELS[theme.type] || theme.type,
        subject: theme.subject,
        status: theme.status,
        statusLabel: THEME_TYPE_LABELS[theme.status] || theme.status,
        activityCount: 0,
        resourceCount: 0,
        activities: [],
      });
    }
    
    const group = themeGroups.get(activity.theme_id)!;
    group.activities.push({
      id: activity.id,
      title: activity.title,
      type: activity.type,
      typeLabel: ACTIVITY_TYPE_LABELS[activity.type] || activity.type,
      description: activity.description,
      location: activity.location,
      scheduledAt: activity.scheduled_at,
      status: activity.status,
      statusLabel: ACTIVITY_STATUS_LABELS[activity.status] || activity.status,
      themeId: activity.theme_id,
      themeTitle: theme.title,
      themeType: theme.type,
      themeTypeLabel: THEME_TYPE_LABELS[theme.type] || theme.type,
      subject: theme.subject,
      participants: activity.participants || [],
      resourceCount: 0, // 后续查询
      createdAt: activity.created_at,
    });
    group.activityCount++;
  }
  
  return Array.from(themeGroups.values());
}
