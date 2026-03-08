/**
 * 单个月度目标 API
 * 
 * GET /api/habit/monthly-goals/[id] - 获取月度目标详情
 * PUT /api/habit/monthly-goals/[id] - 更新月度目标
 * DELETE /api/habit/monthly-goals/[id] - 删除月度目标
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
      .from('habit_monthly_goals')
      .select(`
        *,
        habit_goals (
          id,
          category,
          code,
          title,
          description,
          difficulty
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ success: false, error: '月度目标不存在' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        classId: data.class_id,
        studentId: data.student_id,
        month: data.month,
        academicYear: data.academic_year,
        goalId: data.goal_id,
        customTitle: data.custom_title,
        customDescription: data.custom_description,
        status: data.status,
        approvalStatus: data.approval_status,
        approvalComment: data.approval_comment,
        approvedBy: data.approved_by,
        approvedAt: data.approved_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        goal: data.habit_goals ? {
          id: data.habit_goals.id,
          category: data.habit_goals.category,
          code: data.habit_goals.code,
          title: data.habit_goals.title,
          description: data.habit_goals.description,
          difficulty: data.habit_goals.difficulty,
        } : null,
      },
    });
  } catch (error) {
    console.error('Failed to fetch monthly goal:', error);
    return NextResponse.json({ success: false, error: '获取月度目标详情失败' }, { status: 500 });
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
    
    // 基础字段更新
    if (body.customTitle !== undefined) updateData.custom_title = body.customTitle;
    if (body.customDescription !== undefined) updateData.custom_description = body.customDescription;
    if (body.status !== undefined) updateData.status = body.status;
    
    // 审核字段更新
    if (body.approvalStatus !== undefined) updateData.approval_status = body.approvalStatus;
    if (body.approvalComment !== undefined) updateData.approval_comment = body.approvalComment;
    if (body.approvedBy !== undefined) updateData.approved_by = body.approvedBy;
    if (body.approvalStatus !== undefined) {
      updateData.approved_at = new Date().toISOString();
    }
    
    const { data, error } = await client
      .from('habit_monthly_goals')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        habit_goals (
          id,
          category,
          code,
          title,
          description,
          difficulty
        )
      `)
      .single();
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        classId: data.class_id,
        studentId: data.student_id,
        month: data.month,
        academicYear: data.academic_year,
        goalId: data.goal_id,
        customTitle: data.custom_title,
        customDescription: data.custom_description,
        status: data.status,
        approvalStatus: data.approval_status,
        approvalComment: data.approval_comment,
        approvedBy: data.approved_by,
        approvedAt: data.approved_at,
        goal: data.habit_goals ? {
          id: data.habit_goals.id,
          category: data.habit_goals.category,
          code: data.habit_goals.code,
          title: data.habit_goals.title,
          description: data.habit_goals.description,
          difficulty: data.habit_goals.difficulty,
        } : null,
      },
      message: '更新成功',
    });
  } catch (error) {
    console.error('Failed to update monthly goal:', error);
    return NextResponse.json({ success: false, error: '更新月度目标失败' }, { status: 500 });
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
      .from('habit_monthly_goals')
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
    console.error('Failed to delete monthly goal:', error);
    return NextResponse.json({ success: false, error: '删除月度目标失败' }, { status: 500 });
  }
}
