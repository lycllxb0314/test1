/**
 * 教师教研活动详情API
 * 
 * GET: 获取单个教研活动的详细信息
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: activityId } = await params;
    
    // 获取教研活动详情
    const { data: activity, error: activityError } = await supabase
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
        created_at,
        research_themes!research_activities_theme_id_fkey (
          id,
          title,
          type,
          subject
        )
      `)
      .eq('id', activityId)
      .single();
    
    if (activityError || !activity) {
      return NextResponse.json({ success: false, error: '活动不存在' }, { status: 404 });
    }
    
    // 获取活动参与人员
    const { data: participants, error: participantsError } = await supabase
      .from('research_activity_participants')
      .select(`
        teacher_id,
        teachers!research_activity_participants_teacher_id_fkey (
          id,
          name,
          subject
        )
      `)
      .eq('activity_id', activityId);
    
    const activityTypeLabels: Record<string, string> = {
      collective: '集体备课',
      observation: '听课评课',
      seminar: '教学研讨',
      sharing: '经验分享',
    };
    
    const themeTypeLabels: Record<string, string> = {
      semester: '学期教研',
      project: '课题研究',
      group: '教研组活动',
      teaching_research: '教学研究',
      lesson_preparation: '集体备课',
    };
    
    const statusLabels: Record<string, string> = {
      pending: '待开始',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消',
    };
    
    // 处理关联查询结果（Supabase返回的是数组）
    const theme = Array.isArray(activity.research_themes) 
      ? activity.research_themes[0] 
      : activity.research_themes;
    
    const formattedActivity = {
      id: activity.id,
      title: activity.title,
      type: activity.type,
      typeLabel: activityTypeLabels[activity.type] || activity.type,
      description: activity.description,
      location: activity.location,
      scheduledAt: activity.scheduled_at,
      status: activity.status,
      statusLabel: statusLabels[activity.status] || activity.status,
      themeId: activity.theme_id,
      themeTitle: theme?.title || '',
      themeType: theme?.type || '',
      themeTypeLabel: themeTypeLabels[theme?.type] || '',
      subject: theme?.subject || '',
      participants: (participants || []).map((p: any) => {
        const teacher = Array.isArray(p.teachers) ? p.teachers[0] : p.teachers;
        return {
          id: teacher?.id || p.teacher_id,
          name: teacher?.name || '未知',
          subject: teacher?.subject || '',
        };
      }),
      createdAt: activity.created_at,
    };
    
    return NextResponse.json({
      success: true,
      data: formattedActivity,
    });
    
  } catch (error) {
    console.error('获取活动详情失败:', error);
    return NextResponse.json(
      { success: false, error: '获取活动详情失败' },
      { status: 500 }
    );
  }
}
