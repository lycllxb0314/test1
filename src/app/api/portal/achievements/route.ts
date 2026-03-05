/**
 * 成果特色办学项目 API
 * 
 * 获取成果项目列表，支持按分类筛选
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface AchievementItem {
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
  };
}

/**
 * 获取成果项目列表
 * 
 * Query params:
 * - category: 分类ID或slug（可选）
 * - limit: 返回数量（默认 20）
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('achievements')
      .select(`
        *,
        category:achievement_categories(id, name, slug, icon)
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(limit);

    // 按分类筛选
    if (category) {
      // 判断是ID还是slug
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
      
      if (isUuid) {
        query = query.eq('category_id', category);
      } else {
        // 通过slug查询分类ID
        const { data: categoryData } = await supabase
          .from('achievement_categories')
          .select('id')
          .eq('slug', category)
          .eq('is_active', true)
          .single();
        
        if (categoryData) {
          query = query.eq('category_id', categoryData.id);
        }
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch achievements:', error);
      return NextResponse.json({
        success: false,
        error: '获取成果项目失败',
      }, { status: 500 });
    }

    const items: AchievementItem[] = (data || []).map(item => ({
      id: item.id,
      categoryId: item.category_id,
      title: item.title,
      image: item.image,
      date: item.date,
      summary: item.summary,
      highlights: item.highlights || [],
      sortOrder: item.sort_order,
      category: item.category ? {
        id: item.category.id,
        name: item.category.name,
        slug: item.category.slug,
        icon: item.category.icon,
      } : undefined,
    }));

    return NextResponse.json({
      success: true,
      data: items,
    });

  } catch (error) {
    console.error('Achievements API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取数据失败',
    }, { status: 500 });
  }
}
