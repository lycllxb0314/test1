import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取习惯目标列表
 * 查询参数：
 * - category: 习惯类别
 * - gradeLevel: 年级段
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const gradeLevel = searchParams.get('gradeLevel');

    let query = client
      .from('habit_goals')
      .select('*')
      .eq('is_active', true)
      .order('code', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }
    if (gradeLevel) {
      query = query.eq('grade_level', gradeLevel);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Failed to fetch habit goals:', error);
    return NextResponse.json({
      success: false,
      error: '获取习惯目标失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建习惯目标
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await client
      .from('habit_goals')
      .insert({
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: '习惯目标创建成功',
    });
  } catch (error) {
    console.error('Failed to create habit goal:', error);
    return NextResponse.json({
      success: false,
      error: '创建习惯目标失败',
    }, { status: 500 });
  }
}
