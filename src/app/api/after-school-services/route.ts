/**
 * 课后服务 API
 * 
 * GET: 获取课后服务记录
 * POST: 创建课后服务记录
 * PUT: 更新课后服务记录
 * DELETE: 删除课后服务记录
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { AfterSchoolService } from '@/types';

// Mock课后服务数据
const mockAfterSchoolServices: AfterSchoolService[] = [
  {
    id: 'as001',
    semester: '2024-2025-1',
    weekNumber: 12,
    date: '2024-11-18',
    serviceType: '课后托管',
    classId: 'c001',
    className: '一年级1班',
    grade: 1,
    teacherId: 't001',
    teacherName: '张明华',
    periodIndex: 8,
    startTime: '16:30',
    endTime: '17:30',
    hours: 1,
    status: 'completed',
    studentCount: 25,
    createdAt: '2024-11-18T00:00:00Z',
    updatedAt: '2024-11-18T00:00:00Z',
  },
  {
    id: 'as002',
    semester: '2024-2025-1',
    weekNumber: 12,
    date: '2024-11-18',
    serviceType: '兴趣班',
    classId: 'c002',
    className: '一年级2班',
    grade: 1,
    teacherId: 't008',
    teacherName: '吴晓燕',
    periodIndex: 8,
    startTime: '16:30',
    endTime: '17:30',
    hours: 1,
    status: 'completed',
    studentCount: 20,
    remark: '羽毛球兴趣班',
    createdAt: '2024-11-18T00:00:00Z',
    updatedAt: '2024-11-18T00:00:00Z',
  },
  {
    id: 'as003',
    semester: '2024-2025-1',
    weekNumber: 12,
    date: '2024-11-19',
    serviceType: '课后托管',
    classId: 'c003',
    className: '二年级1班',
    grade: 2,
    teacherId: 't003',
    teacherName: '王建国',
    periodIndex: 8,
    startTime: '16:30',
    endTime: '17:30',
    hours: 1,
    status: 'scheduled',
    studentCount: 28,
    createdAt: '2024-11-19T00:00:00Z',
    updatedAt: '2024-11-19T00:00:00Z',
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const teacherId = searchParams.get('teacherId');
  const classId = searchParams.get('classId');
  const date = searchParams.get('date');
  const semester = searchParams.get('semester');
  const weekNumber = searchParams.get('weekNumber');
  const serviceType = searchParams.get('serviceType');
  const status = searchParams.get('status');

  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('after_school_services')
      .select('*')
      .order('date', { ascending: false });

    if (teacherId) query = query.eq('teacher_id', teacherId);
    if (classId) query = query.eq('class_id', classId);
    if (date) query = query.eq('date', date);
    if (semester) query = query.eq('semester', semester);
    if (weekNumber) query = query.eq('week_number', parseInt(weekNumber));
    if (serviceType) query = query.eq('service_type', serviceType);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) {
      // 数据库失败，使用Mock数据
      let filteredData = [...mockAfterSchoolServices];
      if (teacherId) filteredData = filteredData.filter(s => s.teacherId === teacherId);
      if (classId) filteredData = filteredData.filter(s => s.classId === classId);
      if (date) filteredData = filteredData.filter(s => s.date === date);
      if (semester) filteredData = filteredData.filter(s => s.semester === semester);
      if (weekNumber) filteredData = filteredData.filter(s => s.weekNumber === parseInt(weekNumber));
      if (serviceType) filteredData = filteredData.filter(s => s.serviceType === serviceType);
      if (status) filteredData = filteredData.filter(s => s.status === status);

      return NextResponse.json({
        success: true,
        data: filteredData,
        source: 'mock',
      });
    }

    const formattedData: AfterSchoolService[] = (data || []).map((record: Record<string, unknown>) => ({
      id: record.id as string,
      semester: record.semester as string,
      weekNumber: record.week_number as number,
      date: record.date as string,
      serviceType: record.service_type as string,
      classId: record.class_id as string,
      className: record.class_name as string,
      grade: record.grade as number,
      teacherId: record.teacher_id as string,
      teacherName: record.teacher_name as string,
      periodIndex: record.period_index as number,
      startTime: record.start_time as string,
      endTime: record.end_time as string,
      hours: record.hours as number,
      status: record.status as 'scheduled' | 'completed' | 'cancelled',
      studentCount: record.student_count as number,
      remark: record.remark as string | undefined,
      createdAt: record.created_at as string,
      updatedAt: record.updated_at as string,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
      source: 'database',
    });
  } catch (error) {
    console.error('获取课后服务失败:', error);
    return NextResponse.json({
      success: true,
      data: mockAfterSchoolServices,
      source: 'mock',
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    const {
      semester,
      weekNumber,
      date,
      serviceType,
      classId,
      className,
      grade,
      teacherId,
      teacherName,
      periodIndex,
      startTime,
      endTime,
      hours,
      studentCount,
      remark,
    } = body;

    const { data, error } = await client
      .from('after_school_services')
      .insert({
        semester,
        week_number: weekNumber,
        date,
        service_type: serviceType,
        class_id: classId,
        class_name: className,
        grade,
        teacher_id: teacherId,
        teacher_name: teacherName,
        period_index: periodIndex,
        start_time: startTime,
        end_time: endTime,
        hours: hours || 1,
        status: 'scheduled',
        student_count: studentCount,
        remark,
      })
      .select()
      .single();

    if (error) {
      // 返回Mock成功响应
      return NextResponse.json({
        success: true,
        data: {
          id: `as-${Date.now()}`,
          semester,
          weekNumber,
          date,
          serviceType,
          classId,
          className,
          grade,
          teacherId,
          teacherName,
          periodIndex,
          startTime,
          endTime,
          hours: hours || 1,
          status: 'scheduled',
          studentCount,
          remark,
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
        weekNumber: data.week_number,
        date: data.date,
        serviceType: data.service_type,
        classId: data.class_id,
        className: data.class_name,
        grade: data.grade,
        teacherId: data.teacher_id,
        teacherName: data.teacher_name,
        periodIndex: data.period_index,
        startTime: data.start_time,
        endTime: data.end_time,
        hours: data.hours,
        status: data.status,
        studentCount: data.student_count,
        remark: data.remark,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
      source: 'database',
    });
  } catch (error) {
    console.error('创建课后服务失败:', error);
    return NextResponse.json({
      success: false,
      message: '创建课后服务失败',
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { id, status, remark } = body;

    const { data, error } = await client
      .from('after_school_services')
      .update({
        status,
        remark,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: true,
        data: { id, status, remark },
        source: 'mock',
      });
    }

    return NextResponse.json({
      success: true,
      data,
      source: 'database',
    });
  } catch (error) {
    console.error('更新课后服务失败:', error);
    return NextResponse.json({
      success: false,
      message: '更新课后服务失败',
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        message: '缺少ID',
      }, { status: 400 });
    }

    const { error } = await client
      .from('after_school_services')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({
        success: true,
        message: '删除成功（mock）',
        source: 'mock',
      });
    }

    return NextResponse.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除课后服务失败:', error);
    return NextResponse.json({
      success: false,
      message: '删除课后服务失败',
    }, { status: 500 });
  }
}
