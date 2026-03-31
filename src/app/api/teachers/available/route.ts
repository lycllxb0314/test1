/**
 * 可用教师查询 API
 * 
 * GET: 查询某时段无课的教师（用于代课安排）
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
 * GET: 获取某时段可用的教师
 * 
 * Query params:
 * - subject: 科目（可选，用于筛选同科目教师）
 * - weekDay: 星期几 (1-5)
 * - periodIndex: 第几节 (0-5)
 * - weekStartDate: 周一日期
 * - excludeIds: 排除的教师ID（逗号分隔）
 */
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  
  const subject = searchParams.get('subject') || undefined;
  const weekDay = searchParams.get('weekDay') ? parseInt(searchParams.get('weekDay')!) : undefined;
  const periodIndex = searchParams.get('periodIndex') ? parseInt(searchParams.get('periodIndex')!) : undefined;
  const weekStartDate = searchParams.get('weekStartDate') || undefined;
  const excludeIdsStr = searchParams.get('excludeIds') || '';
  const excludeIds = excludeIdsStr ? excludeIdsStr.split(',') : undefined;

  try {
    const teacherService = getService<TeacherService>(SERVICE_IDENTIFIERS.TeacherService);
    
    const result = await teacherService.getAvailableTeachers({
      subject,
      weekDay,
      periodIndex,
      weekStartDate,
      excludeIds,
    });
    
    if (!result.success) {
      return fail(result.error || '获取可用教师失败');
    }
    
    return ok(result.data);
  } catch (error) {
    console.error('获取可用教师失败:', error);
    return serverError('服务器错误');
  }
});
