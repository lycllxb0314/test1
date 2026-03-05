/**
 * 门户管理 API - 成果特色办学管理
 * 
 * 管理三个分类：科创教育、人文德育、艺体心理
 * 每个分类下有多个项目
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/** 成果分类 */
export type AchievementCategory = 'science' | 'moral' | 'art';

interface AchievementItemInput {
  id?: string;
  category: AchievementCategory;
  title: string;
  image: string;
  imageKey?: string;  // 对象存储的key
  date?: string;
  summary?: string;
  highlights?: string[];  // 亮点标签
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * GET - 获取成果特色办学列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const category = searchParams.get('category') as AchievementCategory | null;

    let query = supabase
      .from('achievements')
      .select('*')
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Achievements GET error:', error);
      return NextResponse.json({ success: false, error: '获取数据失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Achievements GET error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

/**
 * POST - 创建成果项
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body: AchievementItemInput = await request.json();

    const { data, error } = await supabase
      .from('achievements')
      .insert({
        category: body.category,
        title: body.title,
        image: body.image,
        image_key: body.imageKey,
        date: body.date || '',
        summary: body.summary || '',
        highlights: body.highlights || [],
        sort_order: body.sortOrder || 0,
        is_active: body.isActive ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Achievements POST error:', error);
      return NextResponse.json({ success: false, error: '创建失败: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Achievements POST error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

/**
 * PUT - 更新成果项
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
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.image !== undefined) updateData.image = updates.image;
    if (updates.imageKey !== undefined) updateData.image_key = updates.imageKey;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.summary !== undefined) updateData.summary = updates.summary;
    if (updates.highlights !== undefined) updateData.highlights = updates.highlights;
    if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('achievements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Achievements PUT error:', error);
      return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Achievements PUT error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

/**
 * DELETE - 删除成果项
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
      .from('achievements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Achievements DELETE error:', error);
      return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Achievements DELETE error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
