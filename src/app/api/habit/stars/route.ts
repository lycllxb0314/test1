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

    // 构建查询 - 简化查询
    let query = client
      .from('habit_stars')
      .select('*')
      .order('total_score', { ascending: false })
      .limit(limit);

    // 应用筛选条件
    if (month) {
      query = query.eq('month', month);
    }

    if (grade) {
      query = query.eq('grade', parseInt(grade));
    }

    if (category) {
      query = query.contains('categories', [category]);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 如果有数据，获取学生信息补充
    let enrichedData = data || [];
    if (enrichedData.length > 0) {
      // 获取所有学生ID
      const studentIds = [...new Set(enrichedData.map(s => s.student_id).filter(Boolean))];
      
      if (studentIds.length > 0) {
        // 查询学生信息
        const { data: studentsData } = await client
          .from('students')
          .select('id, name, student_number, grade, class_id, class_name')
          .in('id', studentIds);
        
        const studentMap = (studentsData || []).reduce((acc, s) => {
          acc[s.id] = s;
          return acc;
        }, {} as Record<string, { name: string; student_number: string; grade: number; class_id: string; class_name: string }>);
        
        // 补充学生信息
        enrichedData = enrichedData.map(star => {
          const student = studentMap[star.student_id];
          return {
            id: star.id,
            studentId: star.student_id,
            studentName: student?.name || '',
            studentNumber: student?.student_number || '',
            grade: student?.grade || star.grade || 0,
            className: student?.class_name || '',
            month: star.month,
            categories: star.categories || [],
            totalScore: star.total_score || 0,
            achievements: star.achievements || '',
          };
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: enrichedData,
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

    const { studentId, month, categories, totalScore, achievements, grade } = body;

    const { data, error } = await client
      .from('habit_stars')
      .insert({
        student_id: studentId,
        month,
        categories,
        total_score: totalScore,
        achievements,
        grade,
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
