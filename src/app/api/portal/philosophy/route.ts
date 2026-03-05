/**
 * 童心教育 API
 * 
 * 获取童心教育六大路径数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/** 童心教育路径 */
export interface ChildHeartPath {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  image: string;
  description?: string;
  sortOrder: number;
}

/**
 * 获取童心教育路径数据
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
      .from('child_heart_paths')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch child heart paths:', error);
      return NextResponse.json({
        success: false,
        error: '获取童心教育数据失败',
      }, { status: 500 });
    }

    const paths: ChildHeartPath[] = (data || []).map(item => ({
      id: item.id,
      icon: item.icon,
      title: item.title,
      subtitle: item.subtitle,
      image: item.image,
      description: item.description,
      sortOrder: item.sort_order,
    }));

    return NextResponse.json({
      success: true,
      data: paths,
    });

  } catch (error) {
    console.error('Philosophy API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取数据失败',
    }, { status: 500 });
  }
}
