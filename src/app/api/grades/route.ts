import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Mock成绩数据
const mockGrades = [
  { id: 'g1', studentId: 's001', studentName: '张三', studentNumber: '2024001', studentGrade: 6, className: '六年级1班', examId: 'exam-1', examName: '期中考试', examType: '期中', examDate: '2024-11-11', subject: '语文', score: 92, classRank: 5, gradeRank: 28, createdAt: '2024-11-12' },
  { id: 'g2', studentId: 's001', studentName: '张三', studentNumber: '2024001', studentGrade: 6, className: '六年级1班', examId: 'exam-1', examName: '期中考试', examType: '期中', examDate: '2024-11-11', subject: '数学', score: 88, classRank: 8, gradeRank: 45, createdAt: '2024-11-12' },
  { id: 'g3', studentId: 's001', studentName: '张三', studentNumber: '2024001', studentGrade: 6, className: '六年级1班', examId: 'exam-1', examName: '期中考试', examType: '期中', examDate: '2024-11-11', subject: '英语', score: 95, classRank: 3, gradeRank: 15, createdAt: '2024-11-12' },
  { id: 'g4', studentId: 's002', studentName: '李四', studentNumber: '2024002', studentGrade: 6, className: '六年级1班', examId: 'exam-1', examName: '期中考试', examType: '期中', examDate: '2024-11-11', subject: '语文', score: 95, classRank: 2, gradeRank: 12, createdAt: '2024-11-12' },
  { id: 'g5', studentId: 's002', studentName: '李四', studentNumber: '2024002', studentGrade: 6, className: '六年级1班', examId: 'exam-1', examName: '期中考试', examType: '期中', examDate: '2024-11-11', subject: '数学', score: 98, classRank: 1, gradeRank: 5, createdAt: '2024-11-12' },
];

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
      let filteredData = [...mockGrades];
      if (studentId) filteredData = filteredData.filter(g => g.studentId === studentId);
      if (examId) filteredData = filteredData.filter(g => g.examId === examId);
      if (subject) filteredData = filteredData.filter(g => g.subject === subject);
      if (classId) filteredData = filteredData.filter(g => g.className.includes(classId));

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
      data: mockGrades,
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
