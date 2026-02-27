import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取作业列表
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const classId = searchParams.get('classId');
    const subject = searchParams.get('subject');

    let query = client
      .from('homeworks')
      .select('*')
      .order('due_date', { ascending: false });

    if (teacherId) query = query.eq('teacher_id', teacherId);
    if (classId) query = query.eq('class_id', classId);
    if (subject) query = query.eq('subject', subject);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: (data || []).map((h: any) => ({
        id: h.id,
        title: h.title,
        subject: h.subject,
        teacherId: h.teacher_id,
        teacherName: h.teacher_name,
        classId: h.class_id,
        className: h.class_name,
        dueDate: h.due_date,
        content: h.content,
        attachments: h.attachments || [],
        submissionCount: h.submission_count || 0,
        totalStudents: h.total_students || 0,
        status: h.status,
        createdAt: h.created_at,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch homeworks:', error);
    return NextResponse.json({ success: false, error: '获取作业列表失败' }, { status: 500 });
  }
}

/**
 * POST - 创建作业
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await client
      .from('homeworks')
      .insert({
        title: body.title,
        subject: body.subject,
        teacher_id: body.teacherId,
        teacher_name: body.teacherName,
        class_id: body.classId,
        class_name: body.className,
        due_date: body.dueDate,
        content: body.content,
        attachments: body.attachments || [],
        total_students: body.totalStudents || 0,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to create homework:', error);
    return NextResponse.json({ success: false, error: '创建作业失败' }, { status: 500 });
  }
}
