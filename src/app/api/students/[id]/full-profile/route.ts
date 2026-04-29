/**
 * 学生完整档案 API
 *
 * GET - 获取学生完整档案
 */

import { withRoute } from '@/lib/api';
import { studentService } from '@/services/student.service';
import { ApiError } from '@/lib/api-error';

export const GET = withRoute(
  async (req, ctx) => {
    const { id } = ctx.params;
    if (!id) throw ApiError.BadRequest('缺少学生ID');

    const result = await studentService.getStudentProfile(id as string);

    if (!result.success) {
      if (result.code === 'NOT_FOUND') throw ApiError.NotFound('学生');
      throw ApiError.Internal(result.error || '获取学生档案失败');
    }

    return result.data;
  },
  { requireAuth: true }
);
