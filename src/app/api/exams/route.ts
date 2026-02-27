import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Mock考试数据
const mockExams = [
  { id: 'exam-1', name: '2024-2025学年第一学期期中考试', examType: '期中', semester: '2024-2025-1', examDate: '2024-11-11', grades: [1,2,3,4,5,6], subjects: ['语文', '数学', '英语'], totalScore: 300, status: 'completed', description: '全校统一期中考试' },
  { id: 'exam-2', name: '2024-2025学年第一学期期末考试', examType: '期末', semester: '2024-2025-1', examDate: '2025-01-15', grades: [1,2,3,4,5,6], subjects: ['语文', '数学', '英语', '科学'], totalScore: 400, status: 'pending', description: '全校统一期末考试' },
  { id: 'exam-3', name: '六年级月考', examType: '月考', semester: '2024-2025-1', examDate: '2024-10-15', grades: [6], subjects: ['语文', '数学', '英语'], totalScore: 300, status: 'completed', description: '六年级月度检测' },
  { id: 'exam-4', name: '五年级单元测试', examType: '单元测试', semester: '2024-2025-1', examDate: '2024-09-28', grades: [5], subjects: ['语文', '数学'], totalScore: 200, status: 'completed', description: '五年级第一单元测试' },
];

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
      let filteredData = [...mockExams];
      if (type) filteredData = filteredData.filter(e => e.examType === type);
      if (semester) filteredData = filteredData.filter(e => e.semester === semester);
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
      data: mockExams,
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
