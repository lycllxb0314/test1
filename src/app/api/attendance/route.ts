/**
 * 考勤管理 API
 * 
 * GET - 获取考勤记录
 * POST - 创建考勤记录
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用统一认证中间件
 */

import { NextRequest } from 'next/server';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { withAuth } from '@/lib/auth/middleware';
import { ok, fail, serverError } from '@/lib/api';
import type { AttendanceService } from '@/services/attendance.service';

/**
 * GET - 获取考勤记录
 */
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  
  try {
    const attendanceService = getService<AttendanceService>(SERVICE_IDENTIFIERS.AttendanceService);
    
    const result = await attendanceService.listAttendance({
      classId: searchParams.get('classId') || undefined,
      studentId: searchParams.get('studentId') || undefined,
      date: searchParams.get('date') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      status: searchParams.get('status') as 'present' | 'absent' | 'late' | undefined,
      page,
      pageSize,
    });

    if (!result.success) {
      return fail(result.error || '数据库查询失败');
    }

    const formattedData = result.data?.map(record => {
      const r = record as unknown as Record<string, unknown>;
      return {
        id: r.id,
        studentId: r.studentId,
        studentName: r.studentName,
        classId: r.classId,
        className: r.className,
        date: r.date,
        status: r.status,
        reason: r.reason,
        recordedBy: r.recorderId,
        createdAt: r.createdAt,
      };
    }) || [];

    return ok(formattedData);
  } catch (err) {
    console.error('Failed to fetch attendance:', err);
    return serverError('获取考勤记录失败');
  }
});

/**
 * POST - 创建考勤记录
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const attendanceService = getService<AttendanceService>(SERVICE_IDENTIFIERS.AttendanceService);
    const body = await request.json();
    const { studentId, classId, date, status, reason, recordedBy } = body;

    if (!studentId || !date || !status) {
      return fail('缺少必要参数');
    }

    const result = await attendanceService.recordAttendance({
      studentId,
      classId,
      date,
      status,
      reason,
      recorderId: recordedBy,
    });

    if (!result.success) {
      return fail(result.error || '创建考勤记录失败');
    }

    const data = result.data as unknown as Record<string, unknown>;

    return ok({
      id: data?.id,
      studentId: data?.studentId,
      date: data?.date,
      status: data?.status,
    });
  } catch (err) {
    console.error('Failed to create attendance:', err);
    return serverError('创建考勤记录失败');
  }
});
