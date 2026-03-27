/**
 * 教师培训 API
 * 
 * 数据源：Supabase 数据库（唯一数据源）
 * v3.0: 移除Mock fallback，数据库失败时返回错误响应
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api';
import type { TeacherTraining } from '@/types';

/**
 * GET - 获取教师培训列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const client = getSupabaseClient();
    
    let query = client
      .from('teacher_trainings')
      .select('*')
      .order('start_date', { ascending: false });

    if (teacherId) query = query.eq('teacher_id', teacherId);
    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);

    const { data, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json(
        error('数据库查询失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    const formattedData: TeacherTraining[] = (data || []).map((training: Record<string, unknown>) => ({
      id: training.id as string,
      teacherId: training.teacher_id as string,
      name: training.name as string,
      type: training.type as '校内培训' | '区级培训' | '市级培训' | '省级培训' | '国家级培训',
      organizer: training.organizer as string,
      startDate: training.start_date as string,
      endDate: training.end_date as string,
      hours: training.hours as number,
      status: training.status as '进行中' | '已完成' | '未通过',
      certificate: training.certificate as string,
      notes: training.notes as string,
    }));

    return NextResponse.json(success(formattedData, 'database'));
  } catch (err) {
    console.error('Failed to fetch teacher trainings:', err);
    return NextResponse.json(
      error('获取教师培训失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * POST - 添加教师培训
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { teacherId, name, type, organizer, startDate, endDate, hours, status, certificate, notes } = body;

    const { data, error: dbError } = await client
      .from('teacher_trainings')
      .insert({
        teacher_id: teacherId,
        name,
        type,
        organizer,
        start_date: startDate,
        end_date: endDate,
        hours: hours || 0,
        status: status || '进行中',
        certificate,
        notes,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        error('添加培训失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success({
      id: data.id,
      teacherId: data.teacher_id,
      name: data.name,
      type: data.type,
      organizer: data.organizer,
      startDate: data.start_date,
      endDate: data.end_date,
      hours: data.hours,
      status: data.status,
      certificate: data.certificate,
      notes: data.notes,
    }, 'database'));
  } catch (err) {
    console.error('Failed to create teacher training:', err);
    return NextResponse.json(
      error('添加培训失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * PUT - 更新教师培训
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { id, name, type, organizer, startDate, endDate, hours, status, certificate, notes } = body;

    const { data, error: dbError } = await client
      .from('teacher_trainings')
      .update({
        name,
        type,
        organizer,
        start_date: startDate,
        end_date: endDate,
        hours,
        status,
        certificate,
        notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        error('更新培训失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success({
      id: data.id,
      teacherId: data.teacher_id,
      name: data.name,
      type: data.type,
      organizer: data.organizer,
      startDate: data.start_date,
      endDate: data.end_date,
      hours: data.hours,
      status: data.status,
      certificate: data.certificate,
      notes: data.notes,
    }, 'database'));
  } catch (err) {
    console.error('Failed to update teacher training:', err);
    return NextResponse.json(
      error('更新培训失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * DELETE - 删除教师培训
 */
export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        error('缺少培训ID', ErrorCode.BAD_REQUEST),
        { status: 400 }
      );
    }

    const { error: dbError } = await client
      .from('teacher_trainings')
      .delete()
      .eq('id', id);

    if (dbError) {
      return NextResponse.json(
        error('删除培训失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: '培训已删除' });
  } catch (err) {
    console.error('Failed to delete teacher training:', err);
    return NextResponse.json(
      error('删除培训失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
