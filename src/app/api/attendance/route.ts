/**
 * 考勤管理 API
 * 
 * 数据源：Supabase 数据库（唯一数据源）
 * v3.0: 移除Mock fallback，数据库失败时返回错误响应
 */

import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { ok, fail, serverError, getQueryParams } from '@/lib/api-utils';

/**
 * GET - 获取考勤记录
 */
export async function GET(request: NextRequest) {
  const params = getQueryParams(request);
  const { filters, page, pageSize } = params;
  
  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('student_attendance')
      .select('*')
      .order('date', { ascending: false });

    if (filters.studentId) query = query.eq('student_id', filters.studentId);
    if (filters.date) query = query.eq('date', filters.date);
    if (filters.startDate) query = query.gte('date', filters.startDate);
    if (filters.endDate) query = query.lte('date', filters.endDate);
    if (filters.status) query = query.eq('status', filters.status);

    const { data, error: dbError } = await query;

    if (dbError) {
      return fail('数据库查询失败');
    }

    const formattedData = (data || []).map((record: Record<string, unknown>) => ({
      id: record.id,
      studentId: record.student_id,
      studentName: record.student_name,
      classId: record.class_id,
      className: record.class_name,
      date: record.date,
      status: record.status,
      reason: record.reason,
      recordedBy: record.recorded_by,
      createdAt: record.created_at,
    }));

    return ok(formattedData);
  } catch (err) {
    console.error('Failed to fetch attendance:', err);
    return serverError('获取考勤记录失败');
  }
}

/**
 * POST - 创建考勤记录
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { studentId, studentName, classId, className, date, status, reason, recordedBy } = body;

    if (!studentId || !date || !status) {
      return fail('缺少必要参数');
    }

    const { data, error: dbError } = await client
      .from('student_attendance')
      .insert({
        id: `att-${Date.now()}`,
        student_id: studentId,
        student_name: studentName,
        class_id: classId,
        class_name: className,
        date,
        status,
        reason,
        recorded_by: recordedBy,
      })
      .select()
      .single();

    if (dbError) {
      return fail('创建考勤记录失败: ' + dbError.message);
    }

    return ok({
      id: data.id,
      studentId: data.student_id,
      date: data.date,
      status: data.status,
    });
  } catch (err) {
    console.error('Failed to create attendance:', err);
    return serverError('创建考勤记录失败');
  }
}
