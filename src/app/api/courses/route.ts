import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取课程列表
 * 查询参数：
 * - teacherId: 教师ID
 * - classId: 班级ID
 * - semester: 学期
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const classId = searchParams.get('classId');
    const semester = searchParams.get('semester');

    // 构建查询
    let query = client
      .from('courses')
      .select(`
        id,
        name,
        code,
        subject,
        teacher_id,
        class_id,
        semester,
        hours_per_week,
        total_hours,
        description,
        status,
        teachers (
          id,
          name,
          employee_id
        ),
        classes (
          id,
          name,
          grade
        )
      `)
      .order('name');

    // 应用筛选条件
    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }

    if (classId) {
      query = query.eq('class_id', classId);
    }

    if (semester) {
      query = query.eq('semester', semester);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 格式化返回数据
    const formattedData = (data || []).map((course: any) => ({
      id: course.id,
      name: course.name,
      code: course.code,
      subject: course.subject,
      teacherId: course.teacher_id,
      teacherName: course.teachers?.name || '',
      teacherEmployeeId: course.teachers?.employee_id || '',
      classId: course.class_id,
      className: course.classes?.name || '',
      grade: course.classes?.grade || 0,
      semester: course.semester,
      hoursPerWeek: course.hours_per_week,
      totalHours: course.total_hours,
      description: course.description,
      status: course.status,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    return NextResponse.json({
      success: false,
      error: '获取课程列表失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建课程
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      name,
      code,
      subject,
      teacherId,
      classId,
      semester,
      hoursPerWeek,
      totalHours,
      description,
    } = body;

    const { data, error } = await client
      .from('courses')
      .insert({
        name,
        code,
        subject,
        teacher_id: teacherId,
        class_id: classId,
        semester,
        hours_per_week: hoursPerWeek,
        total_hours: totalHours,
        description,
        status: 'active',
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
    console.error('Failed to create course:', error);
    return NextResponse.json({
      success: false,
      error: '创建课程失败',
    }, { status: 500 });
  }
}
