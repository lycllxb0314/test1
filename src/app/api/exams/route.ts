import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取考试列表
 * 查询参数：
 * - type: 考试类型
 * - semester: 学期
 * - grade: 年级
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const semester = searchParams.get('semester');
    const grade = searchParams.get('grade');

    // 构建查询
    let query = client
      .from('exams')
      .select('*')
      .order('exam_date', { ascending: false });

    // 应用筛选条件
    if (type) {
      query = query.eq('exam_type', type);
    }

    if (semester) {
      query = query.eq('semester', semester);
    }

    if (grade) {
      query = query.contains('grades', [parseInt(grade)]);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 格式化返回数据
    const formattedData = (data || []).map((exam: any) => ({
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
    });
  } catch (error) {
    console.error('Failed to fetch exams:', error);
    return NextResponse.json({
      success: false,
      error: '获取考试列表失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建考试
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      name,
      examType,
      semester,
      examDate,
      grades,
      subjects,
      totalScore,
      description,
    } = body;

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
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to create exam:', error);
    return NextResponse.json({
      success: false,
      error: '创建考试失败',
    }, { status: 500 });
  }
}

/**
 * PUT - 更新考试状态
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { id, ...updates } = body;

    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.examDate !== undefined) updateData.exam_date = updates.examDate;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.description !== undefined) updateData.description = updates.description;

    const { data, error } = await client
      .from('exams')
      .update(updateData)
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
    console.error('Failed to update exam:', error);
    return NextResponse.json({
      success: false,
      error: '更新考试失败',
    }, { status: 500 });
  }
}
