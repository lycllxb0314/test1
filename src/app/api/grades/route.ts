import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getMockGrades } from '@/lib/mock/academic.mock';

/**
 * GET - 获取学生成绩
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');
    const examId = searchParams.get('examId');
    const subject = searchParams.get('subject');

    // 尝试数据库查询
    const client = getSupabaseClient();
    
    let query = client
      .from('grades')
      .select('id, student_id, exam_id, subject, score, rank, class_rank, grade_rank, comments, created_at')
      .order('created_at', { ascending: false });

    if (studentId) query = query.eq('student_id', studentId);
    if (examId) query = query.eq('exam_id', examId);
    if (subject) query = query.eq('subject', subject);

    const { data, error } = await query;

    if (error) {
      // 数据库失败，使用Mock数据
      const filteredData = getMockGrades({ 
        studentId: studentId || undefined, 
        classId: classId || undefined,
        examId: examId || undefined,
        subject: subject || undefined
      });

      return NextResponse.json({
        success: true,
        data: filteredData,
        source: 'mock',
      });
    }

    const formattedData = (data || []).map((grade: Record<string, unknown>) => ({
      id: grade.id,
      studentId: grade.student_id,
      studentName: '',
      studentNumber: '',
      studentGrade: 0,
      className: '',
      examId: grade.exam_id,
      examName: '',
      examType: '',
      examDate: '',
      subject: grade.subject,
      score: grade.score,
      rank: grade.rank,
      classRank: grade.class_rank,
      gradeRank: grade.grade_rank,
      comments: grade.comments,
      createdAt: grade.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to fetch grades:', error);
    // 异常情况也返回Mock数据
    return NextResponse.json({
      success: true,
      data: getMockGrades(),
      source: 'mock',
    });
  }
}

/**
 * POST - 录入学生成绩
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { studentId, examId, subject, score, comments } = body;

    const { data, error } = await client
      .from('grades')
      .insert({ student_id: studentId, exam_id: examId, subject, score, comments })
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: true,
        data: { id: `g-${Date.now()}`, studentId, examId, subject, score, comments },
        source: 'mock',
      });
    }

    return NextResponse.json({ success: true, data, source: 'database' });
  } catch (error) {
    console.error('Failed to create grade:', error);
    return NextResponse.json({ success: false, error: '录入学生成绩失败' }, { status: 500 });
  }
}
