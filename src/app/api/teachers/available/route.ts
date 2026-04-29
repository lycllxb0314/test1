/**
 * 可用教师查询 API
 *
 * GET: 查询某时段无课的教师（用于代课安排）
 */

import { withRoute } from '@/lib/api';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { ApiError } from '@/lib/api-error';
import type { TeacherService } from '@/services/teacher.service';

export const GET = withRoute(
  async (req) => {
    const { searchParams } = new URL(req.url);

    const subject = searchParams.get('subject') || undefined;
    const weekDay = searchParams.get('weekDay') ? parseInt(searchParams.get('weekDay')!) : undefined;
    const periodIndex = searchParams.get('periodIndex') ? parseInt(searchParams.get('periodIndex')!) : undefined;
    const weekStartDate = searchParams.get('weekStartDate') || undefined;
    const excludeIdsStr = searchParams.get('excludeIds') || '';
    const excludeIds = excludeIdsStr ? excludeIdsStr.split(',') : undefined;

    const teacherService = getService<TeacherService>(SERVICE_IDENTIFIERS.TeacherService);

    const result = await teacherService.getAvailableTeachers({
      subject,
      weekDay,
      periodIndex,
      weekStartDate,
      excludeIds,
    });

    if (!result.success) {
      throw ApiError.BadRequest(result.error || '获取可用教师失败');
    }

    return result.data;
  },
  { requireAuth: true }
);
