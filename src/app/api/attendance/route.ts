/**
 * 考勤管理 API
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
 * GET - 获取考勤记录
 */
export async function GET(request: NextRequest) {
  const params = parseQueryParams(request);
  
  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('student_attendance')
      .select('*')
      .order('date', { ascending: false });

    if (params.studentId) query = query.eq('student_id', params.studentId);
    if (params.date) query = query.eq('date', params.date);
    if (params.startDate) query = query.gte('date', params.startDate);
    if (params.endDate) query = query.lte('date', params.endDate);
    if (params.status) query = query.eq('status', params.status);

    const { data, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json(
        error('数据库查询失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
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

    return NextResponse.json(success(formattedData));
  } catch (err) {
    console.error('Failed to fetch attendance:', err);
    return NextResponse.json(
      error('获取考勤记录失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
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
      return NextResponse.json(
        error('缺少必要参数', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
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
      return NextResponse.json(
        error('创建考勤记录失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success({
      id: data.id,
      studentId: data.student_id,
      date: data.date,
      status: data.status,
    }));
  } catch (err) {
    console.error('Failed to create attendance:', err);
    return NextResponse.json(
      error('创建考勤记录失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
