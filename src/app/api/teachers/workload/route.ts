/**
 * 教师工作量统计 API
 * 
 * GET: 获取教师工作量统计
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
 * GET: 获取教师工作量统计
 * 
 * Query params:
 * - employeeId: 教师工号
 * - semester: 学期
 * - weekStartDate: 周一日期
 */
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  
  const employeeId = searchParams.get('employeeId');
  const semester = searchParams.get('semester') || undefined;
  const weekStartDate = searchParams.get('weekStartDate') || undefined;

  if (!employeeId) {
    return fail('缺少教师工号');
  }

  try {
    const teacherService = getService<TeacherService>(SERVICE_IDENTIFIERS.TeacherService);
    
    const result = await teacherService.getDetailedWorkload(employeeId, semester, weekStartDate);
    
    if (!result.success) {
      return fail(result.error || '获取工作量统计失败');
    }
    
    return ok(result.data);
  } catch (error) {
    console.error('获取工作量统计失败:', error);
    return serverError('服务器错误');
  }
});
