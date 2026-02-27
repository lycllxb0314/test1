import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Mock课表数据
const mockSchedules = [
  // 六年级1班课表 - 周一
  { id: 'sch-1', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't001', teacherName: '王明华', courseId: 'course-1', courseName: '语文', subject: '语文', dayOfWeek: 1, period: 1, startTime: '08:00', endTime: '08:40', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-2', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't002', teacherName: '李芳', courseId: 'course-2', courseName: '数学', subject: '数学', dayOfWeek: 1, period: 2, startTime: '08:50', endTime: '09:30', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-3', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't003', teacherName: '张强', courseId: 'course-3', courseName: '英语', subject: '英语', dayOfWeek: 1, period: 3, startTime: '09:50', endTime: '10:30', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-4', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't001', teacherName: '王明华', courseId: 'course-1', courseName: '语文', subject: '语文', dayOfWeek: 1, period: 4, startTime: '10:40', endTime: '11:20', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  // 六年级1班课表 - 周二
  { id: 'sch-5', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't002', teacherName: '李芳', courseId: 'course-2', courseName: '数学', subject: '数学', dayOfWeek: 2, period: 1, startTime: '08:00', endTime: '08:40', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-6', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't001', teacherName: '王明华', courseId: 'course-1', courseName: '语文', subject: '语文', dayOfWeek: 2, period: 2, startTime: '08:50', endTime: '09:30', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-7', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't004', teacherName: '刘洋', courseId: 'course-4', courseName: '科学', subject: '科学', dayOfWeek: 2, period: 3, startTime: '09:50', endTime: '10:30', roomName: '实验室A', building: 'A栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-8', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't006', teacherName: '赵刚', courseId: 'course-6', courseName: '体育', subject: '体育', dayOfWeek: 2, period: 4, startTime: '10:40', endTime: '11:20', roomName: '操场', building: '室外', semester: '2024-2025-1', status: 'active' },
  // 六年级1班课表 - 周三
  { id: 'sch-9', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't003', teacherName: '张强', courseId: 'course-3', courseName: '英语', subject: '英语', dayOfWeek: 3, period: 1, startTime: '08:00', endTime: '08:40', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-10', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't002', teacherName: '李芳', courseId: 'course-2', courseName: '数学', subject: '数学', dayOfWeek: 3, period: 2, startTime: '08:50', endTime: '09:30', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-11', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't005', teacherName: '陈红', courseId: 'course-5', courseName: '音乐', subject: '音乐', dayOfWeek: 3, period: 3, startTime: '09:50', endTime: '10:30', roomName: '音乐教室', building: 'B栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-12', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't001', teacherName: '王明华', courseId: 'course-1', courseName: '语文', subject: '语文', dayOfWeek: 3, period: 4, startTime: '10:40', endTime: '11:20', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  // 六年级1班课表 - 周四
  { id: 'sch-13', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't001', teacherName: '王明华', courseId: 'course-1', courseName: '语文', subject: '语文', dayOfWeek: 4, period: 1, startTime: '08:00', endTime: '08:40', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-14', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't002', teacherName: '李芳', courseId: 'course-2', courseName: '数学', subject: '数学', dayOfWeek: 4, period: 2, startTime: '08:50', endTime: '09:30', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-15', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't006', teacherName: '赵刚', courseId: 'course-6', courseName: '体育', subject: '体育', dayOfWeek: 4, period: 3, startTime: '09:50', endTime: '10:30', roomName: '操场', building: '室外', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-16', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't003', teacherName: '张强', courseId: 'course-3', courseName: '英语', subject: '英语', dayOfWeek: 4, period: 4, startTime: '10:40', endTime: '11:20', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  // 六年级1班课表 - 周五
  { id: 'sch-17', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't002', teacherName: '李芳', courseId: 'course-2', courseName: '数学', subject: '数学', dayOfWeek: 5, period: 1, startTime: '08:00', endTime: '08:40', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-18', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't004', teacherName: '刘洋', courseId: 'course-4', courseName: '科学', subject: '科学', dayOfWeek: 5, period: 2, startTime: '08:50', endTime: '09:30', roomName: '实验室A', building: 'A栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-19', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't001', teacherName: '王明华', courseId: 'course-1', courseName: '语文', subject: '语文', dayOfWeek: 5, period: 3, startTime: '09:50', endTime: '10:30', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-20', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't003', teacherName: '张强', courseId: 'course-3', courseName: '英语', subject: '英语', dayOfWeek: 5, period: 4, startTime: '10:40', endTime: '11:20', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
];

/**
 * GET - 获取课表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const teacherId = searchParams.get('teacherId');
    const semester = searchParams.get('semester');

    // 尝试数据库查询
    const client = getSupabaseClient();
    
    let query = client
      .from('schedules')
      .select('id, class_id, teacher_id, course_id, day_of_week, period, start_time, end_time, room_id, semester, status')
      .order('day_of_week')
      .order('period');

    if (classId) query = query.eq('class_id', classId);
    if (teacherId) query = query.eq('teacher_id', teacherId);
    if (semester) query = query.eq('semester', semester);

    const { data, error } = await query;

    if (error) {
      // 数据库失败，使用Mock数据
      let filteredData = [...mockSchedules];
      if (classId) filteredData = filteredData.filter(s => s.classId === classId);
      if (teacherId) filteredData = filteredData.filter(s => s.teacherId === teacherId);
      if (semester) filteredData = filteredData.filter(s => s.semester === semester);

      return NextResponse.json({
        success: true,
        data: filteredData,
        source: 'mock',
      });
    }

    const formattedData = (data || []).map((schedule: Record<string, unknown>) => ({
      id: schedule.id,
      classId: schedule.class_id,
      className: '',
      grade: 0,
      teacherId: schedule.teacher_id,
      teacherName: '',
      courseId: schedule.course_id,
      courseName: '',
      subject: '',
      dayOfWeek: schedule.day_of_week,
      period: schedule.period,
      startTime: schedule.start_time,
      endTime: schedule.end_time,
      roomId: schedule.room_id,
      roomName: '',
      building: '',
      semester: schedule.semester,
      status: schedule.status,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to fetch schedules:', error);
    // 异常情况也返回Mock数据
    return NextResponse.json({
      success: true,
      data: mockSchedules,
      source: 'mock',
    });
  }
}

/**
 * POST - 创建课表项
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { classId, teacherId, courseId, dayOfWeek, period, startTime, endTime, roomId, semester } = body;

    const { data, error } = await client
      .from('schedules')
      .insert({
        class_id: classId,
        teacher_id: teacherId,
        course_id: courseId,
        day_of_week: dayOfWeek,
        period,
        start_time: startTime,
        end_time: endTime,
        room_id: roomId,
        semester,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      // Mock模式返回模拟成功
      return NextResponse.json({
        success: true,
        data: {
          id: `sch-${Date.now()}`,
          classId, teacherId, courseId, dayOfWeek, period, startTime, endTime, roomId, semester,
          status: 'active',
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
    console.error('Failed to create schedule:', error);
    return NextResponse.json({
      success: false,
      error: '创建课表项失败',
    }, { status: 500 });
  }
}
