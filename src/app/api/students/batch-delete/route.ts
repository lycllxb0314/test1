/**
 * 批量删除学生 API
 * 
 * POST /api/students/batch-delete
 * 
 * 安全措施：
 * - 速率限制：每分钟最多10次
 */

import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { ok, fail, serverError, withApi, sensitiveRateLimiter } from '@/lib/api-utils';

/**
 * POST - 批量删除学生
 */
export const POST = withApi(async (request: NextRequest) => {
  // 速率限制检查
  const rateLimitResult = await sensitiveRateLimiter(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  const client = getSupabaseClient();
  const body = await request.json();
  const { ids } = body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return fail('请选择要删除的数据');
  }

  // 限制单次删除数量
  if (ids.length > 100) {
    return fail('单次最多删除100条数据');
  }

  const { error } = await client
    .from('students')
    .delete()
    .in('id', ids);

  if (error) {
    return serverError(error.message);
  }

  return ok({ count: ids.length, message: `成功删除 ${ids.length} 条数据` });
}, { logRequests: true });
