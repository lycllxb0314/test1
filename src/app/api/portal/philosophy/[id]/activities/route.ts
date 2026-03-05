/**
 * 童心教育活动内容 API
 * 
 * 获取指定板块下的活动内容列表
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface ActivityItem {
  id: string;
  categoryId: string;
  title: string;
  image: string;
  date?: string;
  summary?: string;
  content?: string;
  sortOrder: number;
}

/**
 * 获取指定板块下的活动内容
 * 
 * Query params:
 * - limit: 返回数量（默认 20）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // 先验证板块是否存在
    const { data: category, error: categoryError } = await supabase
      .from('child_heart_paths')
      .select('id, title, subtitle, icon')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (categoryError || !category) {
      return NextResponse.json({
        success: false,
        error: '板块不存在',
      }, { status: 404 });
    }

    // 获取活动内容
    const { data, error } = await supabase
      .from('philosophy_activities')
      .select('*')
      .eq('category_id', id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch activities:', error);
      return NextResponse.json({
        success: false,
        error: '获取活动内容失败',
      }, { status: 500 });
    }

    const activities: ActivityItem[] = (data || []).map(item => ({
      id: item.id,
      categoryId: item.category_id,
      title: item.title,
      image: item.image,
      date: item.date,
      summary: item.summary,
      content: item.content,
      sortOrder: item.sort_order,
    }));

    return NextResponse.json({
      success: true,
      data: {
        category,
        activities,
      },
    });

  } catch (error) {
    console.error('Activities API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取数据失败',
    }, { status: 500 });
  }
}
