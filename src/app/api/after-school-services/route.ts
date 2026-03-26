/**
 * 课后服务 API
 * 
 * 数据源：Supabase 数据库（唯一数据源）
 * v3.0: 移除Mock fallback，数据库失败时返回错误响应
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacherId');
  const classId = searchParams.get('classId');
  const date = searchParams.get('date');
  const semester = searchParams.get('semester');
  const weekNumber = searchParams.get('weekNumber');
  const serviceType = searchParams.get('serviceType');
  const status = searchParams.get('status');

  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('after_school_services')
      .select('*')
      .order('date', { ascending: false });

    if (teacherId) query = query.eq('teacher_id', teacherId);
    if (classId) query = query.eq('class_id', classId);
    if (date) query = query.eq('date', date);
    if (semester) query = query.eq('semester', semester);
    if (weekNumber) query = query.eq('week_number', parseInt(weekNumber));
    if (serviceType) query = query.eq('service_type', serviceType);
    if (status) query = query.eq('status', status);

    const { data, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json(
        error('数据库查询失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(data || [], 'database'));
  } catch (err) {
    console.error('获取课后服务失败:', err);
    return NextResponse.json(
      error('获取课后服务失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    const { data, error: dbError } = await client
      .from('after_school_services')
      .insert({
        semester: body.semester,
        week_number: body.weekNumber,
        date: body.date,
        service_type: body.serviceType,
        class_id: body.classId,
        class_name: body.className,
        grade: body.grade,
        teacher_id: body.teacherId,
        teacher_name: body.teacherName,
        period_index: body.periodIndex,
        start_time: body.startTime,
        end_time: body.endTime,
        hours: body.hours || 1,
        status: 'scheduled',
        student_count: body.studentCount,
        remark: body.remark,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        error('创建课后服务失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(data, 'database'));
  } catch (err) {
    console.error('创建课后服务失败:', err);
    return NextResponse.json(
      error('创建课后服务失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { id, status, remark } = body;

    const { data, error: dbError } = await client
      .from('after_school_services')
      .update({
        status,
        remark,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        error('更新课后服务失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(data, 'database'));
  } catch (err) {
    console.error('更新课后服务失败:', err);
    return NextResponse.json(
      error('更新课后服务失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        error('缺少ID', ErrorCode.BAD_REQUEST),
        { status: 400 }
      );
    }

    const { error: dbError } = await client
      .from('after_school_services')
      .delete()
      .eq('id', id);

    if (dbError) {
      return NextResponse.json(
        error('删除课后服务失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '删除成功',
    });
  } catch (err) {
    console.error('删除课后服务失败:', err);
    return NextResponse.json(
      error('删除课后服务失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
