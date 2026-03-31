/**
 * 批量删除学生 API
 * 
 * POST /api/students/batch-delete
 * 
 * 安全措施：
 * - 速率限制：每分钟最多10次
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest } from 'next/server';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { withAuth } from '@/lib/auth/middleware';
import { ok, fail, serverError } from '@/lib/api';
import type { StudentService } from '@/services/student.service';

/**
 * POST - 批量删除学生
 */
export const POST = withAuth(async (request: NextRequest) => {
  const studentService = getService<StudentService>(SERVICE_IDENTIFIERS.StudentService);
  const body = await request.json();
  const { ids } = body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return fail('请选择要删除的数据');
  }

  // 限制单次删除数量
  if (ids.length > 100) {
    return fail('单次最多删除100条数据');
  }

  // 调用 Service 层批量删除
  const result = await studentService.batchDelete(ids);

  if (!result.success) {
    return serverError(result.error || '批量删除失败');
  }

  return ok({
    count: result.data?.success || 0,
    message: `成功删除 ${result.data?.success || 0} 条数据`,
  });
});
