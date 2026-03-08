import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { type HabitCategory } from '@/types';

/**
 * GET - 获取学生小目标列表
 * 查询参数：
 * - studentId: 学生ID（必填）
 * - month: 月份 YYYY-MM
 * - status: active, completed, expired
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const month = searchParams.get('month');
    const status = searchParams.get('status');

    if (!studentId) {
      return NextResponse.json({
        success: false,
        error: '缺少学生ID参数',
      }, { status: 400 });
    }

    // 构建查询
    let query = client
      .from('student_goals')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (month) {
      query = query.eq('month', month);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 转换为前端格式
    const formattedData = (data || []).map(goal => ({
      id: goal.id,
      studentId: goal.student_id,
      goalId: goal.goal_id,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      targetCount: goal.target_count,
      completedCount: goal.completed_count,
      startDate: goal.start_date,
      endDate: goal.end_date,
      status: goal.status,
      month: goal.month,
      progress: goal.target_count > 0 
        ? Math.round((goal.completed_count / goal.target_count) * 100) 
        : 0,
      createdAt: goal.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Failed to fetch student goals:', error);
    return NextResponse.json({
      success: false,
      error: '获取小目标失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建学生小目标
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      studentId,
      goalId,
      title,
      description,
      category,
      targetCount = 30,
      startDate,
      endDate,
      month,
    } = body;

    if (!studentId || !title || !category) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数',
      }, { status: 400 });
    }

    const { data, error } = await client
      .from('student_goals')
      .insert({
        student_id: studentId,
        goal_id: goalId,
        title,
        description,
        category,
        target_count: targetCount,
        completed_count: 0,
        start_date: startDate || new Date().toISOString().split('T')[0],
        end_date: endDate,
        month: month || new Date().toISOString().slice(0, 7),
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        title: data.title,
        category: data.category,
        targetCount: data.target_count,
        completedCount: data.completed_count,
        status: data.status,
      },
    });
  } catch (error) {
    console.error('Failed to create student goal:', error);
    return NextResponse.json({
      success: false,
      error: '创建小目标失败',
    }, { status: 500 });
  }
}

/**
 * PATCH - 更新学生小目标
 */
export async function PATCH(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { id, completedCount, status } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '缺少目标ID',
      }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (completedCount !== undefined) {
      updateData.completed_count = completedCount;
    }

    if (status) {
      updateData.status = status;
    }

    const { data, error } = await client
      .from('student_goals')
      .update(updateData)
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
        completedCount: data.completed_count,
        status: data.status,
      },
    });
  } catch (error) {
    console.error('Failed to update student goal:', error);
    return NextResponse.json({
      success: false,
      error: '更新小目标失败',
    }, { status: 500 });
  }
}
