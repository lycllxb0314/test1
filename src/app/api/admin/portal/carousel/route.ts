/**
 * 门户管理 API - 轮播图管理
 * 
 * 支持增删改查操作
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/** 轮播项类型 */
type CarouselType = 'image' | 'video' | 'bilibili';

interface CarouselItemInput {
  type: CarouselType;
  image: string;
  videoUrl?: string;
  bilibiliUrl?: string;
  bilibiliBvid?: string;
  title: string;
  subtitle?: string;
  tag?: string;
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * GET - 获取轮播图列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let query = supabase
      .from('carousel_items')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: '获取数据失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Carousel GET error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

/**
 * POST - 创建轮播图项
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body: CarouselItemInput = await request.json();

    const { data, error } = await supabase
      .from('carousel_items')
      .insert({
        type: body.type || 'image',
        image: body.image,
        video_url: body.videoUrl,
        bilibili_url: body.bilibiliUrl,
        bilibili_bvid: body.bilibiliBvid,
        title: body.title,
        subtitle: body.subtitle,
        tag: body.tag,
        sort_order: body.sortOrder || 0,
        is_active: body.isActive ?? true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: '创建失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Carousel POST error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

/**
 * PUT - 更新轮播图项
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少ID' }, { status: 400 });
    }

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.image !== undefined) updateData.image = updates.image;
    if (updates.videoUrl !== undefined) updateData.video_url = updates.videoUrl;
    if (updates.bilibiliUrl !== undefined) updateData.bilibili_url = updates.bilibiliUrl;
    if (updates.bilibiliBvid !== undefined) updateData.bilibili_bvid = updates.bilibiliBvid;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.subtitle !== undefined) updateData.subtitle = updates.subtitle;
    if (updates.tag !== undefined) updateData.tag = updates.tag;
    if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('carousel_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Carousel PUT error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

/**
 * DELETE - 删除轮播图项
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
      .from('carousel_items')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Carousel DELETE error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
