/**
 * 批量更新教师 API
 * 
 * POST: 批量更新教师信息
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
 * POST: 批量更新教师
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const teacherService = getService<TeacherService>(SERVICE_IDENTIFIERS.TeacherService);
    const body = await request.json();
    
    const { ids, updates } = body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return fail('请选择要更新的数据');
    }
    
    if (!updates || Object.keys(updates).length === 0) {
      return fail('请提供更新内容');
    }
    
    const result = await teacherService.batchUpdate({ ids, updates });
    
    if (!result.success) {
      return fail(result.error || '批量更新失败');
    }
    
    return ok(result.data);
  } catch (error) {
    console.error('批量更新教师失败:', error);
    return serverError('服务器错误');
  }
});
