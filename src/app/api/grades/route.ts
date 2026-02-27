import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取学生成绩
 * 查询参数：
 * - studentId: 学生ID
 * - classId: 班级ID
 * - examId: 考试ID
 * - subject: 科目
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');
    const examId = searchParams.get('examId');
    const subject = searchParams.get('subject');

    // 构建查询
    let query = client
      .from('grades')
      .select(`
        id,
        student_id,
        exam_id,
        subject,
        score,
        rank,
        class_rank,
        grade_rank,
        comments,
        created_at,
        students (
          id,
          name,
          student_number,
          grade,
          class_id,
          classes (
            id,
            name
          )
        ),
        exams (
          id,
          name,
          exam_type,
          exam_date
        )
      `)
      .order('created_at', { ascending: false });

    // 应用筛选条件
    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    if (classId) {
      // 需要通过学生表筛选班级
      const { data: studentIds } = await client
        .from('students')
        .select('id')
        .eq('class_id', classId);

      const ids = (studentIds || []).map(s => s.id);
      if (ids.length > 0) {
        query = query.in('student_id', ids);
      } else {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }
    }

    if (examId) {
      query = query.eq('exam_id', examId);
    }

    if (subject) {
      query = query.eq('subject', subject);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 格式化返回数据
    const formattedData = (data || []).map((grade: any) => ({
      id: grade.id,
      studentId: grade.student_id,
      studentName: grade.students?.name || '',
      studentNumber: grade.students?.student_number || '',
      studentGrade: grade.students?.grade || 0,
      className: grade.students?.classes?.name || '',
      examId: grade.exam_id,
      examName: grade.exams?.name || '',
      examType: grade.exams?.exam_type || '',
      examDate: grade.exams?.exam_date || '',
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
    });
  } catch (error) {
    console.error('Failed to fetch grades:', error);
    return NextResponse.json({
      success: false,
      error: '获取学生成绩失败',
    }, { status: 500 });
  }
}

/**
 * POST - 录入学生成绩
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      studentId,
      examId,
      subject,
      score,
      comments,
    } = body;

    const { data, error } = await client
      .from('grades')
      .insert({
        student_id: studentId,
        exam_id: examId,
        subject,
        score,
        comments,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to create grade:', error);
    return NextResponse.json({
      success: false,
      error: '录入学生成绩失败',
    }, { status: 500 });
  }
}

/**
 * PUT - 更新学生成绩
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { id, score, comments } = body;

    const { data, error } = await client
      .from('grades')
      .update({
        score,
        comments,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to update grade:', error);
    return NextResponse.json({
      success: false,
      error: '更新学生成绩失败',
    }, { status: 500 });
  }
}
