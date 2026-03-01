import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getMockCourses } from '@/lib/mock/academic.mock';

/**
 * GET - 获取课程列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const classId = searchParams.get('classId');
    const semester = searchParams.get('semester');

    // 尝试数据库查询
    const client = getSupabaseClient();
    
    let query = client
      .from('courses')
      .select(`
        id, name, code, subject, teacher_id, class_id, semester,
        hours_per_week, total_hours, description, status
      `)
      .order('name');

    if (teacherId) query = query.eq('teacher_id', teacherId);
    if (classId) query = query.eq('class_id', classId);
    if (semester) query = query.eq('semester', semester);

    const { data, error } = await query;

    if (error) {
      // 数据库失败，使用Mock数据
      const filteredData = getMockCourses({ teacherId: teacherId || undefined, classId: classId || undefined, semester: semester || undefined });

      return NextResponse.json({
        success: true,
        data: filteredData,
        source: 'mock',
      });
    }

    const formattedData = (data || []).map((course: Record<string, unknown>) => ({
      id: course.id,
      name: course.name,
      code: course.code,
      subject: course.subject,
      teacherId: course.teacher_id,
      teacherName: '',
      teacherEmployeeId: '',
      classId: course.class_id,
      className: '',
      grade: 0,
      semester: course.semester,
      hoursPerWeek: course.hours_per_week,
      totalHours: course.total_hours,
      description: course.description,
      status: course.status,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    // 异常情况也返回Mock数据
    return NextResponse.json({
      success: true,
      data: getMockCourses(),
      source: 'mock',
    });
  }
}
