/**
 * 门户管理 API - 童心教育活动内容管理
 * 
 * 管理每个板块下的具体活动内容
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface ActivityItemInput {
  id?: string;
  categoryId: string;
  title: string;
  image: string;
  imageKey?: string;
  date?: string;
  summary?: string;
  content?: string;
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * GET - 获取活动内容列表
 * 支持按板块筛选
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const categoryId = searchParams.get('categoryId');

    let query = supabase
      .from('philosophy_activities')
      .select(`
        *,
        category:child_heart_paths(id, title, icon)
      `)
      .order('category_id', { ascending: true })
      .order('sort_order', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Activities GET error:', error);
      return NextResponse.json({ success: false, error: '获取数据失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Activities GET error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

/**
 * POST - 创建活动内容
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body: ActivityItemInput = await request.json();

    if (!body.categoryId) {
      return NextResponse.json({ success: false, error: '请选择所属板块' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('philosophy_activities')
      .insert({
        category_id: body.categoryId,
        title: body.title,
        image: body.image,
        image_key: body.imageKey,
        date: body.date || '',
        summary: body.summary || '',
        content: body.content || '',
        sort_order: body.sortOrder || 0,
        is_active: body.isActive ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Activities POST error:', error);
      return NextResponse.json({ success: false, error: '创建失败: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Activities POST error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

/**
 * PUT - 更新活动内容
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
    if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.image !== undefined) updateData.image = updates.image;
    if (updates.imageKey !== undefined) updateData.image_key = updates.imageKey;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.summary !== undefined) updateData.summary = updates.summary;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('philosophy_activities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Activities PUT error:', error);
      return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Activities PUT error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

/**
 * DELETE - 删除活动内容
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
      .from('philosophy_activities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Activities DELETE error:', error);
      return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Activities DELETE error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
