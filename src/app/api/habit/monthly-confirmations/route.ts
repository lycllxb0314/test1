import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取月度确认记录
 * 查询参数：
 * - studentId: 学生ID
 * - month: 月份 YYYY-MM
 * - status: pending_parent, pending_teacher, completed
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const month = searchParams.get('month');
    const status = searchParams.get('status');

    // 构建查询
    let query = client
      .from('habit_monthly_confirmations')
      .select('*')
      .order('month', { ascending: false });

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    if (month) {
      query = query.eq('month', month);
    }

    if (status) {
      if (status === 'pending_parent') {
        query = query.eq('parent_confirmed', false);
      } else if (status === 'pending_teacher') {
        query = query.eq('parent_confirmed', true).eq('teacher_reviewed', false);
      } else if (status === 'completed') {
        query = query.eq('teacher_reviewed', true);
      }
    }

    const { data, error } = await query.limit(100);

    if (error) {
      throw error;
    }

    // 转换为前端格式
    const formattedData = (data || []).map(record => ({
      id: record.id,
      studentId: record.student_id,
      month: record.month,
      parentConfirmed: record.parent_confirmed,
      parentConfirmedAt: record.parent_confirmed_at,
      parentSignature: record.parent_signature,
      parentNotes: record.parent_notes,
      teacherReviewed: record.teacher_reviewed,
      teacherReviewedAt: record.teacher_reviewed_at,
      teacherId: record.teacher_id,
      teacherName: record.teacher_name,
      teacherNotes: record.teacher_notes,
      teacherRating: record.teacher_rating,
      totalScore: record.total_score,
      categoriesCompleted: record.categories_completed,
      goalsCompleted: record.goals_completed,
      status: record.teacher_reviewed 
        ? 'completed' 
        : record.parent_confirmed 
          ? 'pending_teacher' 
          : 'pending_parent',
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Failed to fetch monthly confirmations:', error);
    return NextResponse.json({
      success: false,
      error: '获取月度确认记录失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建或更新月度确认记录（家长签字）
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      studentId,
      month,
      parentSignature,
      parentNotes,
    } = body;

    if (!studentId || !month || !parentSignature) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数',
      }, { status: 400 });
    }

    // 获取学生统计数据
    const { data: goals } = await client
      .from('student_goals')
      .select('*')
      .eq('student_id', studentId)
      .eq('month', month);

    const { data: assessments } = await client
      .from('habit_assessments')
      .select('score, category')
      .eq('student_id', studentId);

    // 计算统计数据
    const totalScore = (assessments || []).reduce((sum, a) => sum + (a.score || 0), 0);
    const categoriesCompleted = [...new Set((goals || []).filter(g => g.status === 'completed').map(g => g.category))];
    const goalsCompleted = (goals || []).filter(g => g.status === 'completed').length;

    // 检查是否已存在记录
    const { data: existing } = await client
      .from('habit_monthly_confirmations')
      .select('id')
      .eq('student_id', studentId)
      .eq('month', month)
      .single();

    let result;
    if (existing) {
      // 更新现有记录
      const { data, error } = await client
        .from('habit_monthly_confirmations')
        .update({
          parent_confirmed: true,
          parent_confirmed_at: new Date().toISOString(),
          parent_signature: parentSignature,
          parent_notes: parentNotes,
          total_score: totalScore,
          categories_completed: categoriesCompleted,
          goals_completed: goalsCompleted,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // 创建新记录
      const { data, error } = await client
        .from('habit_monthly_confirmations')
        .insert({
          student_id: studentId,
          month,
          parent_confirmed: true,
          parent_confirmed_at: new Date().toISOString(),
          parent_signature: parentSignature,
          parent_notes: parentNotes,
          total_score: totalScore,
          categories_completed: categoriesCompleted,
          goals_completed: goalsCompleted,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        status: 'pending_teacher',
      },
    });
  } catch (error) {
    console.error('Failed to create monthly confirmation:', error);
    return NextResponse.json({
      success: false,
      error: '提交月度确认失败',
    }, { status: 500 });
  }
}

/**
 * PATCH - 班主任审核
 */
export async function PATCH(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      id,
      teacherId,
      teacherName,
      teacherNotes,
      teacherRating,
    } = body;

    if (!id || !teacherId || !teacherName) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数',
      }, { status: 400 });
    }

    const { data, error } = await client
      .from('habit_monthly_confirmations')
      .update({
        teacher_reviewed: true,
        teacher_reviewed_at: new Date().toISOString(),
        teacher_id: teacherId,
        teacher_name: teacherName,
        teacher_notes: teacherNotes,
        teacher_rating: teacherRating,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        status: 'completed',
      },
    });
  } catch (error) {
    console.error('Failed to review monthly confirmation:', error);
    return NextResponse.json({
      success: false,
      error: '审核失败',
    }, { status: 500 });
  }
}
