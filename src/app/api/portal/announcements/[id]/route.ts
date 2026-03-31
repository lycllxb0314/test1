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
      priority: item.priority,
      publisherId: item.publisher_id,
      publisherName: item.publisher_name,
      publishDate: item.publish_date,
      expireDate: item.expire_date,
      status: item.status,
      viewCount: item.view_count,
      sortOrder: item.sort_order,
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
