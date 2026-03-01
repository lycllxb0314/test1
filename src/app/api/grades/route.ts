/**
 * 成绩管理 API
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
 * GET - 获取学生成绩
 */
export async function GET(request: NextRequest) {
  const params = parseQueryParams(request);
  
  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('grades')
      .select('id, student_id, student_name, exam_id, class_id, class_name, grade, subject, score, level, rank, class_rank, remark, created_at')
      .order('created_at', { ascending: false });

    if (params.studentId) query = query.eq('student_id', params.studentId);
    if (params.classId) query = query.eq('class_id', params.classId);
    if (params.examId) query = query.eq('exam_id', params.examId);
    if (params.subject) query = query.eq('subject', params.subject);

    const { data, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json(
        error('数据库查询失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    const formattedData = (data || []).map((grade: Record<string, unknown>) => ({
      id: grade.id,
      studentId: grade.student_id,
      studentName: grade.student_name,
      classId: grade.class_id,
      className: grade.class_name,
      grade: grade.grade,
      examId: grade.exam_id,
      subject: grade.subject,
      score: grade.score,
      level: grade.level,
      rank: grade.rank,
      classRank: grade.class_rank,
      remark: grade.remark,
      createdAt: grade.created_at,
    }));

    return NextResponse.json(success(formattedData));
  } catch (err) {
    console.error('Failed to fetch grades:', err);
    return NextResponse.json(
      error('获取成绩列表失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * POST - 录入学生成绩
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { studentId, classId, examId, subject, score, comments } = body;

    if (!studentId || !examId || !subject || score === undefined) {
      return NextResponse.json(
        error('缺少必要参数', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    const { data, error: dbError } = await client
      .from('grades')
      .insert({ 
        id: `g-${Date.now()}`,
        student_id: studentId, 
        class_id: classId,
        exam_id: examId, 
        subject, 
        score,
        comments 
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        error('录入成绩失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success({
      id: data.id,
      studentId: data.student_id,
      classId: data.class_id,
      examId: data.exam_id,
      subject: data.subject,
      score: data.score,
      comments: data.comments,
    }));
  } catch (err) {
    console.error('Failed to create grade:', err);
    return NextResponse.json(
      error('录入成绩失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
