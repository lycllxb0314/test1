import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Mock课程数据
const mockCourses = [
  { id: 'course-1', name: '语文', code: 'YW001', subject: '语文', teacherId: 't001', teacherName: '王明华', teacherEmployeeId: 'T001', classId: 'c6-1', className: '六年级1班', grade: 6, semester: '2024-2025-1', hoursPerWeek: 6, totalHours: 216, status: 'active' },
  { id: 'course-2', name: '数学', code: 'SX001', subject: '数学', teacherId: 't002', teacherName: '李芳', teacherEmployeeId: 'T002', classId: 'c6-1', className: '六年级1班', grade: 6, semester: '2024-2025-1', hoursPerWeek: 5, totalHours: 180, status: 'active' },
  { id: 'course-3', name: '英语', code: 'YY001', subject: '英语', teacherId: 't003', teacherName: '张强', teacherEmployeeId: 'T003', classId: 'c6-1', className: '六年级1班', grade: 6, semester: '2024-2025-1', hoursPerWeek: 3, totalHours: 108, status: 'active' },
  { id: 'course-4', name: '科学', code: 'KX001', subject: '科学', teacherId: 't004', teacherName: '刘洋', teacherEmployeeId: 'T004', classId: 'c6-1', className: '六年级1班', grade: 6, semester: '2024-2025-1', hoursPerWeek: 2, totalHours: 72, status: 'active' },
  { id: 'course-5', name: '音乐', code: 'YY002', subject: '音乐', teacherId: 't005', teacherName: '陈红', teacherEmployeeId: 'T005', classId: 'c6-1', className: '六年级1班', grade: 6, semester: '2024-2025-1', hoursPerWeek: 1, totalHours: 36, status: 'active' },
  { id: 'course-6', name: '体育', code: 'TY001', subject: '体育', teacherId: 't006', teacherName: '赵刚', teacherEmployeeId: 'T006', classId: 'c6-1', className: '六年级1班', grade: 6, semester: '2024-2025-1', hoursPerWeek: 3, totalHours: 108, status: 'active' },
  { id: 'course-7', name: '美术', code: 'MS001', subject: '美术', teacherId: 't007', teacherName: '孙丽', teacherEmployeeId: 'T007', classId: 'c5-1', className: '五年级1班', grade: 5, semester: '2024-2025-1', hoursPerWeek: 1, totalHours: 36, status: 'active' },
  { id: 'course-8', name: '信息技术', code: 'XX001', subject: '信息技术', teacherId: 't008', teacherName: '周伟', teacherEmployeeId: 'T008', classId: 'c5-1', className: '五年级1班', grade: 5, semester: '2024-2025-1', hoursPerWeek: 1, totalHours: 36, status: 'active' },
];

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
      let filteredData = [...mockCourses];
      if (teacherId) filteredData = filteredData.filter(c => c.teacherId === teacherId);
      if (classId) filteredData = filteredData.filter(c => c.classId === classId);
      if (semester) filteredData = filteredData.filter(c => c.semester === semester);

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
      data: mockCourses,
      source: 'mock',
    });
  }
}
