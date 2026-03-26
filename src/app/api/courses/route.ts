/**
 * 课程管理 API
 * 
 * 数据源：Supabase 数据库（唯一数据源）
 * v3.0: 移除Mock fallback，数据库失败时返回错误响应
 */

import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { ok, fail, serverError, getQueryParams } from '@/lib/api-utils';

/**
 * GET - 获取课程列表
 */
export async function GET(request: NextRequest) {
  const params = getQueryParams(request);
  const { filters, page, pageSize } = params;
  
  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('courses')
      .select('id, name, code, subject, grade, type, hours_per_week, description, created_at')
      .order('name');

    if (filters.subject) query = query.eq('subject', filters.subject);
    if (filters.grade) query = query.eq('grade', filters.grade);

    const { data, error: dbError } = await query;

    if (dbError) {
      return fail('数据库查询失败');
    }

    const formattedData = (data || []).map((course: Record<string, unknown>) => ({
      id: course.id,
      name: course.name,
      code: course.code,
      subject: course.subject,
      grade: course.grade,
      type: course.type,
      hoursPerWeek: course.hours_per_week,
      description: course.description,
      createdAt: course.created_at,
    }));

    return ok(formattedData);
  } catch (err) {
    console.error('Failed to fetch courses:', err);
    return serverError('获取课程列表失败');
  }
}
