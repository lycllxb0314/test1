import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取成长档案列表
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const type = searchParams.get('type');
    const semester = searchParams.get('semester');

    let query = client
      .from('growth_records')
      .select('*')
      .order('date', { ascending: false });

    if (studentId) query = query.eq('student_id', studentId);
    if (type) query = query.eq('type', type);
    if (semester) query = query.eq('semester', semester);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: (data || []).map((r: any) => ({
        id: r.id,
        studentId: r.student_id,
        studentName: r.student_name,
        grade: r.grade,
        className: r.class_name,
        type: r.type,
        title: r.title,
        content: r.content,
        date: r.date,
        images: r.images || [],
        recorderId: r.recorder_id,
        recorderName: r.recorder_name,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch growth records:', error);
    return NextResponse.json({ success: false, error: '获取成长档案失败' }, { status: 500 });
  }
}

/**
 * POST - 创建成长档案
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await client
      .from('growth_records')
      .insert({
        student_id: body.studentId,
        student_name: body.studentName,
        grade: body.grade,
        class_name: body.className,
        type: body.type,
        title: body.title,
        content: body.content,
        date: body.date || new Date().toISOString().split('T')[0],
        images: body.images || [],
        recorder_id: body.recorderId,
        recorder_name: body.recorderName,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to create growth record:', error);
    return NextResponse.json({ success: false, error: '创建成长档案失败' }, { status: 500 });
  }
}
