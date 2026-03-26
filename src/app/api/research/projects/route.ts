/**
 * 项目式教学设计 API
 * 
 * 功能：
 * - GET: 获取项目式教学设计列表/详情
 * - POST: 创建项目式教学设计
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { error, ErrorCode } from '@/lib/api-route-utils';

/**
 * GET - 获取项目式教学设计列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const themeId = searchParams.get('themeId');
    const subject = searchParams.get('subject');
    const grade = searchParams.get('grade');
    const status = searchParams.get('status');
    const creatorId = searchParams.get('creatorId');
    
    let query = supabase
      .from('project_designs')
      .select('*');
    
    if (themeId) query = query.eq('theme_id', themeId);
    if (subject) query = query.contains('subjects', [subject]);
    if (grade) query = query.eq('grade', parseInt(grade));
    if (status) query = query.eq('status', status);
    if (creatorId) query = query.eq('creator_id', creatorId);
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error: fetchError } = await query;
    
    if (fetchError) {
      console.error('获取项目式设计失败:', fetchError);
      return NextResponse.json(error('获取项目式设计失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 解析 JSON 字段
    const designs = (data || []).map((item: Record<string, unknown>) => ({
      ...item,
      tasks: item.tasks ? (typeof item.tasks === 'string' ? JSON.parse(item.tasks) : item.tasks) : [],
      timeline: item.timeline ? (typeof item.timeline === 'string' ? JSON.parse(item.timeline) : item.timeline) : [],
      teamRoles: item.team_roles ? (typeof item.team_roles === 'string' ? JSON.parse(item.team_roles) : item.team_roles) : [],
      learningSheets: item.learning_sheets ? (typeof item.learning_sheets === 'string' ? JSON.parse(item.learning_sheets) : item.learning_sheets) : [],
      evaluationRubrics: item.evaluation_rubrics ? (typeof item.evaluation_rubrics === 'string' ? JSON.parse(item.evaluation_rubrics) : item.evaluation_rubrics) : [],
      implementationRecords: item.implementation_records ? (typeof item.implementation_records === 'string' ? JSON.parse(item.implementation_records) : item.implementation_records) : [],
      studentWorks: item.student_works ? (typeof item.student_works === 'string' ? JSON.parse(item.student_works) : item.student_works) : [],
    }));
    
    return NextResponse.json({ success: true, data: designs });
  } catch (err) {
    console.error('项目式教学API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * POST - 创建项目式教学设计
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    
    if (!body.themeId || !body.projectName || !body.grade || !body.subjects || !body.drivingQuestion) {
      return NextResponse.json(error('缺少必填字段', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const insertData: Record<string, unknown> = {
      theme_id: body.themeId,
      project_name: body.projectName,
      grade: body.grade,
      subjects: body.subjects,
      driving_question: body.drivingQuestion,
      project_goal: body.projectGoal || '',
      tasks: body.tasks || [],
      timeline: body.timeline || [],
      team_roles: body.teamRoles || [],
      learning_sheets: body.learningSheets || [],
      evaluation_rubrics: body.evaluationRubrics || [],
      implementation_records: body.implementationRecords || [],
      student_works: body.studentWorks || [],
      reflection: body.reflection || '',
      creator_id: user.id,
      creator_name: user.name,
      collaborator_ids: body.collaboratorIds || [],
      status: 'draft',
    };
    
    const { data, error: createError } = await supabase
      .from('project_designs')
      .insert(insertData)
      .select()
      .single();
    
    if (createError) {
      console.error('创建项目式设计失败:', createError);
      return NextResponse.json(error('创建项目式设计失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data,
      message: '项目式教学设计创建成功',
    });
  } catch (err) {
    console.error('创建项目式教学API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
