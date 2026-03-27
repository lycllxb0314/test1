/**
 * 教研主题管理 API
 * 
 * 功能：
 * - GET: 获取教研主题列表
 * - POST: 创建教研主题
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { success, error, ErrorCode } from '@/lib/api';

// 教研主题类型
type ThemeType = 'big_unit' | 'project' | 'practice' | 'ai_enabled' | 'custom';
type ThemeLevel = 'school' | 'grade' | 'subject_group';
type ThemeStatus = 'draft' | 'pending' | 'approved' | 'in_progress' | 'completed' | 'archived';

interface ResearchTheme {
  id: string;
  title: string;
  type: ThemeType;
  subject: string;
  level: ThemeLevel;
  description?: string;
  objectives?: string[];
  keyPoints?: string[];
  startDate?: string;
  endDate?: string;
  status: ThemeStatus;
  creatorId: string;
  creatorName: string;
  participantIds?: string[];
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 主题类型标签映射
const THEME_TYPE_LABELS: Record<ThemeType, string> = {
  big_unit: '大单元教学',
  project: '项目式教学',
  practice: '学科实践',
  ai_enabled: 'AI赋能教学',
  custom: '自定义主题',
};

// 主题级别标签映射
const THEME_LEVEL_LABELS: Record<ThemeLevel, string> = {
  school: '校级重点教研',
  grade: '年级组教研',
  subject_group: '备课组微教研',
};

/**
 * GET - 获取教研主题列表
 * 
 * 查询参数：
 * - type: 主题类型
 * - subject: 学科
 * - level: 主题级别
 * - status: 状态
 * - creatorId: 创建者ID
 * - participantId: 参与者ID
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type');
    const subject = searchParams.get('subject');
    const level = searchParams.get('level');
    const status = searchParams.get('status');
    const creatorId = searchParams.get('creatorId');
    const participantId = searchParams.get('participantId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    
    // 构建查询
    let query = supabase
      .from('research_themes')
      .select('*', { count: 'exact' });
    
    // 筛选条件
    if (type) query = query.eq('type', type);
    if (subject) query = query.eq('subject', subject);
    if (level) query = query.eq('level', level);
    if (status) query = query.eq('status', status);
    if (creatorId) query = query.eq('creator_id', creatorId);
    if (participantId) {
      query = query.contains('participant_ids', [participantId]);
    }
    
    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    query = query.order('created_at', { ascending: false });
    
    const { data, error: fetchError, count } = await query;
    
    if (fetchError) {
      console.error('获取教研主题失败:', fetchError);
      return NextResponse.json(error('获取教研主题失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 转换数据格式
    const themes = (data || []).map((item: Record<string, unknown>) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      typeLabel: THEME_TYPE_LABELS[item.type as ThemeType],
      subject: item.subject,
      level: item.level,
      levelLabel: THEME_LEVEL_LABELS[item.level as ThemeLevel],
      description: item.description,
      objectives: item.objectives ? JSON.parse(item.objectives as string) : [],
      keyPoints: item.key_points ? JSON.parse(item.key_points as string) : [],
      startDate: item.start_date,
      endDate: item.end_date,
      status: item.status,
      creatorId: item.creator_id,
      creatorName: item.creator_name,
      participantIds: item.participant_ids || [],
      approverId: item.approver_id,
      approverName: item.approver_name,
      approvedAt: item.approved_at,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
    
    return NextResponse.json({
      success: true,
      data: themes,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (err) {
    console.error('教研主题API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * POST - 创建教研主题
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    
    // 验证必填字段
    if (!body.title || !body.type || !body.subject || !body.level) {
      return NextResponse.json(error('缺少必填字段', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 创建教研主题
    const insertData: Record<string, unknown> = {
      title: body.title,
      type: body.type,
      subject: body.subject,
      level: body.level,
      description: body.description || '',
      objectives: body.objectives ? JSON.stringify(body.objectives) : '[]',
      key_points: body.keyPoints ? JSON.stringify(body.keyPoints) : '[]',
      start_date: body.startDate || null,
      end_date: body.endDate || null,
      status: 'draft',
      creator_id: user.id,
      creator_name: user.name,
      participant_ids: body.participantIds || [],
    };
    
    const { data, error: createError } = await supabase
      .from('research_themes')
      .insert(insertData)
      .select()
      .single();
    
    if (createError) {
      console.error('创建教研主题失败:', createError);
      return NextResponse.json(error('创建教研主题失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 创建初始统计记录
    await supabase
      .from('research_statistics')
      .insert({
        theme_id: data.id,
        total_activities: 0,
        completed_activities: 0,
        total_participants: 0,
        average_attendance: '0',
        achievements_count: 0,
        resources_count: 0,
      });
    
    return NextResponse.json({
      success: true,
      data: {
        ...data,
        typeLabel: THEME_TYPE_LABELS[data.type as ThemeType],
        levelLabel: THEME_LEVEL_LABELS[data.level as ThemeLevel],
      },
      message: '教研主题创建成功',
    });
  } catch (err) {
    console.error('创建教研主题API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
