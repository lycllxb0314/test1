/**
 * 教师考勤 API
 * 
 * GET: 获取教师考勤记录
 * POST: 创建教师考勤记录（签到/签退）
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { teacherAttendanceService } from '@/services/misc.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取教师考勤记录
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || undefined;
  const teacherId = searchParams.get('teacherId') || undefined;
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  let result;
  if (date) {
    result = await teacherAttendanceService.getByDate(date);
  } else if (teacherId) {
    result = await teacherAttendanceService.getByTeacher(teacherId, startDate, endDate);
  } else {
    return NextResponse.json(
      error('需要提供日期或教师ID', ErrorCode.VALIDATION_ERROR),
      { status: 400 }
    );
  }

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取教师考勤记录失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  const formattedData = result.data.map((record: any) => ({
    id: record.id,
    teacherId: record.teacher_id,
    teacherName: record.teacher_name,
    date: record.date,
    checkInTime: record.check_in_time,
    checkOutTime: record.check_out_time,
    status: record.status,
    location: record.location,
    notes: record.notes,
    createdAt: record.created_at,
  }));

  return NextResponse.json(success(formattedData));
}

/**
 * POST - 签到/签退
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, teacherId, teacherName, location } = body;

  let result;
  if (action === 'checkIn') {
    result = await teacherAttendanceService.checkIn(teacherId, teacherName, location);
  } else if (action === 'checkOut') {
    result = await teacherAttendanceService.checkOut(teacherId);
  } else {
    return NextResponse.json(
      error('无效的操作类型', ErrorCode.VALIDATION_ERROR),
      { status: 400 }
    );
  }

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '操作失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
}
