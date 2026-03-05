/**
 * 办学荣誉 API
 * 
 * 获取学校办学荣誉数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/** 办学荣誉 */
export interface SchoolHonor {
  id: string;
  title: string;
  year?: string;
  description?: string;
  icon?: string;
  sortOrder: number;
}

/**
 * 获取办学荣誉数据
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
      .from('school_honors')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch school honors:', error);
      return NextResponse.json({
        success: false,
        error: '获取办学荣誉数据失败',
      }, { status: 500 });
    }

    const honors: SchoolHonor[] = (data || []).map(item => ({
      id: item.id,
      title: item.title,
      year: item.year,
      description: item.description,
      icon: item.icon,
      sortOrder: item.sort_order,
    }));

    return NextResponse.json({
      success: true,
      data: honors,
    });

  } catch (error) {
    console.error('Honors API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取数据失败',
    }, { status: 500 });
  }
}
