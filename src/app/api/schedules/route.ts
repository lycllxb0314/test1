/**
 * 课表管理 API
 * 
 * 使用统一的路由处理模式和集中的Mock数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getMockScheduleViewData, MOCK_SCHEDULE_VIEW_DATA, type ScheduleViewItem } from '@/lib/mock/schedules.mock';
import { success, error, parseQueryParams, ErrorCode } from '@/lib/api-route-utils';

/**
 * GET - 获取课表
 * 
 * 查询参数：
 * - classId: 班级ID
 * - teacherId: 教师ID
 * - semester: 学期
 */
export async function GET(request: NextRequest) {
  const params = parseQueryParams(request);
  
  try {
    const client = getSupabaseClient();
    
    // 构建查询
    let query = client
      .from('schedules')
      .select('id, class_id, teacher_id, course_id, day_of_week, period, start_time, end_time, room_id, semester, status')
      .order('day_of_week')
      .order('period');

    if (params.classId) query = query.eq('class_id', params.classId);
    if (params.teacherId) query = query.eq('teacher_id', params.teacherId);
    if (params.semester) query = query.eq('semester', params.semester);

    const { data, error: dbError } = await query;

    if (dbError) {
      console.log('Database query failed, using mock data:', dbError.message);
      
      // 使用集中的Mock数据
      const mockData = getMockScheduleViewData({
        classId: params.classId as string,
        teacherId: params.teacherId as string,
        semester: params.semester as string,
      });

      return NextResponse.json(success(mockData, 'mock'));
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

    return NextResponse.json(success(formattedData, 'database'));
  } catch (err) {
    console.error('Failed to fetch schedules:', err);
    
    // 异常情况也返回Mock数据
    const mockData = getMockScheduleViewData({
      classId: params.classId as string,
      teacherId: params.teacherId as string,
      semester: params.semester as string,
    });
    
    return NextResponse.json(success(mockData, 'mock'));
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

    const { data, error: dbError } = await client
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

    if (dbError) {
      console.log('Database insert failed, returning mock response:', dbError.message);
      
      // Mock模式返回模拟成功
      const newItem: ScheduleViewItem = {
        id: `sch-${Date.now()}`,
        classId,
        className: '',
        grade: 0,
        teacherId,
        teacherName: '',
        courseId,
        courseName: '',
        subject: '',
        dayOfWeek,
        period,
        startTime,
        endTime,
        roomId,
        roomName: '',
        building: '',
        semester,
        status: 'active',
      };
      
      return NextResponse.json(success(newItem, 'mock'));
    }

    return NextResponse.json(success(data, 'database'));
  } catch (err) {
    console.error('Failed to create schedule:', err);
    return NextResponse.json(error('创建课表项失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
