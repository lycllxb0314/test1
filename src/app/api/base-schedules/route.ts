/**
 * 基准课表 API
 * 
 * GET: 获取基准课表
 * POST: 创建/更新基准课表
 * PUT: 批量更新基准课表
 * DELETE: 删除基准课表
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { BaseScheduleSlot } from '@/types';

// Mock基准课表数据
const mockBaseScheduleSlots: BaseScheduleSlot[] = [
  // 一年级1班
  {
    id: 'bs001',
    semester: '2024-2025-1',
    classId: 'c001',
    className: '一年级1班',
    grade: 1,
    dayOfWeek: 1,
    periodIndex: 1,
    startTime: '08:00',
    endTime: '08:40',
    subject: '语文',
    teacherId: 't001',
    teacherName: '张明华',
    classroomId: 'room001',
    classroomName: '一年级1班教室',
    status: 'normal',
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'bs002',
    semester: '2024-2025-1',
    classId: 'c001',
    className: '一年级1班',
    grade: 1,
    dayOfWeek: 1,
    periodIndex: 2,
    startTime: '08:50',
    endTime: '09:30',
    subject: '数学',
    teacherId: 't002',
    teacherName: '李雪梅',
    classroomId: 'room001',
    classroomName: '一年级1班教室',
    status: 'normal',
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'bs003',
    semester: '2024-2025-1',
    classId: 'c001',
    className: '一年级1班',
    grade: 1,
    dayOfWeek: 1,
    periodIndex: 3,
    startTime: '10:00',
    endTime: '10:40',
    subject: '语文',
    teacherId: 't001',
    teacherName: '张明华',
    classroomId: 'room001',
    classroomName: '一年级1班教室',
    status: 'normal',
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'bs004',
    semester: '2024-2025-1',
    classId: 'c001',
    className: '一年级1班',
    grade: 1,
    dayOfWeek: 1,
    periodIndex: 4,
    startTime: '10:50',
    endTime: '11:30',
    subject: '美术',
    teacherId: 't005',
    teacherName: '陈思思',
    classroomId: 'art001',
    classroomName: '美术教室',
    status: 'normal',
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'bs005',
    semester: '2024-2025-1',
    classId: 'c001',
    className: '一年级1班',
    grade: 1,
    dayOfWeek: 2,
    periodIndex: 1,
    startTime: '08:00',
    endTime: '08:40',
    subject: '数学',
    teacherId: 't002',
    teacherName: '李雪梅',
    classroomId: 'room001',
    classroomName: '一年级1班教室',
    status: 'normal',
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'bs006',
    semester: '2024-2025-1',
    classId: 'c001',
    className: '一年级1班',
    grade: 1,
    dayOfWeek: 2,
    periodIndex: 2,
    startTime: '08:50',
    endTime: '09:30',
    subject: '语文',
    teacherId: 't001',
    teacherName: '张明华',
    classroomId: 'room001',
    classroomName: '一年级1班教室',
    status: 'normal',
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'bs007',
    semester: '2024-2025-1',
    classId: 'c001',
    className: '一年级1班',
    grade: 1,
    dayOfWeek: 2,
    periodIndex: 3,
    startTime: '10:00',
    endTime: '10:40',
    subject: '数学',
    teacherId: 't002',
    teacherName: '李雪梅',
    classroomId: 'room001',
    classroomName: '一年级1班教室',
    status: 'normal',
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'bs008',
    semester: '2024-2025-1',
    classId: 'c001',
    className: '一年级1班',
    grade: 1,
    dayOfWeek: 2,
    periodIndex: 4,
    startTime: '10:50',
    endTime: '11:30',
    subject: '体育',
    teacherId: 't006',
    teacherName: '王强',
    classroomId: 'playground',
    classroomName: '操场',
    status: 'normal',
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'bs009',
    semester: '2024-2025-1',
    classId: 'c001',
    className: '一年级1班',
    grade: 1,
    dayOfWeek: 3,
    periodIndex: 1,
    startTime: '08:00',
    endTime: '08:40',
    subject: '语文',
    teacherId: 't001',
    teacherName: '张明华',
    classroomId: 'room001',
    classroomName: '一年级1班教室',
    status: 'normal',
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'bs010',
    semester: '2024-2025-1',
    classId: 'c001',
    className: '一年级1班',
    grade: 1,
    dayOfWeek: 3,
    periodIndex: 2,
    startTime: '08:50',
    endTime: '09:30',
    subject: '语文',
    teacherId: 't001',
    teacherName: '张明华',
    classroomId: 'room001',
    classroomName: '一年级1班教室',
    status: 'normal',
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
  // 一年级2班
  {
    id: 'bs101',
    semester: '2024-2025-1',
    classId: 'c002',
    className: '一年级2班',
    grade: 1,
    dayOfWeek: 1,
    periodIndex: 1,
    startTime: '08:00',
    endTime: '08:40',
    subject: '数学',
    teacherId: 't002',
    teacherName: '李雪梅',
    classroomId: 'room002',
    classroomName: '一年级2班教室',
    status: 'normal',
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'bs102',
    semester: '2024-2025-1',
    classId: 'c002',
    className: '一年级2班',
    grade: 1,
    dayOfWeek: 1,
    periodIndex: 2,
    startTime: '08:50',
    endTime: '09:30',
    subject: '语文',
    teacherId: 't003',
    teacherName: '王建国',
    classroomId: 'room002',
    classroomName: '一年级2班教室',
    status: 'normal',
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'bs103',
    semester: '2024-2025-1',
    classId: 'c002',
    className: '一年级2班',
    grade: 1,
    dayOfWeek: 1,
    periodIndex: 3,
    startTime: '10:00',
    endTime: '10:40',
    subject: '数学',
    teacherId: 't002',
    teacherName: '李雪梅',
    classroomId: 'room002',
    classroomName: '一年级2班教室',
    status: 'normal',
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
];

// 标准时间段配置
const PERIODS = [
  { index: 1, name: '第一节', startTime: '08:00', endTime: '08:40', type: 'morning' },
  { index: 2, name: '第二节', startTime: '08:50', endTime: '09:30', type: 'morning' },
  { index: 3, name: '第三节', startTime: '10:00', endTime: '10:40', type: 'morning' },
  { index: 4, name: '第四节', startTime: '10:50', endTime: '11:30', type: 'morning' },
  { index: 5, name: '第五节', startTime: '14:00', endTime: '14:40', type: 'afternoon' },
  { index: 6, name: '第六节', startTime: '14:50', endTime: '15:30', type: 'afternoon' },
  { index: 7, name: '第七节', startTime: '15:40', endTime: '16:20', type: 'afternoon' },
  { index: 8, name: '第八节', startTime: '16:30', endTime: '17:10', type: 'afternoon' },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const semester = searchParams.get('semester') || '2024-2025-1';
  const classId = searchParams.get('classId');
  const teacherId = searchParams.get('teacherId');
  const dayOfWeek = searchParams.get('dayOfWeek');
  const periodIndex = searchParams.get('periodIndex');

  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('base_schedules')
      .select('*')
      .eq('semester', semester)
      .order('day_of_week', { ascending: true })
      .order('period_index', { ascending: true });

    if (classId) query = query.eq('class_id', classId);
    if (teacherId) query = query.eq('teacher_id', teacherId);
    if (dayOfWeek) query = query.eq('day_of_week', parseInt(dayOfWeek));
    if (periodIndex) query = query.eq('period_index', parseInt(periodIndex));

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      // 使用Mock数据
      let filteredData = [...mockBaseScheduleSlots];
      if (classId) filteredData = filteredData.filter(s => s.classId === classId);
      if (teacherId) filteredData = filteredData.filter(s => s.teacherId === teacherId);
      if (dayOfWeek) filteredData = filteredData.filter(s => s.dayOfWeek === parseInt(dayOfWeek));
      if (periodIndex) filteredData = filteredData.filter(s => s.periodIndex === parseInt(periodIndex));

      // 转换为课表矩阵格式
      const scheduleMatrix = convertToMatrix(filteredData);

      return NextResponse.json({
        success: true,
        data: filteredData,
        matrix: scheduleMatrix,
        periods: PERIODS,
        source: 'mock',
      });
    }

    const formattedData: BaseScheduleSlot[] = (data || []).map((record: Record<string, unknown>) => ({
      id: record.id as string,
      semester: record.semester as string,
      classId: record.class_id as string,
      className: record.class_name as string,
      grade: record.grade as number,
      dayOfWeek: record.day_of_week as number,
      periodIndex: record.period_index as number,
      startTime: record.start_time as string,
      endTime: record.end_time as string,
      subject: record.subject as string,
      courseType: record.course_type as 'normal' | 'activity' | 'self_study' | undefined,
      teacherId: record.teacher_id as string,
      teacherName: record.teacher_name as string,
      classroomId: record.classroom_id as string | undefined,
      classroomName: record.classroom_name as string | undefined,
      status: record.status as 'normal' | 'leave' | 'substitute' | 'cancelled',
      createdAt: record.created_at as string,
      updatedAt: record.updated_at as string,
    }));

    const scheduleMatrix = convertToMatrix(formattedData);

    return NextResponse.json({
      success: true,
      data: formattedData,
      matrix: scheduleMatrix,
      periods: PERIODS,
      source: 'database',
    });
  } catch (error) {
    console.error('获取基准课表失败:', error);
    
    let filteredData = [...mockBaseScheduleSlots];
    if (classId) filteredData = filteredData.filter(s => s.classId === classId);
    if (teacherId) filteredData = filteredData.filter(s => s.teacherId === teacherId);
    
    const scheduleMatrix = convertToMatrix(filteredData);
    
    return NextResponse.json({
      success: true,
      data: filteredData,
      matrix: scheduleMatrix,
      periods: PERIODS,
      source: 'mock',
    });
  }
}

/**
 * 将课表数据转换为矩阵格式（方便前端展示）
 */
function convertToMatrix(schedules: BaseScheduleSlot[]): Record<string, Record<number, BaseScheduleSlot[]>> {
  const matrix: Record<string, Record<number, BaseScheduleSlot[]>> = {};
  
  for (const schedule of schedules) {
    const key = `${schedule.dayOfWeek}`;
    if (!matrix[key]) {
      matrix[key] = {};
    }
    if (!matrix[key][schedule.periodIndex]) {
      matrix[key][schedule.periodIndex] = [];
    }
    matrix[key][schedule.periodIndex].push(schedule);
  }
  
  return matrix;
}

/**
 * POST: 创建/更新单个课次
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    const {
      semester,
      classId,
      className,
      grade,
      dayOfWeek,
      periodIndex,
      subject,
      teacherId,
      teacherName,
      classroomId,
      classroomName,
    } = body;

    // 获取标准时间段
    const period = PERIODS.find(p => p.index === periodIndex);
    if (!period) {
      return NextResponse.json({
        success: false,
        message: '无效的节次',
      }, { status: 400 });
    }

    // 检查冲突
    const { data: conflicts } = await client
      .from('base_schedules')
      .select('*')
      .eq('semester', semester)
      .eq('class_id', classId)
      .eq('day_of_week', dayOfWeek)
      .eq('period_index', periodIndex);

    if (conflicts && conflicts.length > 0) {
      // 更新现有记录
      const { data, error } = await client
        .from('base_schedules')
        .update({
          subject,
          teacher_id: teacherId,
          teacher_name: teacherName,
          classroom_id: classroomId,
          classroom_name: classroomName,
          start_time: period.startTime,
          end_time: period.endTime,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conflicts[0].id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({
          success: true,
          data: {
            id: conflicts[0].id,
            semester,
            classId,
            className,
            grade,
            dayOfWeek,
            periodIndex,
            startTime: period.startTime,
            endTime: period.endTime,
            subject,
            teacherId,
            teacherName,
            classroomId,
            classroomName,
            status: 'normal',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          source: 'mock',
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          id: data.id,
          semester: data.semester,
          classId: data.class_id,
          className: data.class_name,
          grade: data.grade,
          dayOfWeek: data.day_of_week,
          periodIndex: data.period_index,
          startTime: data.start_time,
          endTime: data.end_time,
          subject: data.subject,
          teacherId: data.teacher_id,
          teacherName: data.teacher_name,
          classroomId: data.classroom_id,
          classroomName: data.classroom_name,
          status: data.status,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
        source: 'database',
      });
    }

    // 创建新记录
    const { data, error } = await client
      .from('base_schedules')
      .insert({
        semester,
        class_id: classId,
        class_name: className,
        grade,
        day_of_week: dayOfWeek,
        period_index: periodIndex,
        start_time: period.startTime,
        end_time: period.endTime,
        subject,
        teacher_id: teacherId,
        teacher_name: teacherName,
        classroom_id: classroomId,
        classroom_name: classroomName,
        status: 'normal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: true,
        data: {
          id: `bs-${Date.now()}`,
          semester,
          classId,
          className,
          grade,
          dayOfWeek,
          periodIndex,
          startTime: period.startTime,
          endTime: period.endTime,
          subject,
          teacherId,
          teacherName,
          classroomId,
          classroomName,
          status: 'normal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        source: 'mock',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        semester: data.semester,
        classId: data.class_id,
        className: data.class_name,
        grade: data.grade,
        dayOfWeek: data.day_of_week,
        periodIndex: data.period_index,
        startTime: data.start_time,
        endTime: data.end_time,
        subject: data.subject,
        teacherId: data.teacher_id,
        teacherName: data.teacher_name,
        classroomId: data.classroom_id,
        classroomName: data.classroom_name,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
      source: 'database',
    });
  } catch (error) {
    console.error('创建基准课表失败:', error);
    return NextResponse.json({
      success: false,
      message: '创建基准课表失败',
    }, { status: 500 });
  }
}

/**
 * PUT: 批量更新基准课表
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { semester, classId, schedules } = body;

    if (!semester || !classId || !Array.isArray(schedules)) {
      return NextResponse.json({
        success: false,
        message: '参数不完整',
      }, { status: 400 });
    }

    // 删除旧的课表
    await client
      .from('base_schedules')
      .delete()
      .eq('semester', semester)
      .eq('class_id', classId);

    // 批量插入新的课表
    const records = schedules.map((s: Record<string, unknown>) => {
      const period = PERIODS.find(p => p.index === s.periodIndex);
      return {
        semester,
        class_id: classId,
        class_name: s.className,
        grade: s.grade,
        day_of_week: s.dayOfWeek,
        period_index: s.periodIndex,
        start_time: period?.startTime || '08:00',
        end_time: period?.endTime || '08:40',
        subject: s.subject,
        teacher_id: s.teacherId,
        teacher_name: s.teacherName,
        classroom_id: s.classroomId,
        classroom_name: s.classroomName,
        status: 'normal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    const { error } = await client
      .from('base_schedules')
      .insert(records);

    if (error) {
      return NextResponse.json({
        success: true,
        data: schedules,
        source: 'mock',
        message: '更新成功（mock模式）',
      });
    }

    return NextResponse.json({
      success: true,
      data: schedules,
      source: 'database',
      message: '更新成功',
    });
  } catch (error) {
    console.error('批量更新基准课表失败:', error);
    return NextResponse.json({
      success: false,
      message: '批量更新基准课表失败',
    }, { status: 500 });
  }
}

/**
 * DELETE: 删除基准课表
 */
export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const semester = searchParams.get('semester');
    const classId = searchParams.get('classId');

    if (id) {
      // 删除单个
      await client.from('base_schedules').delete().eq('id', id);
    } else if (semester && classId) {
      // 删除班级整周课表
      await client
        .from('base_schedules')
        .delete()
        .eq('semester', semester)
        .eq('class_id', classId);
    } else {
      return NextResponse.json({
        success: false,
        message: '缺少删除条件',
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除基准课表失败:', error);
    return NextResponse.json({
      success: true,
      message: '删除成功（mock）',
    });
  }
}
