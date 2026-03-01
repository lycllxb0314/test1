/**
 * 作业管理 API
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
 * GET - 获取作业列表
 */
export async function GET(request: NextRequest) {
  const params = parseQueryParams(request);
  
  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('homeworks')
      .select('*')
      .order('due_date', { ascending: false });

    if (params.teacherId) query = query.eq('teacher_id', params.teacherId);
    if (params.classId) query = query.eq('class_id', params.classId);
    if (params.subject) query = query.eq('subject', params.subject);

    const { data, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json(
        error('数据库查询失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    const formattedData = (data || []).map((h: Record<string, unknown>) => ({
      id: h.id,
      title: h.title,
      subject: h.subject,
      teacherId: h.teacher_id,
      teacherName: h.teacher_name,
      classId: h.class_id,
      className: h.class_name,
      dueDate: h.due_date,
      content: h.content,
      attachments: h.attachments || [],
      submissionCount: h.submission_count || h.submitted_count || 0,
      totalStudents: h.total_students || 0,
      status: h.status,
      createdAt: h.created_at,
    }));

    return NextResponse.json(success(formattedData));
  } catch (err) {
    console.error('Failed to fetch homeworks:', err);
    return NextResponse.json(
      error('获取作业列表失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * POST - 创建作业
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { data, error: dbError } = await client
      .from('homeworks')
      .insert({
        id: `hw-${Date.now()}`,
        title: body.title,
        subject: body.subject,
        teacher_id: body.teacherId,
        teacher_name: body.teacherName,
        class_id: body.classId,
        class_name: body.className,
        due_date: body.dueDate,
        content: body.content,
        attachments: body.attachments || [],
        total_students: body.totalStudents || 0,
        status: 'published',
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        error('创建作业失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success({
      id: data.id,
      title: data.title,
      subject: data.subject,
      teacherId: data.teacher_id,
      teacherName: data.teacher_name,
      classId: data.class_id,
      className: data.class_name,
      dueDate: data.due_date,
      content: data.content,
      status: data.status,
    }));
  } catch (err) {
    console.error('Failed to create homework:', err);
    return NextResponse.json(
      error('创建作业失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
