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

    // 构建查询 - 简化查询，不使用嵌套
    let query = client
      .from('habit_assessments')
      .select('*')
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

    // 如果有数据，获取学生信息补充
    let enrichedData = data || [];
    if (enrichedData.length > 0) {
      // 获取所有学生ID
      const studentIds = [...new Set(enrichedData.map(a => a.student_id).filter(Boolean))];
      
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
        enrichedData = enrichedData.map(assessment => {
          const student = studentMap[assessment.student_id];
          return {
            id: assessment.id,
            studentId: assessment.student_id,
            studentName: student?.name || '',
            studentNumber: student?.student_number || '',
            grade: student?.grade || 0,
            classId: student?.class_id || '',
            className: student?.class_name || '',
            category: assessment.category,
            score: assessment.score,
            evaluatorId: assessment.evaluator_id,
            evaluatorName: assessment.evaluator_name,
            evaluatorType: assessment.evaluator_type,
            context: assessment.context,
            occurredAt: assessment.occurred_at,
            notes: assessment.notes,
          };
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: enrichedData,
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
