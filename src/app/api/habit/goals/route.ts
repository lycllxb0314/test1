import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { type HabitCategory } from '@/types';

/**
 * GET - 获取习惯养成目标列表
 * 查询参数：
 * - category: 习惯类别
 * - status: 状态 (active/completed/expired)
 * - grade: 目标年级
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const grade = searchParams.get('grade');

    // 构建查询
    let query = client
      .from('habit_goals')
      .select('*')
      .order('created_at', { ascending: false });

    // 应用筛选条件
    if (category) {
      query = query.eq('category', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (grade) {
      query = query.contains('target_grades', [parseInt(grade)]);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 格式化返回数据
    const formattedData = (data || []).map((goal: any) => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      targetGrades: goal.target_grades || [],
      targetClasses: goal.target_classes || [],
      startDate: goal.start_date,
      endDate: goal.end_date,
      status: goal.status,
      progress: goal.progress || 0,
      studentCount: goal.student_count || 0,
      completedCount: goal.completed_count || 0,
      createdAt: goal.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Failed to fetch habit goals:', error);
    return NextResponse.json({
      success: false,
      error: '获取习惯养成目标失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建习惯养成目标
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      title,
      description,
      category,
      targetGrades,
      targetClasses,
      startDate,
      endDate,
    } = body;

    // 计算涉及学生数量
    let studentCount = 0;
    if (targetClasses && targetClasses.length > 0) {
      const { count } = await client
        .from('students')
        .select('id', { count: 'exact', head: true })
        .in('class_id', targetClasses)
        .eq('status', 'active');
      studentCount = count || 0;
    } else if (targetGrades && targetGrades.length > 0) {
      const { count } = await client
        .from('students')
        .select('id', { count: 'exact', head: true })
        .in('grade', targetGrades)
        .eq('status', 'active');
      studentCount = count || 0;
    }

    const { data, error } = await client
      .from('habit_goals')
      .insert({
        title,
        description,
        category,
        target_grades: targetGrades || [],
        target_classes: targetClasses || [],
        start_date: startDate,
        end_date: endDate,
        status: 'active',
        progress: 0,
        student_count: studentCount,
        completed_count: 0,
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
    console.error('Failed to create habit goal:', error);
    return NextResponse.json({
      success: false,
      error: '创建习惯养成目标失败',
    }, { status: 500 });
  }
}

/**
 * PUT - 更新习惯养成目标
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { id, ...updates } = body;

    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.progress !== undefined) updateData.progress = updates.progress;
    if (updates.completedCount !== undefined) updateData.completed_count = updates.completedCount;

    const { data, error } = await client
      .from('habit_goals')
      .update(updateData)
      .eq('id', id)
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
    console.error('Failed to update habit goal:', error);
    return NextResponse.json({
      success: false,
      error: '更新习惯养成目标失败',
    }, { status: 500 });
  }
}

/**
 * DELETE - 删除习惯养成目标
 */
export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '缺少目标ID',
      }, { status: 400 });
    }

    const { error } = await client
      .from('habit_goals')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Failed to delete habit goal:', error);
    return NextResponse.json({
      success: false,
      error: '删除习惯养成目标失败',
    }, { status: 500 });
  }
}
