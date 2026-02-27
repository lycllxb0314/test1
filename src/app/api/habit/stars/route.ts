import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { habitCategoryNames, type HabitCategory } from '@/types';

/**
 * GET - 获取习惯之星列表
 * 查询参数：
 * - month: 月份，如 "2024-03"
 * - grade: 年级 (1-6)
 * - category: 习惯类别
 * - limit: 返回数量限制
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const grade = searchParams.get('grade');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    // 构建查询
    let query = client
      .from('habit_stars')
      .select(`
        id,
        student_id,
        month,
        categories,
        total_score,
        achievements,
        students (
          id,
          name,
          student_number,
          grade,
          class_id,
          classes (
            id,
            name
          )
        )
      `)
      .order('total_score', { ascending: false })
      .limit(limit);

    // 应用筛选条件
    if (month) {
      query = query.eq('month', month);
    }

    if (grade) {
      // 需要通过学生表筛选年级
      const { data: studentIds } = await client
        .from('students')
        .select('id')
        .eq('grade', parseInt(grade));

      const ids = (studentIds || []).map(s => s.id);
      if (ids.length > 0) {
        query = query.in('student_id', ids);
      } else {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }
    }

    if (category) {
      query = query.contains('categories', [category]);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 格式化返回数据
    const formattedData = (data || []).map((star: any) => ({
      id: star.id,
      studentId: star.student_id,
      studentName: star.students?.name || '',
      studentNumber: star.students?.student_number || '',
      grade: star.students?.grade || 0,
      className: star.students?.classes?.name || '',
      month: star.month,
      categories: star.categories || [],
      totalScore: star.total_score || 0,
      achievements: star.achievements || '',
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Failed to fetch habit stars:', error);
    return NextResponse.json({
      success: false,
      error: '获取习惯之星列表失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建习惯之星记录
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { studentId, month, categories, totalScore, achievements } = body;

    const { data, error } = await client
      .from('habit_stars')
      .insert({
        student_id: studentId,
        month,
        categories,
        total_score: totalScore,
        achievements,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to create habit star:', error);
    return NextResponse.json({
      success: false,
      error: '创建习惯之星记录失败',
    }, { status: 500 });
  }
}
