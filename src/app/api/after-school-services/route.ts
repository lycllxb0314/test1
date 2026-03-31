/**
 * 课后服务 API
 * 
 * GET: 获取课后服务列表
 * POST: 创建课后服务
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { afterSchoolServiceService } from '@/services/misc.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取课后服务列表
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const semester = searchParams.get('semester') || undefined;

  const result = await afterSchoolServiceService.getList(semester);

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取课后服务列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  const formattedData = result.data.map((service: any) => ({
    id: service.id,
    name: service.name,
    type: service.type,
    teacherId: service.teacher_id,
    teacherName: service.teacher_name,
    dayOfWeek: service.day_of_week,
    startTime: service.start_time,
    endTime: service.end_time,
    location: service.location,
    capacity: service.capacity,
    enrolled: service.enrolled,
    status: service.status,
    semester: service.semester,
    createdAt: service.created_at,
  }));

  return NextResponse.json(success(formattedData));
}

/**
 * POST - 创建课后服务
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = await afterSchoolServiceService.create({
    name: body.name,
    type: body.type,
    teacher_id: body.teacherId,
    teacher_name: body.teacherName,
    day_of_week: body.dayOfWeek,
    start_time: body.startTime,
    end_time: body.endTime,
    location: body.location,
    capacity: body.capacity,
    enrolled: body.enrolled || 0,
    status: body.status || 'active',
    semester: body.semester,
  });

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '创建课后服务失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
}
