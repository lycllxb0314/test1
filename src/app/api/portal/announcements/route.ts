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

/**
 * 获取公告列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = await announcementService.getList({
      category,
      search,
      limit,
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '获取公告数据失败',
      }, { status: 500 });
    }

    const announcements: Announcement[] = (result.data || []).map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      category: item.category,
      priority: item.type,
      publisherId: item.author_id,
      publisherName: item.author_name,
      publishDate: item.published_at,
      expireDate: undefined,
      status: item.status,
      viewCount: item.view_count,
      createdAt: item.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    console.error('Announcements API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取数据失败',
    }, { status: 500 });
  }
}
