/**
 * 打卡记录 API
 * 
 * GET /api/habit/records - 获取打卡记录
 * POST /api/habit/records - 创建打卡记录（家长）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const monthlyGoalId = searchParams.get('monthlyGoalId');
    const studentId = searchParams.get('studentId');
    const month = searchParams.get('month');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    let query = client
      .from('habit_daily_records')
      .select(`
        *,
        habit_student_goals (
          id,
          month,
          academic_year,
          goal_template_id,
          habit_goal_templates (
            id,
            category,
            code,
            title,
            description,
            difficulty
          )
        )
      `);
    
    if (monthlyGoalId) {
      query = query.eq('monthly_goal_id', monthlyGoalId);
    }
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (month) {
      query = query.eq('month', month);
    }
    if (startDate) {
      query = query.gte('check_date', startDate);
    }
    if (endDate) {
      query = query.lte('check_date', endDate);
    }
    
    query = query
      .order('check_date', { ascending: false })
      .limit(limit);
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    const formattedData = (data || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      studentGoalId: r.student_goal_id,
      studentId: r.student_id,
      checkDate: r.check_date,
      month: r.month,
      status: r.status,
      photoUrl: r.photo_url,
      description: r.description,
      parentComment: r.parent_comment,
      teacherComment: r.teacher_comment,
      makeUpDate: r.make_up_date,
      createdBy: r.created_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      studentGoal: r.habit_student_goals ? {
        id: (r.habit_student_goals as Record<string, unknown>).id,
        month: (r.habit_student_goals as Record<string, unknown>).month,
        academicYear: (r.habit_student_goals as Record<string, unknown>).academic_year,
        goalId: (r.habit_student_goals as Record<string, unknown>).goal_template_id,
        goal: (r.habit_student_goals as Record<string, unknown>).habit_goal_templates ? {
          id: ((r.habit_student_goals as Record<string, unknown>).habit_goal_templates as Record<string, unknown>).id,
          category: ((r.habit_student_goals as Record<string, unknown>).habit_goal_templates as Record<string, unknown>).category,
          code: ((r.habit_student_goals as Record<string, unknown>).habit_goal_templates as Record<string, unknown>).code,
          title: ((r.habit_student_goals as Record<string, unknown>).habit_goal_templates as Record<string, unknown>).title,
          description: ((r.habit_student_goals as Record<string, unknown>).habit_goal_templates as Record<string, unknown>).description,
          difficulty: ((r.habit_student_goals as Record<string, unknown>).habit_goal_templates as Record<string, unknown>).difficulty,
        } : null,
      } : null,
    }));
    
    // 统计打卡情况
    const statistics = {
      total: formattedData.length,
      completed: formattedData.filter(r => r.status === 'completed').length,
      pending: formattedData.filter(r => r.status === 'pending').length,
      missed: formattedData.filter(r => r.status === 'missed').length,
      makeUp: formattedData.filter(r => r.status === 'make_up').length,
    };
    
    return NextResponse.json({
      success: true,
      data: formattedData,
      statistics,
    });
  } catch (error) {
    console.error('Failed to fetch records:', error);
    return NextResponse.json({ success: false, error: '获取打卡记录失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    const {
      studentGoalId,
      studentId,
      checkDate,
      month,
      photoUrl,
      description,
      parentComment,
      createdBy,
    } = body;
    
    if (!studentGoalId || !checkDate || !month) {
      return NextResponse.json({ success: false, error: '学生目标ID、打卡日期、月份为必填项' }, { status: 400 });
    }
    
    // 检查是否已存在当天的打卡记录
    const { data: existingRecord } = await client
      .from('habit_daily_records')
      .select('id')
      .eq('student_goal_id', studentGoalId)
      .eq('check_date', checkDate)
      .single();
    
    if (existingRecord) {
      // 更新已有记录
      const { data, error } = await client
        .from('habit_daily_records')
        .update({
          status: 'completed',
          photo_url: photoUrl || null,
          description: description || null,
          parent_comment: parentComment || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRecord.id)
        .select()
        .single();
      
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        data: {
          id: data.id,
          studentGoalId: data.student_goal_id,
          studentId: data.student_id,
          checkDate: data.check_date,
          month: data.month,
          status: data.status,
          photoUrl: data.photo_url,
          description: data.description,
          parentComment: data.parent_comment,
        },
        message: '打卡记录更新成功',
      });
    }
    
    // 创建新记录
    const { data, error } = await client
      .from('habit_daily_records')
      .insert({
        student_goal_id: studentGoalId,
        student_id: studentId,
        check_date: checkDate,
        month,
        status: 'completed',
        photo_url: photoUrl || null,
        description: description || null,
        parent_comment: parentComment || null,
        created_by: createdBy || null,
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
        studentGoalId: data.student_goal_id,
        studentId: data.student_id,
        checkDate: data.check_date,
        month: data.month,
        status: data.status,
        photoUrl: data.photo_url,
        description: data.description,
        parentComment: data.parent_comment,
      },
      message: '打卡成功',
    });
  } catch (error) {
    console.error('Failed to create record:', error);
    return NextResponse.json({ success: false, error: '创建打卡记录失败' }, { status: 500 });
  }
}
