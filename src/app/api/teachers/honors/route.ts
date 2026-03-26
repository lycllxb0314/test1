/**
 * 教师荣誉 API
 * 
 * 数据源：Supabase 数据库（唯一数据源）
 * v3.0: 移除Mock fallback，数据库失败时返回错误响应
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

/**
 * GET - 获取教师荣誉列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    const client = getSupabaseClient();
    
    let query = client
      .from('teacher_honors')
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

    const formattedData = (data || []).map((honor: Record<string, unknown>) => ({
      id: honor.id,
      teacherId: honor.teacher_id,
      title: honor.title,
      level: honor.level,
      category: honor.category,
      issuer: honor.issuer,
      date: honor.date,
      certificateNo: honor.certificate_no,
      attachments: honor.attachments || [],
    }));

    return NextResponse.json(success(formattedData, 'database'));
  } catch (err) {
    console.error('Failed to fetch teacher honors:', err);
    return NextResponse.json(
      error('获取教师荣誉失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * POST - 添加教师荣誉
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { teacherId, title, level, category, issuer, date, certificateNo, attachments } = body;

    const { data, error: dbError } = await client
      .from('teacher_honors')
      .insert({
        teacher_id: teacherId,
        title,
        level,
        category,
        issuer,
        date,
        certificate_no: certificateNo,
        attachments: attachments || [],
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        error('添加荣誉失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success({
      id: data.id,
      teacherId: data.teacher_id,
      title: data.title,
      level: data.level,
      category: data.category,
      issuer: data.issuer,
      date: data.date,
      certificateNo: data.certificate_no,
      attachments: data.attachments || [],
    }, 'database'));
  } catch (err) {
    console.error('Failed to create teacher honor:', err);
    return NextResponse.json(
      error('添加荣誉失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * PUT - 更新教师荣誉
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { id, title, level, category, issuer, date, certificateNo, attachments } = body;

    const { data, error: dbError } = await client
      .from('teacher_honors')
      .update({
        title,
        level,
        category,
        issuer,
        date,
        certificate_no: certificateNo,
        attachments: attachments || [],
      })
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        error('更新荣誉失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(data, 'database'));
  } catch (err) {
    console.error('Failed to update teacher honor:', err);
    return NextResponse.json(
      error('更新荣誉失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * DELETE - 删除教师荣誉
 */
export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        error('缺少荣誉ID', ErrorCode.BAD_REQUEST),
        { status: 400 }
      );
    }

    const { error: dbError } = await client.from('teacher_honors').delete().eq('id', id);

    if (dbError) {
      return NextResponse.json(
        error('删除荣誉失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, source: 'database' });
  } catch (err) {
    console.error('Failed to delete teacher honor:', err);
    return NextResponse.json(
      error('删除荣誉失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
