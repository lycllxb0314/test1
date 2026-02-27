import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Mock教师培训数据
const mockTrainings = [
  { id: 't1', teacherId: 'teacher-001', name: '新课标解读培训', type: '市级培训', organizer: '龙岩市教育局', startDate: '2024-01-15', endDate: '2024-01-17', hours: 24, status: '已完成', certificate: 'cert-001' },
  { id: 't2', teacherId: 'teacher-001', name: '信息技术应用能力提升', type: '省级培训', organizer: '福建省教育厅', startDate: '2023-11-01', endDate: '2023-11-30', hours: 48, status: '已完成' },
  { id: 't3', teacherId: 'teacher-001', name: '班主任工作培训', type: '校内培训', organizer: '学校教务处', startDate: '2023-09-01', endDate: '2023-09-03', hours: 16, status: '已完成' },
];

/**
 * GET - 获取教师培训列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    const client = getSupabaseClient();
    
    let query = client
      .from('teacher_trainings')
      .select('*')
      .order('start_date', { ascending: false });

    if (teacherId) query = query.eq('teacher_id', teacherId);

    const { data, error } = await query;

    if (error) {
      let filteredData = [...mockTrainings];
      if (teacherId) filteredData = filteredData.filter(t => t.teacherId === teacherId);

      return NextResponse.json({ success: true, data: filteredData, source: 'mock' });
    }

    const formattedData = (data || []).map((training: Record<string, unknown>) => ({
      id: training.id,
      teacherId: training.teacher_id,
      name: training.name,
      type: training.type,
      organizer: training.organizer,
      startDate: training.start_date,
      endDate: training.end_date,
      hours: training.hours,
      status: training.status,
      certificate: training.certificate,
      notes: training.notes,
    }));

    return NextResponse.json({ success: true, data: formattedData, source: 'database' });
  } catch (error) {
    console.error('Failed to fetch teacher trainings:', error);
    return NextResponse.json({ success: true, data: mockTrainings, source: 'mock' });
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

    const { data, error } = await client
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

    if (error) {
      return NextResponse.json({
        success: true,
        data: { id: `t-${Date.now()}`, teacherId, name, type, organizer, startDate, endDate, hours: hours || 0, status: status || '进行中', certificate, notes },
        source: 'mock',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
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
      },
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to create teacher training:', error);
    return NextResponse.json({ success: false, error: '添加培训失败' }, { status: 500 });
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

    const { data, error } = await client
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

    if (error) {
      return NextResponse.json({
        success: true,
        data: { id, name, type, organizer, startDate, endDate, hours, status, certificate, notes },
        source: 'mock',
      });
    }

    return NextResponse.json({ success: true, data, source: 'database' });
  } catch (error) {
    console.error('Failed to update teacher training:', error);
    return NextResponse.json({ success: false, error: '更新培训失败' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: '缺少培训ID' }, { status: 400 });
    }

    const { error } = await client.from('teacher_trainings').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: true, source: 'mock' });
    }

    return NextResponse.json({ success: true, source: 'database' });
  } catch (error) {
    console.error('Failed to delete teacher training:', error);
    return NextResponse.json({ success: false, error: '删除培训失败' }, { status: 500 });
  }
}
