/**
 * 考勤管理 API
 *
 * GET - 获取考勤记录
 * POST - 创建考勤记录
 */

import { withRoute } from '@/lib/api';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { ApiError } from '@/lib/api-error';
import type { AttendanceService } from '@/services/attendance.service';

/**
 * GET - 获取考勤记录
 */
export const GET = withRoute(
  async (req) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

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
      throw ApiError.BadRequest(result.error || '数据库查询失败');
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

    return formattedData;
  },
  { requireAuth: true }
);

/**
 * POST - 创建考勤记录
 */
export const POST = withRoute(
  async (req) => {
    const attendanceService = getService<AttendanceService>(SERVICE_IDENTIFIERS.AttendanceService);
    const body = await req.json();
    const { studentId, classId, date, status, reason, recordedBy } = body;

    if (!studentId || !date || !status) {
      throw ApiError.BadRequest('缺少必要参数');
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
      throw ApiError.BadRequest(result.error || '创建考勤记录失败');
    }

    const data = result.data as unknown as Record<string, unknown>;
    return {
      id: data?.id,
      studentId: data?.studentId,
      date: data?.date,
      status: data?.status,
    };
  },
  { requireAuth: true }
);
