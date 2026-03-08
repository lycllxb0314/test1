import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { type HabitCategory } from '@/types';

/**
 * GET - 获取打卡记录列表
 * 查询参数：
 * - studentId: 学生ID（必填）
 * - month: 月份 YYYY-MM
 * - startDate: 开始日期
 * - endDate: 结束日期
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const month = searchParams.get('month');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!studentId) {
      return NextResponse.json({
        success: false,
        error: '缺少学生ID参数',
      }, { status: 400 });
    }

    // 构建查询
    let query = client
      .from('habit_check_ins')
      .select('*')
      .eq('student_id', studentId)
      .order('check_date', { ascending: false });

    if (month) {
      query = query.eq('student_id', studentId);
      // 添加月份过滤
      const monthStart = `${month}-01`;
      const [year, m] = month.split('-').map(Number);
      const nextMonth = m === 12 ? `${year + 1}-01` : `${year}-${(m + 1).toString().padStart(2, '0')}`;
      const monthEnd = `${nextMonth}-01`;
      query = query.gte('check_date', monthStart).lt('check_date', monthEnd);
    }

    if (startDate) {
      query = query.gte('check_date', startDate);
    }

    if (endDate) {
      query = query.lte('check_date', endDate);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      throw error;
    }

    // 转换为前端格式
    const formattedData = (data || []).map(record => ({
      id: record.id,
      studentId: record.student_id,
      studentGoalId: record.student_goal_id,
      checkDate: record.check_date,
      category: record.category,
      notes: record.notes,
      checkedBy: record.checked_by,
      checkedByType: record.checked_by_type,
      checkedByName: record.checked_by_name,
      createdAt: record.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Failed to fetch check-ins:', error);
    return NextResponse.json({
      success: false,
      error: '获取打卡记录失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建打卡记录
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      studentId,
      studentGoalId,
      checkDate,
      category,
      notes,
      checkedBy,
      checkedByType,
      checkedByName,
    } = body;

    if (!studentId) {
      return NextResponse.json({
        success: false,
        error: '缺少学生ID',
      }, { status: 400 });
    }

    const today = checkDate || new Date().toISOString().split('T')[0];

    // 检查今天是否已打卡（针对同一目标）
    if (studentGoalId) {
      const { data: existing } = await client
        .from('habit_check_ins')
        .select('id')
        .eq('student_id', studentId)
        .eq('student_goal_id', studentGoalId)
        .eq('check_date', today)
        .single();

      if (existing) {
        return NextResponse.json({
          success: false,
          error: '今日已打卡',
        }, { status: 400 });
      }
    }

    // 创建打卡记录
    const { data, error } = await client
      .from('habit_check_ins')
      .insert({
        student_id: studentId,
        student_goal_id: studentGoalId,
        check_date: today,
        category,
        notes,
        checked_by: checkedBy,
        checked_by_type: checkedByType || 'parent',
        checked_by_name: checkedByName,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 更新学生目标的完成次数
    if (studentGoalId) {
      // 手动更新完成次数
      const { data: goalData } = await client
        .from('student_goals')
        .select('completed_count')
        .eq('id', studentGoalId)
        .single();
      
      if (goalData) {
        await client
          .from('student_goals')
          .update({
            completed_count: (goalData.completed_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', studentGoalId);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        studentId: data.student_id,
        studentGoalId: data.student_goal_id,
        checkDate: data.check_date,
        category: data.category,
        notes: data.notes,
        checkedByType: data.checked_by_type,
        checkedByName: data.checked_by_name,
      },
    });
  } catch (error) {
    console.error('Failed to create check-in:', error);
    return NextResponse.json({
      success: false,
      error: '打卡失败',
    }, { status: 500 });
  }
}
