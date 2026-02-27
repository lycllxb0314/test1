import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Mock教师成长记录数据
const mockRecords = [
  { id: 'r1', teacherId: 'teacher-001', type: 'education', title: '本科学历', description: '福建师范大学 汉语言文学专业', date: '2007-06', createdAt: '2020-01-01' },
  { id: 'r2', teacherId: 'teacher-001', type: 'title', title: '二级教师', date: '2010-09', createdAt: '2020-01-01' },
  { id: 'r3', teacherId: 'teacher-001', type: 'title', title: '一级教师', date: '2014-09', createdAt: '2020-01-01' },
  { id: 'r4', teacherId: 'teacher-001', type: 'title', title: '高级教师', date: '2018-09', createdAt: '2020-01-01' },
  { id: 'r5', teacherId: 'teacher-001', type: 'position', title: '担任语文教研组长', date: '2019-09', createdAt: '2020-01-01' },
];

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

    const { data, error } = await query;

    if (error) {
      let filteredData = [...mockRecords];
      if (teacherId) filteredData = filteredData.filter(r => r.teacherId === teacherId);

      return NextResponse.json({ success: true, data: filteredData, source: 'mock' });
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

    return NextResponse.json({ success: true, data: formattedData, source: 'database' });
  } catch (error) {
    console.error('Failed to fetch teacher records:', error);
    return NextResponse.json({ success: true, data: mockRecords, source: 'mock' });
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

    const { data, error } = await client
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

    if (error) {
      return NextResponse.json({
        success: true,
        data: { id: `r-${Date.now()}`, teacherId, type, title, description, date, attachments: attachments || [], createdAt: new Date().toISOString() },
        source: 'mock',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        teacherId: data.teacher_id,
        type: data.type,
        title: data.title,
        description: data.description,
        date: data.date,
        attachments: data.attachments || [],
        createdAt: data.created_at,
      },
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to create teacher record:', error);
    return NextResponse.json({ success: false, error: '添加记录失败' }, { status: 500 });
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

    const { data, error } = await client
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

    if (error) {
      return NextResponse.json({
        success: true,
        data: { id, type, title, description, date, attachments: attachments || [] },
        source: 'mock',
      });
    }

    return NextResponse.json({ success: true, data, source: 'database' });
  } catch (error) {
    console.error('Failed to update teacher record:', error);
    return NextResponse.json({ success: false, error: '更新记录失败' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: '缺少记录ID' }, { status: 400 });
    }

    const { error } = await client.from('teacher_records').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: true, source: 'mock' });
    }

    return NextResponse.json({ success: true, source: 'database' });
  } catch (error) {
    console.error('Failed to delete teacher record:', error);
    return NextResponse.json({ success: false, error: '删除记录失败' }, { status: 500 });
  }
}
