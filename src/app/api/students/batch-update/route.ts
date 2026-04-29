/**
 * 批量更新学生 API
 *
 * POST - 批量更新学生
 */

import { withRoute } from '@/lib/api';
import { studentService } from '@/services/student.service';
import { ApiError, validateOrThrow } from '@/lib/api-error';

export const POST = withRoute(
  async (req) => {
    const body = await req.json();
    const { ids, updates } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw ApiError.BadRequest('请选择要更新的数据');
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw ApiError.BadRequest('请提供更新内容');
    }

    // 限制单次更新数量
    if (ids.length > 100) {
      throw ApiError.BadRequest('单次最多更新100条数据');
    }

    // 过滤不允许批量更新的字段
    const allowedFields = ['status', 'classId', 'className'];
    const filteredUpdates: Record<string, unknown> = {};
    for (const key of Object.keys(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      throw ApiError.BadRequest('没有可更新的字段');
    }

    // 批量更新
    let successCount = 0;
    for (const id of ids) {
      const result = await studentService.updateStudent(id, filteredUpdates);
      if (result.success) {
        successCount++;
      }
    }

    return { count: successCount, message: `成功更新 ${successCount} 条数据` };
  },
  { requireAuth: true }
);
