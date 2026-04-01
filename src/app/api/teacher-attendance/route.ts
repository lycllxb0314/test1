/**
 * 教师考勤 API
 * 
 * GET: 获取教师考勤记录
 *   - type=daily&date=xxx: 获取指定日期的考勤数据
 *   - type=monthly&month=xxx: 获取指定月份的考勤数据
 *   - teacherId=xxx: 获取指定教师的考勤记录
 * 
 * POST: 签到/签退
 * PATCH: 标记考勤状态（正常、迟到、旷工）
 */

import { NextRequest, NextResponse } from 'next/server';
import { teacherAttendanceService } from '@/services/misc.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取教师考勤记录
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'daily';
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const month = searchParams.get('month');
  const teacherId = searchParams.get('teacherId');
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  try {
    if (teacherId) {
      // 获取指定教师的考勤记录
      const result = await teacherAttendanceService.getByTeacher(teacherId, startDate, endDate);
      if (!result.success || !result.data) {
        return NextResponse.json(
          error(result.error || '获取教师考勤记录失败', ErrorCode.DATABASE_ERROR),
          { status: 500 }
        );
      }
      return NextResponse.json(success(result.data));
    }

    if (type === 'daily') {
      // 获取每日考勤数据
      const result = await teacherAttendanceService.getDailyAttendance(date);
      if (!result.success || !result.data) {
        return NextResponse.json(
          error(result.error || '获取每日考勤数据失败', ErrorCode.DATABASE_ERROR),
          { status: 500 }
        );
      }
      return NextResponse.json(success(result.data));
    } else if (type === 'monthly') {
      // 获取月度考勤数据
      const targetMonth = month || date.substring(0, 7);
      const result = await teacherAttendanceService.getMonthlyAttendance(targetMonth);
      if (!result.success || !result.data) {
        return NextResponse.json(
          error(result.error || '获取月度考勤数据失败', ErrorCode.DATABASE_ERROR),
          { status: 500 }
        );
      }
      return NextResponse.json(success(result.data));
    }

    return NextResponse.json(
      error('无效的查询类型', ErrorCode.VALIDATION_ERROR),
      { status: 400 }
    );
  } catch (err) {
    console.error('教师考勤API错误:', err);
    return NextResponse.json(
      error('服务器错误', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * POST - 签到/签退
 */
export async function POST(request: NextRequest) {
  try {
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
  } catch (err) {
    console.error('签到/签退API错误:', err);
    return NextResponse.json(
      error('服务器错误', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * PATCH - 标记考勤状态
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacherId, teacherName, date, status, remark } = body;

    if (!teacherId || !date || !status) {
      return NextResponse.json(
        error('缺少必填参数', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    const result = await teacherAttendanceService.markStatus(
      teacherId,
      teacherName,
      date,
      status,
      remark
    );

    if (!result.success) {
      return NextResponse.json(
        error(result.error || '标记考勤状态失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(result.data));
  } catch (err) {
    console.error('标记考勤状态API错误:', err);
    return NextResponse.json(
      error('服务器错误', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
