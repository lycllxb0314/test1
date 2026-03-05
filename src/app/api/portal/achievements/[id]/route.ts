/**
 * 成果项目详情 API
 * 
 * 获取单个成果项目的详细信息
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface AchievementDetail {
  id: string;
  categoryId: string;
  title: string;
  image: string;
  date?: string;
  summary?: string;
  highlights?: string[];
  sortOrder: number;
  category?: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    tag?: string;
  };
}

/**
 * 获取单个成果项目详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from('achievements')
      .select(`
        *,
        category:achievement_categories(id, name, slug, icon, tag)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return NextResponse.json({
        success: false,
        error: '项目不存在',
      }, { status: 404 });
    }

    const item: AchievementDetail = {
      id: data.id,
      categoryId: data.category_id,
      title: data.title,
      image: data.image,
      date: data.date,
      summary: data.summary,
      highlights: data.highlights || [],
      sortOrder: data.sort_order,
      category: data.category ? {
        id: data.category.id,
        name: data.category.name,
        slug: data.category.slug,
        icon: data.category.icon,
        tag: data.category.tag,
      } : undefined,
    };

    return NextResponse.json({
      success: true,
      data: item,
    });

  } catch (error) {
    console.error('Achievement detail API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取数据失败',
    }, { status: 500 });
  }
}
