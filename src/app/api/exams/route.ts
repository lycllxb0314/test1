import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { MOCK_EXAMS } from '@/lib/mock/academic.mock';

// 格式化考试数据以匹配 API 响应格式
function formatExamData(exam: typeof MOCK_EXAMS[0]) {
  return {
    id: exam.id,
    name: exam.name,
    examType: exam.type,
    semester: '2024-2025-1',
    examDate: exam.startDate,
    grades: exam.grades,
    subjects: exam.subjects,
    totalScore: exam.subjects.length * 100,
    status: exam.status,
    description: exam.name,
    createdAt: exam.createdAt,
  };
}

/**
 * GET - 获取考试列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const semester = searchParams.get('semester');
    const grade = searchParams.get('grade');

    // 尝试数据库查询
    const client = getSupabaseClient();
    
    let query = client
      .from('exams')
      .select('*')
      .order('exam_date', { ascending: false });

    if (type) query = query.eq('exam_type', type);
    if (semester) query = query.eq('semester', semester);
    if (grade) query = query.contains('grades', [parseInt(grade)]);

    const { data, error } = await query;

    if (error) {
      // 数据库失败，使用Mock数据
      let filteredData = MOCK_EXAMS.map(formatExamData);
      if (type) filteredData = filteredData.filter(e => e.examType.includes(type));
      if (grade) filteredData = filteredData.filter(e => e.grades.includes(parseInt(grade)));

      return NextResponse.json({
        success: true,
        data: filteredData,
        source: 'mock',
      });
    }

    const formattedData = (data || []).map((exam: Record<string, unknown>) => ({
      id: exam.id,
      name: exam.name,
      examType: exam.exam_type,
      semester: exam.semester,
      examDate: exam.exam_date,
      grades: exam.grades || [],
      subjects: exam.subjects || [],
      totalScore: exam.total_score,
      status: exam.status,
      description: exam.description,
      createdAt: exam.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to fetch exams:', error);
    // 异常情况也返回Mock数据
    return NextResponse.json({
      success: true,
      data: MOCK_EXAMS.map(formatExamData),
      source: 'mock',
    });
  }
}

/**
 * POST - 创建考试
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { name, examType, semester, examDate, grades, subjects, totalScore, description } = body;

    const { data, error } = await client
      .from('exams')
      .insert({
        name,
        exam_type: examType,
        semester,
        exam_date: examDate,
        grades: grades || [],
        subjects: subjects || [],
        total_score: totalScore,
        status: 'pending',
        description,
      })
      .select()
      .single();

    if (error) {
      // Mock模式返回模拟成功
      return NextResponse.json({
        success: true,
        data: {
          id: `exam-${Date.now()}`,
          name,
          examType,
          semester,
          examDate,
          grades,
          subjects,
          totalScore,
          status: 'pending',
          description,
        },
        source: 'mock',
      });
    }

    return NextResponse.json({
      success: true,
      data,
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to create exam:', error);
    return NextResponse.json({
      success: false,
      error: '创建考试失败',
    }, { status: 500 });
  }
}
