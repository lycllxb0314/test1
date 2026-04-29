/**
 * 批量删除学生 API
 *
 * POST - 批量删除学生
 */

import { withRoute } from '@/lib/api';
import { studentService } from '@/services/student.service';
import { ApiError } from '@/lib/api-error';

export const POST = withRoute(
  async (req) => {
    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw ApiError.BadRequest('请选择要删除的数据');
    }

    // 限制单次删除数量
    if (ids.length > 100) {
      throw ApiError.BadRequest('单次最多删除100条数据');
    }

    // 批量删除
    const result = await studentService.batchDelete(ids);

    if (!result.success) {
      throw ApiError.Internal(result.error || '删除失败');
    }

    return { ...result.data, message: `成功删除 ${result.data?.success || 0} 条数据` };
  },
  { requireAuth: true }
);
