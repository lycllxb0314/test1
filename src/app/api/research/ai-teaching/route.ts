/**
 * AI赋能教学应用 API
 * 
 * 功能：
 * - GET: 获取AI赋能教学应用列表
 * - POST: 创建AI赋能教学应用
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { error, ErrorCode } from '@/lib/api';
import { 
  AI_TOOL_TYPE_LABELS, 
  type AIToolType 
} from '@/types/research';

/**
 * GET - 获取AI赋能教学应用列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const themeId = searchParams.get('themeId');
    const subject = searchParams.get('subject');
    const aiToolType = searchParams.get('aiToolType');
    const status = searchParams.get('status');
    const creatorId = searchParams.get('creatorId');
    
    let query = supabase
      .from('ai_teaching_apps')
      .select('*');
    
    if (themeId) query = query.eq('theme_id', themeId);
    if (subject) query = query.eq('subject', subject);
    if (aiToolType) query = query.eq('ai_tool_type', aiToolType);
    if (status) query = query.eq('status', status);
    if (creatorId) query = query.eq('creator_id', creatorId);
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error: fetchError } = await query;
    
    if (fetchError) {
      console.error('获取AI教学应用失败:', fetchError);
      return NextResponse.json(error('获取AI教学应用失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 解析 JSON 字段
    const apps = (data || []).map((item: Record<string, unknown>) => ({
      ...item,
      aiToolTypeLabel: AI_TOOL_TYPE_LABELS[item.ai_tool_type as AIToolType] || item.ai_tool_type,
      operationSteps: item.operation_steps ? (typeof item.operation_steps === 'string' ? JSON.parse(item.operation_steps) : item.operation_steps) : [],
      prompts: item.prompts ? (typeof item.prompts === 'string' ? JSON.parse(item.prompts) : item.prompts) : [],
      generatedContent: item.generated_content ? (typeof item.generated_content === 'string' ? JSON.parse(item.generated_content) : item.generated_content) : null,
      optimizedContent: item.optimized_content ? (typeof item.optimized_content === 'string' ? JSON.parse(item.optimized_content) : item.optimized_content) : null,
      effectAnalysis: item.effect_analysis ? (typeof item.effect_analysis === 'string' ? JSON.parse(item.effect_analysis) : item.effect_analysis) : null,
      lessonCase: item.lesson_case ? (typeof item.lesson_case === 'string' ? JSON.parse(item.lesson_case) : item.lesson_case) : null,
    }));
    
    return NextResponse.json({ success: true, data: apps });
  } catch (err) {
    console.error('AI教学应用API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * POST - 创建AI赋能教学应用
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    
    if (!body.themeId || !body.appName || !body.subject) {
      return NextResponse.json(error('缺少必填字段', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const insertData: Record<string, unknown> = {
      theme_id: body.themeId,
      app_name: body.appName,
      subject: body.subject,
      ai_tool_type: body.aiToolType || null,
      ai_tool_name: body.aiToolName || '',
      description: body.description || '',
      use_case: body.useCase || '',
      operation_steps: body.operationSteps || [],
      prompts: body.prompts || [],
      generated_content: body.generatedContent || null,
      optimized_content: body.optimizedContent || null,
      classroom_integration: body.classroomIntegration || '',
      effect_analysis: body.effectAnalysis || null,
      video_url: body.videoUrl || null,
      lesson_case: body.lessonCase || null,
      creator_id: user.id,
      creator_name: user.name,
      collaborator_ids: body.collaboratorIds || [],
      status: 'draft',
    };
    
    const { data, error: createError } = await supabase
      .from('ai_teaching_apps')
      .insert(insertData)
      .select()
      .single();
    
    if (createError) {
      console.error('创建AI教学应用失败:', createError);
      return NextResponse.json(error('创建AI教学应用失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...data,
        aiToolTypeLabel: AI_TOOL_TYPE_LABELS[data.ai_tool_type as AIToolType] || data.ai_tool_type,
      },
      message: 'AI赋能教学应用创建成功',
    });
  } catch (err) {
    console.error('创建AI教学应用API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
