/**
 * 月度目标 API
 * 
 * GET /api/habit/monthly-goals - 获取月度目标列表
 * POST /api/habit/monthly-goals - 创建月度目标（班主任）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 目标详情类型
interface GoalDetail {
  id: string;
  category: string;
  code: string;
  title: string;
  description: string;
  difficulty: string;
}

// 数据库返回类型
interface MonthlyGoalRecord {
  id: string;
  class_id: string;
  student_id: string;
  month: string;
  academic_year: string;
  goal_template_id: string;
  custom_title: string | null;
  custom_description: string | null;
  status: string;
  approval_status: string;
  approval_comment: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  habit_goal_templates: GoalDetail | null;
}

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');
    const month = searchParams.get('month');
    const academicYear = searchParams.get('academicYear');
    const status = searchParams.get('status');
    
    let query = client
      .from('habit_student_goals')
      .select(`
        *,
        habit_goal_templates (
          id,
          category,
          code,
          title,
          description,
          difficulty
        )
      `);
    
    if (classId) {
      query = query.eq('class_id', classId);
    }
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (month) {
      query = query.eq('month', month);
    }
    if (academicYear) {
      query = query.eq('academic_year', academicYear);
    }
    if (status) {
      query = query.eq('status', status);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    const formattedData = (data || []).map((g: MonthlyGoalRecord) => ({
      id: g.id,
      classId: g.class_id,
      studentId: g.student_id,
      month: g.month,
      academicYear: g.academic_year,
      goalId: g.goal_template_id,
      customTitle: g.custom_title,
      customDescription: g.custom_description,
      status: g.status,
      approvalStatus: g.approval_status,
      approvalComment: g.approval_comment,
      approvedBy: g.approved_by,
      approvedAt: g.approved_at,
      createdAt: g.created_at,
      updatedAt: g.updated_at,
      goal: g.habit_goal_templates ? {
        id: g.habit_goal_templates.id,
        category: g.habit_goal_templates.category,
        code: g.habit_goal_templates.code,
        title: g.habit_goal_templates.title,
        description: g.habit_goal_templates.description,
        difficulty: g.habit_goal_templates.difficulty,
      } : null,
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Failed to fetch monthly goals:', error);
    return NextResponse.json({ success: false, error: '获取月度目标失败' }, { status: 500 });
  }
}

// 请求数据类型
interface GoalRequest {
  classId: string;
  studentId?: string;
  month: string;
  academicYear: string;
  goalId: string;
  customTitle?: string;
  customDescription?: string;
}

export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    // 支持批量创建
    const goals: GoalRequest[] = Array.isArray(body.goals) ? body.goals : [body];
    
    const insertData = goals.map((g: GoalRequest) => ({
      class_id: g.classId,
      student_id: g.studentId || null,
      month: g.month,
      academic_year: g.academicYear,
      goal_template_id: g.goalId,
      custom_title: g.customTitle || null,
      custom_description: g.customDescription || null,
      status: 'pending',
      approval_status: 'pending',
    }));
    
    const { data, error } = await client
      .from('habit_student_goals')
      .insert(insertData)
      .select(`
        *,
        habit_goal_templates (
          id,
          category,
          code,
          title,
          description,
          difficulty
        )
      `);
    
    if (error) {
      // 检查是否是重复创建
      if (error.code === '23505') {
        return NextResponse.json({ 
          success: false, 
          error: '该学生本月已设置相同目标，请勿重复添加' 
        }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    const formattedData = (data || []).map((g: MonthlyGoalRecord) => ({
      id: g.id,
      classId: g.class_id,
      studentId: g.student_id,
      month: g.month,
      academicYear: g.academic_year,
      goalId: g.goal_template_id,
      customTitle: g.custom_title,
      customDescription: g.custom_description,
      status: g.status,
      approvalStatus: g.approval_status,
      goal: g.habit_goal_templates ? {
        id: g.habit_goal_templates.id,
        category: g.habit_goal_templates.category,
        code: g.habit_goal_templates.code,
        title: g.habit_goal_templates.title,
        description: g.habit_goal_templates.description,
        difficulty: g.habit_goal_templates.difficulty,
      } : null,
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedData,
      message: '月度目标创建成功',
    });
  } catch (error) {
    console.error('Failed to create monthly goals:', error);
    return NextResponse.json({ success: false, error: '创建月度目标失败' }, { status: 500 });
  }
}
