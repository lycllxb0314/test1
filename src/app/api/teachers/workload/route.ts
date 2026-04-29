/**
 * 教师工作量统计 API
 *
 * GET: 获取教师工作量统计
 */

import { withRoute } from '@/lib/api';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { ApiError } from '@/lib/api-error';
import type { TeacherService } from '@/services/teacher.service';

export const GET = withRoute(
  async (req) => {
    const { searchParams } = new URL(req.url);

    const employeeId = searchParams.get('employeeId');
    const semester = searchParams.get('semester') || undefined;
    const weekStartDate = searchParams.get('weekStartDate') || undefined;

    if (!employeeId) {
      throw ApiError.BadRequest('缺少教师工号');
    }

    const teacherService = getService<TeacherService>(SERVICE_IDENTIFIERS.TeacherService);

    const result = await teacherService.getDetailedWorkload(employeeId, semester, weekStartDate);

    if (!result.success) {
      throw ApiError.BadRequest(result.error || '获取工作量统计失败');
    }

    return result.data;
  },
  { requireAuth: true }
);
