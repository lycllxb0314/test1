/**
 * 批量删除教师 API
 *
 * POST: 批量删除教师
 */

import { withRoute } from '@/lib/api';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { ApiError } from '@/lib/api-error';
import type { TeacherService } from '@/services/teacher.service';

export const POST = withRoute(
  async (req) => {
    const teacherService = getService<TeacherService>(SERVICE_IDENTIFIERS.TeacherService);
    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw ApiError.BadRequest('请选择要删除的数据');
    }

    const result = await teacherService.batchDelete(ids);

    if (!result.success) {
      throw ApiError.BadRequest(result.error || '批量删除失败');
    }

    return result.data;
  },
  { requireAuth: true }
);
