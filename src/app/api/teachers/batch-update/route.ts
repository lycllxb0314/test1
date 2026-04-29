/**
 * 批量更新教师 API
 *
 * POST: 批量更新教师信息
 */

import { withRoute } from '@/lib/api';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { ApiError } from '@/lib/api-error';
import type { TeacherService } from '@/services/teacher.service';

export const POST = withRoute(
  async (req) => {
    const teacherService = getService<TeacherService>(SERVICE_IDENTIFIERS.TeacherService);
    const body = await req.json();
    const { ids, updates } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw ApiError.BadRequest('请选择要更新的数据');
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw ApiError.BadRequest('请提供更新内容');
    }

    const result = await teacherService.batchUpdate({ ids, updates });

    if (!result.success) {
      throw ApiError.BadRequest(result.error || '批量更新失败');
    }

    return result.data;
  },
  { requireAuth: true }
);
