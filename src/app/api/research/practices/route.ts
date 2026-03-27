/**
 * 学科实践活动 API
 * 
 * 功能：
 * - GET: 获取学科实践活动列表
 * - POST: 创建学科实践活动
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { error, ErrorCode } from '@/lib/api';
import { 
  PRACTICE_ACTIVITY_TYPE_LABELS, 
  type PracticeActivityType 
} from '@/types/research';

/**
 * GET - 获取学科实践活动列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const themeId = searchParams.get('themeId');
    const subject = searchParams.get('subject');
    const grade = searchParams.get('grade');
    const activityType = searchParams.get('activityType');
    const status = searchParams.get('status');
    const creatorId = searchParams.get('creatorId');
    
    let query = supabase
      .from('practice_activities')
      .select('*');
    
    if (themeId) query = query.eq('theme_id', themeId);
    if (subject) query = query.eq('subject', subject);
    if (grade) query = query.eq('grade', parseInt(grade));
    if (activityType) query = query.eq('activity_type', activityType);
    if (status) query = query.eq('status', status);
    if (creatorId) query = query.eq('creator_id', creatorId);
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error: fetchError } = await query;
    
    if (fetchError) {
      console.error('获取学科实践活动失败:', fetchError);
      return NextResponse.json(error('获取学科实践活动失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 解析 JSON 字段
    const practices = (data || []).map((item: Record<string, unknown>) => ({
      ...item,
      activityTypeLabel: PRACTICE_ACTIVITY_TYPE_LABELS[item.activity_type as PracticeActivityType] || item.activity_type,
      objectives: item.objectives ? (typeof item.objectives === 'string' ? JSON.parse(item.objectives) : item.objectives) : [],
      materials: item.materials ? (typeof item.materials === 'string' ? JSON.parse(item.materials) : item.materials) : [],
      procedure: item.procedure ? (typeof item.procedure === 'string' ? JSON.parse(item.procedure) : item.procedure) : [],
      implementationRecords: item.implementation_records ? (typeof item.implementation_records === 'string' ? JSON.parse(item.implementation_records) : item.implementation_records) : [],
      problems: item.problems ? (typeof item.problems === 'string' ? JSON.parse(item.problems) : item.problems) : [],
      solutions: item.solutions ? (typeof item.solutions === 'string' ? JSON.parse(item.solutions) : item.solutions) : [],
      studentWorks: item.student_works ? (typeof item.student_works === 'string' ? JSON.parse(item.student_works) : item.student_works) : [],
      photos: item.photos ? (typeof item.photos === 'string' ? JSON.parse(item.photos) : item.photos) : [],
    }));
    
    return NextResponse.json({ success: true, data: practices });
  } catch (err) {
    console.error('学科实践活动API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * POST - 创建学科实践活动
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    
    if (!body.themeId || !body.activityName || !body.subject || !body.grade) {
      return NextResponse.json(error('缺少必填字段', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const insertData: Record<string, unknown> = {
      theme_id: body.themeId,
      activity_name: body.activityName,
      subject: body.subject,
      grade: body.grade,
      activity_type: body.activityType || null,
      description: body.description || '',
      objectives: body.objectives || [],
      materials: body.materials || [],
      procedure: body.procedure || [],
      difficulty_level: body.difficultyLevel || null,
      time_required: body.timeRequired || null,
      class_management: body.classManagement || '',
      implementation_records: body.implementationRecords || [],
      problems: body.problems || [],
      solutions: body.solutions || [],
      student_works: body.studentWorks || [],
      photos: body.photos || [],
      reflection: body.reflection || '',
      creator_id: user.id,
      creator_name: user.name,
      status: 'draft',
    };
    
    const { data, error: createError } = await supabase
      .from('practice_activities')
      .insert(insertData)
      .select()
      .single();
    
    if (createError) {
      console.error('创建学科实践活动失败:', createError);
      return NextResponse.json(error('创建学科实践活动失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...data,
        activityTypeLabel: PRACTICE_ACTIVITY_TYPE_LABELS[data.activity_type as PracticeActivityType] || data.activity_type,
      },
      message: '学科实践活动创建成功',
    });
  } catch (err) {
    console.error('创建学科实践活动API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
