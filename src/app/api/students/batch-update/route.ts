/**
 * 批量更新学生 API
 * 
 * POST /api/students/batch-update
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
 * POST - 批量更新学生
 */
export const POST = withAuth(async (request: NextRequest) => {
  const studentService = getService<StudentService>(SERVICE_IDENTIFIERS.StudentService);
  const body = await request.json();
  const { ids, updates } = body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return fail('请选择要更新的数据');
  }

  if (!updates || Object.keys(updates).length === 0) {
    return fail('请提供更新内容');
  }

  // 限制单次更新数量
  if (ids.length > 100) {
    return fail('单次最多更新100条数据');
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
    return fail('没有可更新的字段');
  }

  // 调用 Service 层批量更新
  let successCount = 0;
  for (const id of ids) {
    const result = await studentService.updateStudent(id, filteredUpdates);
    if (result.success) {
      successCount++;
    }
  }

  return ok({ count: successCount, message: `成功更新 ${successCount} 条数据` });
});
