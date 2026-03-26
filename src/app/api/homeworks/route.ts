/**
 * 作业管理 API
 * 
 * 数据源：Supabase 数据库（唯一数据源）
 * v3.0: 移除Mock fallback，数据库失败时返回错误响应
 */

import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { ok, fail, serverError, getQueryParams } from '@/lib/api-utils';

/**
 * GET - 获取作业列表
 */
export async function GET(request: NextRequest) {
  const params = getQueryParams(request);
  const { filters, page, pageSize } = params;
  
  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('homeworks')
      .select('*')
      .order('due_date', { ascending: false });

    if (filters.teacherId) query = query.eq('teacher_id', filters.teacherId);
    if (filters.classId) query = query.eq('class_id', filters.classId);
    if (filters.subject) query = query.eq('subject', filters.subject);

    const { data, error: dbError } = await query;

    if (dbError) {
      return fail('数据库查询失败');
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

    return ok(formattedData);
  } catch (err) {
    console.error('Failed to fetch homeworks:', err);
    return serverError('获取作业列表失败');
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
      return fail('创建作业失败: ' + dbError.message);
    }

    return ok({
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
    });
  } catch (err) {
    console.error('Failed to create homework:', err);
    return serverError('创建作业失败');
  }
}
