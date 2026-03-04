/**
 * 公告详情 API
 * 
 * 获取单条公告/新闻的详细信息
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { Announcement } from '@/types/approval';

/**
 * 获取公告详情
 * 
 * 同时增加浏览次数
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;

    // 获取公告详情
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: '公告不存在',
      }, { status: 404 });
    }

    // 检查是否可以访问（已发布或当前用户是作者/管理员）
    // 这里简化处理，仅返回已发布的内容
    if (data.publish_status !== 'published' && data.status !== 'published') {
      return NextResponse.json({
        success: false,
        error: '公告未发布',
      }, { status: 403 });
    }

    // 增加浏览次数
    await supabase
      .from('announcements')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', id);

    const announcement: Announcement = {
      id: data.id,
      title: data.title,
      summary: data.summary,
      content: data.content,
      type: data.type,
      category: data.category,
      mediaLevel: data.media_level,
      authorId: data.author_id,
      authorName: data.author_name,
      department: data.department,
      coverImage: data.cover_image,
      images: data.images || [],
      attachments: data.attachments || [],
      isExternal: data.is_external,
      publishStatus: data.publish_status,
      publishedAt: data.published_at,
      scheduledPublishAt: data.scheduled_publish_at,
      unpublishedAt: data.unpublished_at,
      autoUnpublish: data.auto_unpublish,
      autoUnpublishAt: data.auto_unpublish_at,
      externalId: data.external_id,
      status: data.status,
      viewCount: (data.view_count || 0) + 1,
      isPinned: data.is_pinned,
      pinOrder: data.pin_order,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json({
      success: true,
      data: announcement,
    });

  } catch (error) {
    console.error('Get announcement error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取公告失败',
    }, { status: 500 });
  }
}
