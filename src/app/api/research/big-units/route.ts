/**
 * 大单元教学设计 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

/**
 * GET - 获取大单元教学设计列表
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
      .from('big_unit_designs')
      .select('*');
    
    if (themeId) query = query.eq('theme_id', themeId);
    if (subject) query = query.eq('subject', subject);
    if (grade) query = query.eq('grade', parseInt(grade));
    if (status) query = query.eq('status', status);
    if (creatorId) query = query.eq('creator_id', creatorId);
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error: fetchError } = await query;
    
    if (fetchError) {
      console.error('获取大单元设计失败:', fetchError);
      return NextResponse.json(error('获取大单元设计失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 解析 JSON 字段
    const designs = (data || []).map((item: Record<string, unknown>) => ({
      ...item,
      unitGoals: item.unit_goals ? JSON.parse(item.unit_goals as string) : [],
      coreKnowledge: item.core_knowledge ? JSON.parse(item.core_knowledge as string) : [],
      keyCompetencies: item.key_competencies ? JSON.parse(item.key_competencies as string) : [],
      difficultPoints: item.difficult_points ? JSON.parse(item.difficult_points as string) : [],
      errorPronePoints: item.error_prone_points ? JSON.parse(item.error_prone_points as string) : [],
      lessonDesigns: item.lesson_designs ? JSON.parse(item.lesson_designs as string) : [],
      homeworkDesigns: item.homework_designs ? JSON.parse(item.homework_designs as string) : [],
      evaluationTasks: item.evaluation_tasks ? JSON.parse(item.evaluation_tasks as string) : [],
      effectAnalysis: item.effect_analysis ? JSON.parse(item.effect_analysis as string) : null,
    }));
    
    return NextResponse.json({ success: true, data: designs });
  } catch (err) {
    console.error('大单元设计API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * POST - 创建大单元教学设计
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    
    if (!body.themeId || !body.unitName || !body.grade || !body.subject) {
      return NextResponse.json(error('缺少必填字段', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const insertData: Record<string, unknown> = {
      theme_id: body.themeId,
      unit_name: body.unitName,
      grade: body.grade,
      subject: body.subject,
      unit_goals: body.unitGoals ? JSON.stringify(body.unitGoals) : '[]',
      core_knowledge: body.coreKnowledge ? JSON.stringify(body.coreKnowledge) : '[]',
      key_competencies: body.keyCompetencies ? JSON.stringify(body.keyCompetencies) : '[]',
      difficult_points: body.difficultPoints ? JSON.stringify(body.difficultPoints) : '[]',
      error_prone_points: body.errorPronePoints ? JSON.stringify(body.errorPronePoints) : '[]',
      lesson_count: body.lessonCount || 0,
      lesson_designs: body.lessonDesigns ? JSON.stringify(body.lessonDesigns) : '[]',
      homework_designs: body.homeworkDesigns ? JSON.stringify(body.homeworkDesigns) : '[]',
      evaluation_tasks: body.evaluationTasks ? JSON.stringify(body.evaluationTasks) : '[]',
      effect_analysis: body.effectAnalysis ? JSON.stringify(body.effectAnalysis) : null,
      creator_id: user.id,
      creator_name: user.name,
      collaborator_ids: body.collaboratorIds || [],
      status: 'draft',
    };
    
    const { data, error: createError } = await supabase
      .from('big_unit_designs')
      .insert(insertData)
      .select()
      .single();
    
    if (createError) {
      console.error('创建大单元设计失败:', createError);
      return NextResponse.json(error('创建大单元设计失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data,
      message: '大单元教学设计创建成功',
    });
  } catch (err) {
    console.error('创建大单元设计API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
