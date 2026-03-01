/**
 * 考试管理 API
 * 
 * 数据源：Supabase 数据库（唯一数据源）
 * v3.0: 移除Mock fallback，数据库失败时返回错误响应
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { 
  success, 
  error, 
  parseQueryParams,
  ErrorCode 
} from '@/lib/api-route-utils';

/**
 * GET - 获取考试列表
 */
export async function GET(request: NextRequest) {
  const params = parseQueryParams(request);
  
  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('exams')
      .select('*')
      .order('start_date', { ascending: false });

    if (params.type) query = query.eq('type', params.type);
    if (params.semester) query = query.eq('semester', params.semester);
    if (params.grade) query = query.contains('grades', [params.grade]);

    const { data, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json(
        error('数据库查询失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    const formattedData = (data || []).map((exam: Record<string, unknown>) => ({
      id: exam.id,
      name: exam.name,
      examType: exam.type,
      semester: exam.semester,
      examDate: exam.start_date,
      grades: exam.grades || [],
      subjects: exam.subjects || [],
      totalScore: exam.subjects ? (exam.subjects as string[]).length * 100 : 0,
      status: exam.status,
      description: exam.description || exam.name,
      createdAt: exam.created_at,
    }));

    return NextResponse.json(success(formattedData));
  } catch (err) {
    console.error('Failed to fetch exams:', err);
    return NextResponse.json(
      error('获取考试列表失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * POST - 创建考试
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { name, examType, semester, examDate, grades, subjects, totalScore, description } = body;

    const { data, error: dbError } = await client
      .from('exams')
      .insert({
        id: `exam-${Date.now()}`,
        name,
        type: examType,
        semester,
        start_date: examDate,
        end_date: examDate,
        grades: grades || [],
        subjects: subjects || [],
        status: 'pending',
        description,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        error('创建考试失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success({
      id: data.id,
      name: data.name,
      examType: data.type,
      semester: data.semester,
      examDate: data.start_date,
      grades: data.grades,
      subjects: data.subjects,
      status: data.status,
      description: data.description,
    }));
  } catch (err) {
    console.error('Failed to create exam:', err);
    return NextResponse.json(
      error('创建考试失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
