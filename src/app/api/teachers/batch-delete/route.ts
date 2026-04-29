/**
 * 批量删除教师 API
 * 
 * POST: 批量删除教师
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用统一认证中间件
 */

import { NextRequest } from 'next/server';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { withAuth } from '@/lib/auth/middleware';
import { ok, fail, serverError } from '@/lib/api';
import type { TeacherService } from '@/services/teacher.service';

/**
 * POST: 批量删除教师
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const teacherService = getService<TeacherService>(SERVICE_IDENTIFIERS.TeacherService);
    const body = await request.json();
    
    const { ids } = body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return fail('请选择要删除的数据');
    }
    
    const result = await teacherService.batchDelete(ids);
    
    if (!result.success) {
      return fail(result.error || '批量删除失败');
    }
    
    return ok(result.data);
  } catch (error) {
    console.error('批量删除教师失败:', error);
    return serverError('服务器错误');
  }
});
