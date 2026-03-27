/**
 * 教师成长记录 API
 * 
 * 数据源：Supabase 数据库（唯一数据源）
 * v3.0: 移除Mock fallback，数据库失败时返回错误响应
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取教师成长记录列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    const client = getSupabaseClient();
    
    let query = client
      .from('teacher_records')
      .select('*')
      .order('date', { ascending: false });

    if (teacherId) query = query.eq('teacher_id', teacherId);

    const { data, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json(
        error('数据库查询失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    const formattedData = (data || []).map((record: Record<string, unknown>) => ({
      id: record.id,
      teacherId: record.teacher_id,
      type: record.type,
      title: record.title,
      description: record.description,
      date: record.date,
      attachments: record.attachments || [],
      createdAt: record.created_at,
    }));

    return NextResponse.json(success(formattedData, 'database'));
  } catch (err) {
    console.error('Failed to fetch teacher records:', err);
    return NextResponse.json(
      error('获取教师成长记录失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * POST - 添加教师成长记录
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { teacherId, type, title, description, date, attachments } = body;

    const { data, error: dbError } = await client
      .from('teacher_records')
      .insert({
        teacher_id: teacherId,
        type,
        title,
        description,
        date,
        attachments: attachments || [],
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        error('添加记录失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success({
      id: data.id,
      teacherId: data.teacher_id,
      type: data.type,
      title: data.title,
      description: data.description,
      date: data.date,
      attachments: data.attachments || [],
      createdAt: data.created_at,
    }, 'database'));
  } catch (err) {
    console.error('Failed to create teacher record:', err);
    return NextResponse.json(
      error('添加记录失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * PUT - 更新教师成长记录
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { id, type, title, description, date, attachments } = body;

    const { data, error: dbError } = await client
      .from('teacher_records')
      .update({
        type,
        title,
        description,
        date,
        attachments: attachments || [],
      })
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        error('更新记录失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(data, 'database'));
  } catch (err) {
    console.error('Failed to update teacher record:', err);
    return NextResponse.json(
      error('更新记录失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * DELETE - 删除教师成长记录
 */
export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        error('缺少记录ID', ErrorCode.BAD_REQUEST),
        { status: 400 }
      );
    }

    const { error: dbError } = await client.from('teacher_records').delete().eq('id', id);

    if (dbError) {
      return NextResponse.json(
        error('删除记录失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, source: 'database' });
  } catch (err) {
    console.error('Failed to delete teacher record:', err);
    return NextResponse.json(
      error('删除记录失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
