/**
 * 批量更新学生 API
 * 
 * POST /api/students/batch-update
 * 
 * 安全措施：
 * - 速率限制：每分钟最多10次
 */

import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { ok, fail, serverError, withApi, sensitiveRateLimiter } from '@/lib/api';

/**
 * POST - 批量更新学生
 */
export const POST = withApi(async (request: NextRequest) => {
  // 速率限制检查
  const rateLimitResult = await sensitiveRateLimiter(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  const client = getSupabaseClient();
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
  const allowedFields = ['status', 'class_id', 'class_name'];
  const filteredUpdates: Record<string, unknown> = {};
  for (const key of Object.keys(updates)) {
    if (allowedFields.includes(key)) {
      filteredUpdates[key] = updates[key];
    }
  }

  if (Object.keys(filteredUpdates).length === 0) {
    return fail('没有可更新的字段');
  }

  const { error } = await client
    .from('students')
    .update(filteredUpdates)
    .in('id', ids);

  if (error) {
    return serverError(error.message);
  }

  return ok({ count: ids.length, message: `成功更新 ${ids.length} 条数据` });
}, { logRequests: true });
