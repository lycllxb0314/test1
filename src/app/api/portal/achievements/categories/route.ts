/**
 * 成果特色办学分类 API
 * 
 * 获取成果分类列表
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon: string;
  tag?: string;
  description?: string;
  sortOrder: number;
}

/**
 * 获取成果分类列表
 * 
 * Query params:
 * - limit: 返回数量（默认 10）
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const { data, error } = await supabase
      .from('achievement_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch achievement categories:', error);
      return NextResponse.json({
        success: false,
        error: '获取成果分类失败',
      }, { status: 500 });
    }

    const categories: CategoryItem[] = (data || []).map(item => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      icon: item.icon,
      tag: item.tag,
      description: item.description,
      sortOrder: item.sort_order,
    }));

    return NextResponse.json({
      success: true,
      data: categories,
    });

  } catch (error) {
    console.error('Achievement categories API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取数据失败',
    }, { status: 500 });
  }
}
