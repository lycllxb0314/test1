/**
 * 班级学生列表 API
 *
 * GET - 获取班级学生列表
 */

import { withRoute } from '@/lib/api';
import { studentService } from '@/services/student.service';
import { ApiError } from '@/lib/api-error';

export const GET = withRoute(
  async (req, ctx) => {
    const { id } = ctx.params;
    if (!id) throw ApiError.BadRequest('缺少班级ID');

    const result = await studentService.getStudentsByClass(id as string);

    if (!result.success) {
      throw ApiError.Internal(result.error || '获取学生列表失败');
    }

    return result.data;
  },
  { requireAuth: true }
);
