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
import { getMockAfterSchoolServices } from '@/lib/mock/academic.mock';
import type { AfterSchoolService } from '@/lib/mock/academic.mock';

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
      const filteredData = getMockAfterSchoolServices({
        teacherId: teacherId || undefined,
        classId: classId || undefined,
        date: date || undefined,
        semester: semester || undefined,
        serviceType: serviceType || undefined,
        status: status || undefined,
      });

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
      data: getMockAfterSchoolServices(),
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
