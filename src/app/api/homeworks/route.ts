import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Mock作业数据
const mockHomeworks = [
  { id: 'hw1', title: '语文作业：课文背诵与练习', subject: '语文', teacherId: 't001', teacherName: '王芳', classId: 'c001', className: '六年级1班', dueDate: '2024-11-22', content: '完成课后练习题，背诵《少年中国说》', attachments: [], submissionCount: 35, totalStudents: 45, status: 'active', createdAt: '2024-11-18' },
  { id: 'hw2', title: '数学作业：分数运算练习', subject: '数学', teacherId: 't003', teacherName: '李强', classId: 'c001', className: '六年级1班', dueDate: '2024-11-21', content: '完成课本第56页练习题1-10', attachments: [], submissionCount: 40, totalStudents: 45, status: 'active', createdAt: '2024-11-17' },
  { id: 'hw3', title: '英语作业：单词默写', subject: '英语', teacherId: 't004', teacherName: '陈丽', classId: 'c001', className: '六年级1班', dueDate: '2024-11-20', content: '默写Unit 5单词，每个写3遍', attachments: [], submissionCount: 45, totalStudents: 45, status: 'completed', createdAt: '2024-11-15' },
];

/**
 * GET - 获取作业列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const classId = searchParams.get('classId');
    const subject = searchParams.get('subject');

    const client = getSupabaseClient();
    
    let query = client
      .from('homeworks')
      .select('*')
      .order('due_date', { ascending: false });

    if (teacherId) query = query.eq('teacher_id', teacherId);
    if (classId) query = query.eq('class_id', classId);
    if (subject) query = query.eq('subject', subject);

    const { data, error } = await query;

    if (error) {
      // 数据库失败，使用Mock数据
      let filteredData = [...mockHomeworks];
      if (teacherId) filteredData = filteredData.filter(h => h.teacherId === teacherId);
      if (classId) filteredData = filteredData.filter(h => h.classId === classId);
      if (subject) filteredData = filteredData.filter(h => h.subject === subject);

      return NextResponse.json({ success: true, data: filteredData, source: 'mock' });
    }

    return NextResponse.json({
      success: true,
      data: (data || []).map((h: Record<string, unknown>) => ({
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
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to fetch homeworks:', error);
    return NextResponse.json({ success: true, data: mockHomeworks, source: 'mock' });
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

    if (error) {
      return NextResponse.json({
        success: true,
        data: { id: `hw-${Date.now()}`, ...body, status: 'active' },
        source: 'mock',
      });
    }

    return NextResponse.json({ success: true, data, source: 'database' });
  } catch (error) {
    console.error('Failed to create homework:', error);
    return NextResponse.json({ success: false, error: '创建作业失败' }, { status: 500 });
  }
}
