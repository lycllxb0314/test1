/**
 * 主页门户 API
 * 
 * 获取学校主页门户需要展示的公告和新闻数据
 * - 校园公告：发布到主页的公告列表
 * - 新闻动态：发布到主页的新闻列表
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { Announcement, NewsCategory, MediaLevel } from '@/types/approval';

/** 主页展示的公告/新闻项 */
export interface PortalAnnouncement {
  id: string;
  title: string;
  summary?: string;
  category?: NewsCategory;
  mediaLevel?: MediaLevel;
  coverImage?: string;
  publishedAt?: string;
  viewCount: number;
  isPinned: boolean;
}

/**
 * 获取主页门户数据
 * 
 * Query params:
 * - type: 'announcement' | 'news' | 'all' (默认 'all')
 * - limit: 每种类型返回的数量（默认 10）
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');

    const now = new Date().toISOString();

    // 构建基础查询条件：已发布且发布时间已到
    const baseQuery = (table: string) => 
      supabase
        .from(table)
        .select('*')
        .eq('is_external', true) // 发布到主页
        .eq('publish_status', 'published') // 已发布
        .or(`published_at.is.null,published_at.lte.${now}`) // 发布时间已到或立即发布
        .order('is_pinned', { ascending: false }) // 置顶优先
        .order('pin_order', { ascending: true }) // 置顶排序
        .order('published_at', { ascending: false }); // 发布时间倒序

    const result: {
      announcements: PortalAnnouncement[];
      news: PortalAnnouncement[];
    } = {
      announcements: [],
      news: [],
    };

    if (type === 'all' || type === 'announcement') {
      const { data: announcements, error: announcementError } = await baseQuery('announcements')
        .eq('type', 'announcement')
        .limit(limit);

      if (announcementError) {
        console.error('Failed to fetch announcements:', announcementError);
      } else {
        result.announcements = (announcements || []).map(mapToPortalAnnouncement);
      }
    }

    if (type === 'all' || type === 'news') {
      const { data: news, error: newsError } = await baseQuery('announcements')
        .eq('type', 'news')
        .limit(limit);

      if (newsError) {
        console.error('Failed to fetch news:', newsError);
      } else {
        result.news = (news || []).map(mapToPortalAnnouncement);
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Portal API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取数据失败',
    }, { status: 500 });
  }
}

/**
 * 将数据库记录映射为门户展示格式
 */
function mapToPortalAnnouncement(item: any): PortalAnnouncement {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary || (item.content ? item.content.substring(0, 200) + (item.content.length > 200 ? '...' : '') : undefined),
    category: item.category,
    mediaLevel: item.media_level,
    coverImage: item.cover_image,
    publishedAt: item.published_at,
    viewCount: item.view_count || 0,
    isPinned: item.is_pinned || false,
  };
}
