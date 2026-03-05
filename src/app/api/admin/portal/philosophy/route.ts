/**
 * 门户管理 API - 童心教育管理
 * 
 * 支持增删改查操作
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface PhilosophyItemInput {
  icon: string;
  title: string;
  subtitle: string;
  image: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * GET - 获取童心教育列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let query = supabase
      .from('child_heart_paths')
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
    console.error('Philosophy GET error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

/**
 * POST - 创建童心教育项
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body: PhilosophyItemInput = await request.json();

    const { data, error } = await supabase
      .from('child_heart_paths')
      .insert({
        icon: body.icon,
        title: body.title,
        subtitle: body.subtitle,
        image: body.image,
        description: body.description,
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
    console.error('Philosophy POST error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

/**
 * PUT - 更新童心教育项
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
    if (updates.icon !== undefined) updateData.icon = updates.icon;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.subtitle !== undefined) updateData.subtitle = updates.subtitle;
    if (updates.image !== undefined) updateData.image = updates.image;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('child_heart_paths')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Philosophy PUT error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

/**
 * DELETE - 删除童心教育项
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
      .from('child_heart_paths')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Philosophy DELETE error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
