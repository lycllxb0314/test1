/**
 * 单个班级 API
 *
 * GET - 获取班级详情
 * PUT - 更新班级信息
 * DELETE - 删除班级
 */

import { withRoute } from '@/lib/api';
import { classService } from '@/services/class.service';
import { ApiError } from '@/lib/api-error';

/**
 * GET - 获取班级详情
 */
export const GET = withRoute(
  async (req, ctx) => {
    const { id } = ctx.params;
    if (!id) throw ApiError.BadRequest('缺少班级ID');

    const result = await classService.getClass(id as string);

    if (!result.success || !result.data) {
      throw ApiError.NotFound('班级');
    }

    return result.data;
  },
  { requireAuth: true }
);

/**
 * PUT - 更新班级信息
 */
export const PUT = withRoute(
  async (req, ctx) => {
    const { id } = ctx.params;
    if (!id) throw ApiError.BadRequest('缺少班级ID');

    const body = await req.json();
    const result = await classService.updateClass(id as string, body);

    if (!result.success) {
      if (result.code === 'NOT_FOUND') throw ApiError.NotFound('班级');
      throw ApiError.Internal(result.error || '更新失败');
    }

    return result.data;
  },
  { requireAuth: true }
);

/**
 * DELETE - 删除班级
 */
export const DELETE = withRoute(
  async (req, ctx) => {
    const { id } = ctx.params;
    if (!id) throw ApiError.BadRequest('缺少班级ID');

    const result = await classService.deleteClass(id as string);

    if (!result.success) {
      if (result.code === 'NOT_FOUND') throw ApiError.NotFound('班级');
      if (result.code === 'HAS_STUDENTS') throw ApiError.BadRequest('班级内还有学生，无法删除');
      throw ApiError.Internal(result.error || '删除失败');
    }

    return { message: '删除成功' };
  },
  { requireAuth: true }
);
