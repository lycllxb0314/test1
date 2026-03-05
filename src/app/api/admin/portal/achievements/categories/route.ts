/**
 * 门户管理 API - 成果分类管理
 * 
 * 管理三大分类：科创教育、人文德育、艺体心理
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface CategoryInput {
  name: string;
  slug: string;
  icon: string;
  tag?: string;
  description?: string;
  featuredAwardTitle?: string;
  featuredAwardContent?: string;
  stats?: Array<{ label: string; value: string }>;
  honorsList?: Array<{ title: string; subtitle: string }>;
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * GET - 获取分类列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let query = supabase
      .from('achievement_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Categories GET error:', error);
      return NextResponse.json({ success: false, error: '获取数据失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

/**
 * POST - 创建分类
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body: CategoryInput = await request.json();

    const { data, error } = await supabase
      .from('achievement_categories')
      .insert({
        name: body.name,
        slug: body.slug,
        icon: body.icon,
        tag: body.tag || '',
        description: body.description || '',
        featured_award_title: body.featuredAwardTitle || null,
        featured_award_content: body.featuredAwardContent || null,
        stats: body.stats || [],
        honors_list: body.honorsList || [],
        sort_order: body.sortOrder || 0,
        is_active: body.isActive ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Categories POST error:', error);
      return NextResponse.json({ success: false, error: '创建失败: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Categories POST error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

/**
 * PUT - 更新分类
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
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.slug !== undefined) updateData.slug = updates.slug;
    if (updates.icon !== undefined) updateData.icon = updates.icon;
    if (updates.tag !== undefined) updateData.tag = updates.tag;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.featuredAwardTitle !== undefined) updateData.featured_award_title = updates.featuredAwardTitle;
    if (updates.featuredAwardContent !== undefined) updateData.featured_award_content = updates.featuredAwardContent;
    if (updates.stats !== undefined) updateData.stats = updates.stats;
    if (updates.honorsList !== undefined) updateData.honors_list = updates.honorsList;
    if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('achievement_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Categories PUT error:', error);
      return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Categories PUT error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

/**
 * DELETE - 删除分类
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少ID' }, { status: 400 });
    }

    // 删除分类下的所有项目
    const { error: deleteItemsError } = await supabase
      .from('achievements')
      .delete()
      .eq('category_id', id);

    if (deleteItemsError) {
      console.error('Delete items error:', deleteItemsError);
      return NextResponse.json({ 
        success: false, 
        error: '删除分类项目失败' 
      }, { status: 500 });
    }

    const { error } = await supabase
      .from('achievement_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Categories DELETE error:', error);
      return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Categories DELETE error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
