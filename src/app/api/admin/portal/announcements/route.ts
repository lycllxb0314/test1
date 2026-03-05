/**
 * 门户公告/新闻管理 API
 * 
 * 管理发布到主页的校园公告和新闻动态
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { AnnouncementType, NewsCategory, MediaLevel } from '@/types/approval';

/** 创建/更新请求体 */
interface AnnouncementInput {
  id?: string;
  title: string;
  summary?: string;
  content?: string;
  type: 'announcement' | 'news';
  category?: string;
  mediaLevel?: MediaLevel;
  department?: string;
  coverImage?: string;
  images?: string[];
  isExternal?: boolean;
  publishStatus?: 'pending' | 'scheduled' | 'published' | 'unpublished';
  publishedAt?: string;
  scheduledPublishAt?: string;
  isPinned?: boolean;
  pinOrder?: number;
  isActive?: boolean;
}

/**
 * GET - 获取公告/新闻列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('announcements')
      .select('*')
      .in('type', ['announcement', 'news'])
      .order('is_pinned', { ascending: false })
      .order('pin_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type === 'announcement') {
      query = query.eq('type', 'announcement');
    } else if (type === 'news') {
      query = query.eq('type', 'news');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch announcements:', error);
      return NextResponse.json({ success: false, error: '获取失败: ' + error.message }, { status: 500 });
    }

    // 映射数据
    const items = (data || []).map(item => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      content: item.content,
      type: item.type,
      category: item.category,
      mediaLevel: item.media_level,
      department: item.department,
      coverImage: item.cover_image,
      images: item.images || [],
      isExternal: item.is_external,
      publishStatus: item.publish_status,
      publishedAt: item.published_at,
      scheduledPublishAt: item.scheduled_publish_at,
      isPinned: item.is_pinned,
      pinOrder: item.pin_order,
      viewCount: item.view_count || 0,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error('Announcements GET error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

/**
 * POST - 创建公告/新闻
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body: AnnouncementInput = await request.json();

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title: body.title,
        summary: body.summary || '',
        content: body.content || '',
        type: body.type,
        category: body.category || null,
        media_level: body.mediaLevel || null,
        department: body.department || '学校办公室',
        cover_image: body.coverImage || null,
        images: body.images || [],
        is_external: true, // 门户管理发布的都是外部公告
        publish_status: body.publishStatus || 'pending',
        published_at: body.publishedAt || null,
        scheduled_publish_at: body.scheduledPublishAt || null,
        is_pinned: body.isPinned || false,
        pin_order: body.pinOrder || 0,
        auto_unpublish: false,
        attachments: [],
        view_count: 0,
        status: 'published',
      })
      .select()
      .single();

    if (error) {
      console.error('Announcement POST error:', error);
      return NextResponse.json({ success: false, error: '创建失败: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Announcement POST error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

/**
 * PUT - 更新公告/新闻
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少ID' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.summary !== undefined) updateData.summary = updates.summary;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.mediaLevel !== undefined) updateData.media_level = updates.mediaLevel;
    if (updates.department !== undefined) updateData.department = updates.department;
    if (updates.coverImage !== undefined) updateData.cover_image = updates.coverImage;
    if (updates.images !== undefined) updateData.images = updates.images;
    if (updates.isExternal !== undefined) updateData.is_external = updates.isExternal;
    if (updates.publishStatus !== undefined) updateData.publish_status = updates.publishStatus;
    if (updates.publishedAt !== undefined) updateData.published_at = updates.publishedAt;
    if (updates.scheduledPublishAt !== undefined) updateData.scheduled_publish_at = updates.scheduledPublishAt;
    if (updates.isPinned !== undefined) updateData.is_pinned = updates.isPinned;
    if (updates.pinOrder !== undefined) updateData.pin_order = updates.pinOrder;

    const { data, error } = await supabase
      .from('announcements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Announcement PUT error:', error);
      return NextResponse.json({ success: false, error: '更新失败: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Announcement PUT error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

/**
 * DELETE - 删除公告/新闻
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Announcement DELETE error:', error);
      return NextResponse.json({ success: false, error: '删除失败: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Announcement DELETE error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
