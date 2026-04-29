/**
 * 单个学生 API
 *
 * GET - 获取学生详情
 * PUT - 更新学生信息
 * DELETE - 删除学生
 */

import { withRoute } from '@/lib/api';
import { studentService } from '@/services/student.service';
import { ApiError } from '@/lib/api-error';

/**
 * GET - 获取学生详情
 */
export const GET = withRoute(
  async (req, ctx) => {
    const { id } = ctx.params;
    if (!id) throw ApiError.BadRequest('缺少学生ID');

    const result = await studentService.getStudent(id as string);

    if (!result.success) {
      if (result.code === 'NOT_FOUND') throw ApiError.NotFound('学生');
      throw ApiError.Internal(result.error || '获取学生详情失败');
    }

    return result.data;
  },
  { requireAuth: true }
);

/**
 * PUT - 更新学生信息
 */
export const PUT = withRoute(
  async (req, ctx, user) => {
    const { id } = ctx.params;
    if (!id) throw ApiError.BadRequest('缺少学生ID');

    const body = await req.json();
    const result = await studentService.updateStudent(id as string, body);

    if (!result.success) {
      if (result.code === 'NOT_FOUND') throw ApiError.NotFound('学生');
      throw ApiError.Internal(result.error || '更新学生信息失败');
    }

    return result.data;
  },
  { requireAuth: true }
);

/**
 * DELETE - 删除学生
 */
export const DELETE = withRoute(
  async (req, ctx) => {
    const { id } = ctx.params;
    if (!id) throw ApiError.BadRequest('缺少学生ID');

    const result = await studentService.deleteStudent(id as string);

    if (!result.success) {
      if (result.code === 'NOT_FOUND') throw ApiError.NotFound('学生');
      throw ApiError.Internal(result.error || '删除学生失败');
    }

    return { message: '删除成功' };
  },
  { requireAuth: true }
);
