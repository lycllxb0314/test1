import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { type HabitCategory } from '@/types';

/**
 * GET - 获取习惯评价记录列表
 * 查询参数：
 * - studentId: 学生ID
 * - category: 习惯类别
 * - startDate: 开始日期
 * - endDate: 结束日期
 * - limit: 返回数量限制
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    // 构建查询
    let query = client
      .from('habit_assessments')
      .select(`
        id,
        student_id,
        category,
        score,
        evaluator_id,
        evaluator_name,
        evaluator_type,
        context,
        occurred_at,
        notes,
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
      .order('occurred_at', { ascending: false })
      .limit(limit);

    // 应用筛选条件
    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (startDate) {
      query = query.gte('occurred_at', startDate);
    }

    if (endDate) {
      query = query.lte('occurred_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 格式化返回数据
    const formattedData = (data || []).map((assessment: any) => ({
      id: assessment.id,
      studentId: assessment.student_id,
      studentName: assessment.students?.name || '',
      grade: assessment.students?.grade || 0,
      className: assessment.students?.classes?.name || '',
      category: assessment.category,
      score: assessment.score,
      evaluatorId: assessment.evaluator_id,
      evaluatorName: assessment.evaluator_name,
      evaluatorType: assessment.evaluator_type,
      context: assessment.context,
      occurredAt: assessment.occurred_at,
      notes: assessment.notes,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Failed to fetch habit assessments:', error);
    return NextResponse.json({
      success: false,
      error: '获取习惯评价记录失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建习惯评价记录
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      studentId,
      category,
      score,
      evaluatorId,
      evaluatorName,
      evaluatorType,
      context,
      notes,
    } = body;

    const { data, error } = await client
      .from('habit_assessments')
      .insert({
        student_id: studentId,
        category,
        score,
        evaluator_id: evaluatorId,
        evaluator_name: evaluatorName,
        evaluator_type: evaluatorType || 'teacher',
        context,
        notes,
        occurred_at: new Date().toISOString(),
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
    console.error('Failed to create habit assessment:', error);
    return NextResponse.json({
      success: false,
      error: '创建习惯评价记录失败',
    }, { status: 500 });
  }
}
