/**
 * 公告 API
 * 
 * 获取学校公告数据
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { announcementService } from '@/services/portal.service';

/** 公告 */
export interface Announcement {
  id: string;
  title: string;
  content: string;
  category?: string;
  priority?: string;
  publisherId?: string;
  publisherName?: string;
  publishDate?: string;
  expireDate?: string;
  status: string;
  viewCount?: number;
  createdAt: string;
}

/** 新闻（用于前端展示） */
export interface NewsItem {
  id: string;
  title: string;
  summary?: string;
  category?: string;
  mediaLevel?: string;
  coverImage?: string;
  publishedAt?: string;
}

/** 公告（用于前端展示） */
export interface NoticeItem {
  id: string;
  title: string;
  date?: string;
}

/**
 * 获取公告列表
 * 
 * 返回分离的新闻和公告数据：
 * - news: type='news' 的记录（新闻动态）
 * - announcements: type='announcement' 的记录（校园公告）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = await announcementService.getList({
      category,
      search,
      limit: limit * 2, // 获取更多数据以便分离
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '获取公告数据失败',
      }, { status: 500 });
    }

    const allData = result.data || [];

    // 分离新闻和公告
    const newsData = allData
      .filter(item => item.type === 'news')
      .slice(0, limit)
      .map(item => ({
        id: item.id,
        title: item.title,
        summary: item.summary || item.content?.substring(0, 100) || '',
        category: item.category || '校园新闻',
        mediaLevel: item.media_level,
        coverImage: item.cover_image,
        publishedAt: item.published_at,
      }));

    const announcementsData = allData
      .filter(item => item.type === 'announcement' || item.type === 'internal_notice')
      .slice(0, limit)
      .map(item => ({
        id: item.id,
        title: item.title,
        date: item.published_at ? item.published_at.split('T')[0] : item.created_at?.split('T')[0],
      }));

    return NextResponse.json({
      success: true,
      data: {
        news: newsData,
        announcements: announcementsData,
      },
    });
  } catch (error) {
    console.error('Announcements API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取数据失败',
    }, { status: 500 });
  }
}
