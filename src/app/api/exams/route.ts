/**
 * 考试管理 API
 * 
 * GET: 获取考试列表
 * POST: 创建新考试
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用统一认证中间件
 */

import { NextRequest } from 'next/server';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { withAuth } from '@/lib/auth/middleware';
import { ok, fail, serverError, paginated } from '@/lib/api';
import type { ExamService } from '@/services/exam.service';

/**
 * GET: 获取考试列表
 */
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const examService = getService<ExamService>(SERVICE_IDENTIFIERS.ExamService);
    const { searchParams } = new URL(request.url);
    
    // 分页参数
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    
    // 筛选参数
    const status = searchParams.get('status') || undefined;
    const semester = searchParams.get('semester') || undefined;
    const keyword = searchParams.get('keyword') || undefined;
    
    // 调用 Service 层
    const result = await examService.getPaginated({
      filters: {
        status,
        semester,
        keyword,
      },
    });
    
    if (!result.success) {
      return fail(result.error || '获取考试列表失败');
    }
    
    return paginated(result.data || [], result.data?.length || 0, page, pageSize);
  } catch (err) {
    console.error('获取考试列表失败:', err);
    return serverError('服务器错误');
  }
});

/**
 * POST: 创建考试
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const examService = getService<ExamService>(SERVICE_IDENTIFIERS.ExamService);
    const body = await request.json();
    
    // 验证必填字段
    if (!body.name || !body.startDate) {
      return fail('缺少必填字段');
    }
    
    // 调用 Service 层
    const result = await examService.create({
      name: body.name,
      type: body.type || 'midterm',
      semester: body.semester || getCurrentSemester(),
      description: body.description,
      grade: body.grades?.[0],
      startTime: body.startDate,
      endTime: body.endDate || body.startDate,
      status: body.status || 'draft',
    });
    
    if (!result.success) {
      return fail(result.error || '创建考试失败');
    }
    
    return ok(result.data);
  } catch (err) {
    console.error('创建考试失败:', err);
    return serverError('服务器错误');
  }
});

// ==================== 辅助函数 ====================

function getCurrentSemester(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  // 简单判断：2-8月为第二学期，9-1月为第一学期
  if (month >= 2 && month <= 8) {
    return `${year - 1}-${year}-2`;
  } else {
    if (month === 1) {
      return `${year - 1}-${year}-1`;
    }
    return `${year}-${year + 1}-1`;
  }
}
