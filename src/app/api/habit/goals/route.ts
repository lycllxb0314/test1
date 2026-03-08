/**
 * 习惯目标库 API
 * 
 * GET /api/habit/goals - 获取目标列表
 * POST /api/habit/goals - 创建目标（德育处）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { HABIT_CATEGORIES } from '@/config/habit';

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category');
    const gradeRange = searchParams.get('gradeRange');
    const isActive = searchParams.get('isActive');
    
    let query = client
      .from('habit_goal_templates')
      .select('*', { count: 'exact' })
      .order('category')
      .order('sort_order');
    
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (isActive !== null && isActive !== 'all') {
      query = query.eq('is_active', isActive === 'true');
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // 转换数据格式
    const formattedData = (data || []).map(g => ({
      id: g.id,
      category: g.category,
      code: g.code,
      title: g.title,
      description: g.description,
      gradeRange: g.grade_range,
      difficulty: g.difficulty,
      isActive: g.is_active,
      sortOrder: g.sort_order,
      createdAt: g.created_at,
      updatedAt: g.updated_at,
    }));
    
    // 按类别分组统计
    const categoryStats: Record<string, number> = {};
    formattedData.forEach(g => {
      categoryStats[g.category] = (categoryStats[g.category] || 0) + 1;
    });
    
    return NextResponse.json({
      success: true,
      data: formattedData,
      statistics: {
        total: count || 0,
        active: formattedData.filter(g => g.isActive).length,
        categoryStats,
      },
    });
  } catch (error) {
    console.error('Failed to fetch habit goals:', error);
    return NextResponse.json({ success: false, error: '获取目标列表失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    const { category, code, title, description, gradeRange, difficulty } = body;
    
    if (!category || !title) {
      return NextResponse.json({ success: false, error: '类别和标题为必填项' }, { status: 400 });
    }
    
    const { data, error } = await client
      .from('habit_goal_templates')
      .insert({
        category,
        code: code || null,
        title,
        description: description || null,
        grade_range: gradeRange || '1-6',
        difficulty: difficulty || 'medium',
        is_active: true,
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        category: data.category,
        code: data.code,
        title: data.title,
        description: data.description,
        gradeRange: data.grade_range,
        difficulty: data.difficulty,
        isActive: data.is_active,
      },
      message: '目标创建成功',
    });
  } catch (error) {
    console.error('Failed to create habit goal:', error);
    return NextResponse.json({ success: false, error: '创建目标失败' }, { status: 500 });
  }
}
