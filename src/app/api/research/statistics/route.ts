/**
 * 教研统计 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { error, ErrorCode } from '@/lib/api';

interface StatisticItem {
  label: string;
  value: number;
  change?: number;
}

interface SubjectStat {
  subject: string;
  themes: number;
  activities: number;
  participants: number;
}

/**
 * GET - 获取教研统计数据
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type'); // overview, subject, trend
    
    if (type === 'overview') {
      // 总览统计
      const [
        { count: totalThemes },
        { count: inProgressThemes },
        { count: completedThemes },
        { count: totalActivities },
        { count: totalAchievements },
        { data: themesData },
      ] = await Promise.all([
        supabase.from('research_themes').select('*', { count: 'exact', head: true }),
        supabase.from('research_themes').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('research_themes').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('research_activities').select('*', { count: 'exact', head: true }),
        supabase.from('research_achievements').select('*', { count: 'exact', head: true }),
        supabase.from('research_themes').select('type'),
      ]);
      
      // 按类型统计
      const typeStats: Record<string, number> = {};
      (themesData || []).forEach((t: { type: string }) => {
        typeStats[t.type] = (typeStats[t.type] || 0) + 1;
      });
      
      const overview: StatisticItem[] = [
        { label: '教研主题总数', value: totalThemes || 0 },
        { label: '进行中主题', value: inProgressThemes || 0 },
        { label: '已完成主题', value: completedThemes || 0 },
        { label: '教研活动总数', value: totalActivities || 0 },
        { label: '教研成果数', value: totalAchievements || 0 },
      ];
      
      return NextResponse.json({
        success: true,
        data: {
          overview,
          typeStats,
        },
      });
    }
    
    if (type === 'subject') {
      // 按学科统计
      const { data: themes } = await supabase
        .from('research_themes')
        .select('subject');
      
      const subjectStats: Record<string, SubjectStat> = {};
      (themes || []).forEach((t: { subject: string }) => {
        if (!subjectStats[t.subject]) {
          subjectStats[t.subject] = {
            subject: t.subject,
            themes: 0,
            activities: 0,
            participants: 0,
          };
        }
        subjectStats[t.subject].themes++;
      });
      
      return NextResponse.json({
        success: true,
        data: Object.values(subjectStats),
      });
    }
    
    if (type === 'theme') {
      // 单个主题的统计
      const themeId = searchParams.get('themeId');
      if (!themeId) {
        return NextResponse.json(error('缺少主题ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
      }
      
      const { data: stats } = await supabase
        .from('research_statistics')
        .select('*')
        .eq('theme_id', themeId)
        .single();
      
      const { count: activitiesCount } = await supabase
        .from('research_activities')
        .select('*', { count: 'exact', head: true })
        .eq('theme_id', themeId)
        .eq('status', 'completed');
      
      return NextResponse.json({
        success: true,
        data: {
          ...stats,
          completedActivities: activitiesCount || 0,
        },
      });
    }
    
    // 默认返回总览
    return NextResponse.json({ success: true, data: {} });
  } catch (err) {
    console.error('教研统计API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
