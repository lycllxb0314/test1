/**
 * 单个打卡记录 API
 * 
 * GET /api/habit/records/[id] - 获取打卡记录详情
 * PUT /api/habit/records/[id] - 更新打卡记录（补打卡、班主任评价）
 * DELETE /api/habit/records/[id] - 删除打卡记录
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    
    const { data, error } = await client
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
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ success: false, error: '打卡记录不存在' }, { status: 404 });
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
        teacherComment: data.teacher_comment,
        makeUpDate: data.make_up_date,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        studentGoal: data.habit_student_goals ? {
          id: data.habit_student_goals.id,
          month: data.habit_student_goals.month,
          academicYear: data.habit_student_goals.academic_year,
          goalId: data.habit_student_goals.goal_template_id,
          goal: data.habit_student_goals.habit_goal_templates ? {
            id: data.habit_student_goals.habit_goal_templates.id,
            category: data.habit_student_goals.habit_goal_templates.category,
            code: data.habit_student_goals.habit_goal_templates.code,
            title: data.habit_student_goals.habit_goal_templates.title,
            description: data.habit_student_goals.habit_goal_templates.description,
            difficulty: data.habit_student_goals.habit_goal_templates.difficulty,
          } : null,
        } : null,
      },
    });
  } catch (error) {
    console.error('Failed to fetch record:', error);
    return NextResponse.json({ success: false, error: '获取打卡记录详情失败' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (body.status !== undefined) updateData.status = body.status;
    if (body.photoUrl !== undefined) updateData.photo_url = body.photoUrl;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.parentComment !== undefined) updateData.parent_comment = body.parentComment;
    if (body.teacherComment !== undefined) updateData.teacher_comment = body.teacherComment;
    if (body.makeUpDate !== undefined) updateData.make_up_date = body.makeUpDate;
    
    const { data, error } = await client
      .from('habit_daily_records')
      .update(updateData)
      .eq('id', id)
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
        teacherComment: data.teacher_comment,
        makeUpDate: data.make_up_date,
      },
      message: '更新成功',
    });
  } catch (error) {
    console.error('Failed to update record:', error);
    return NextResponse.json({ success: false, error: '更新打卡记录失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    
    const { error } = await client
      .from('habit_daily_records')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('Failed to delete record:', error);
    return NextResponse.json({ success: false, error: '删除打卡记录失败' }, { status: 500 });
  }
}
