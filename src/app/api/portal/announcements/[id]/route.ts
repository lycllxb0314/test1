/**
 * 公告详情 API
 * 
 * 获取单个公告详情
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { announcementService } from '@/services/portal.service';

/**
 * 获取公告详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await announcementService.getById(id);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '获取公告详情失败',
      }, { status: 404 });
    }

    const item = result.data!;
    const announcement = {
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
    };

    return NextResponse.json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    console.error('Announcement detail API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取数据失败',
    }, { status: 500 });
  }
}
