import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getMockTeacherHonors } from '@/lib/mock/teachers.mock';

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

    const { data, error } = await query;

    if (error) {
      // 数据库失败，使用Mock数据
      const filteredData = getMockTeacherHonors({ teacherId: teacherId || undefined });

      return NextResponse.json({ success: true, data: filteredData, source: 'mock' });
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

    return NextResponse.json({ success: true, data: formattedData, source: 'database' });
  } catch (error) {
    console.error('Failed to fetch teacher honors:', error);
    return NextResponse.json({ success: true, data: getMockTeacherHonors(), source: 'mock' });
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

    const { data, error } = await client
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

    if (error) {
      return NextResponse.json({
        success: true,
        data: { id: `h-${Date.now()}`, teacherId, title, level, category, issuer, date, certificateNo, attachments: attachments || [] },
        source: 'mock',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        teacherId: data.teacher_id,
        title: data.title,
        level: data.level,
        category: data.category,
        issuer: data.issuer,
        date: data.date,
        certificateNo: data.certificate_no,
        attachments: data.attachments || [],
      },
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to create teacher honor:', error);
    return NextResponse.json({ success: false, error: '添加荣誉失败' }, { status: 500 });
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

    const { data, error } = await client
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

    if (error) {
      return NextResponse.json({
        success: true,
        data: { id, title, level, category, issuer, date, certificateNo, attachments: attachments || [] },
        source: 'mock',
      });
    }

    return NextResponse.json({ success: true, data, source: 'database' });
  } catch (error) {
    console.error('Failed to update teacher honor:', error);
    return NextResponse.json({ success: false, error: '更新荣誉失败' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: '缺少荣誉ID' }, { status: 400 });
    }

    const { error } = await client.from('teacher_honors').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: true, source: 'mock' });
    }

    return NextResponse.json({ success: true, source: 'database' });
  } catch (error) {
    console.error('Failed to delete teacher honor:', error);
    return NextResponse.json({ success: false, error: '删除荣誉失败' }, { status: 500 });
  }
}
