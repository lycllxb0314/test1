/**
 * 考试管理 API
 *
 * GET  - 获取考试列表
 * POST - 创建新考试
 */

import { withRoute } from '@/lib/api';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { ApiError } from '@/lib/api-error';
import type { ExamService } from '@/services/exam.service';

function getCurrentSemester(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (month >= 2 && month <= 8) {
    return `${year - 1}-${year}-2`;
  } else {
    if (month === 1) {
      return `${year - 1}-${year}-1`;
    }
    return `${year}-${year + 1}-1`;
  }
}

/**
 * GET - 获取考试列表
 */
export const GET = withRoute(
  async (req) => {
    const examService = getService<ExamService>(SERVICE_IDENTIFIERS.ExamService);
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const status = searchParams.get('status') || undefined;
    const semester = searchParams.get('semester') || undefined;
    const keyword = searchParams.get('keyword') || undefined;

    const result = await examService.getPaginated({
      filters: { status, semester, keyword },
    });

    if (!result.success) {
      throw ApiError.Internal(result.error || '获取考试列表失败');
    }

    return {
      data: result.data || [],
      pagination: {
        page,
        pageSize,
        total: result.data?.length || 0,
        totalPages: Math.ceil((result.data?.length || 0) / pageSize),
      },
    };
  },
  { requireAuth: true }
);

/**
 * POST - 创建考试
 */
export const POST = withRoute(
  async (req) => {
    const examService = getService<ExamService>(SERVICE_IDENTIFIERS.ExamService);
    const body = await req.json();

    if (!body.name || !body.startDate) {
      throw ApiError.BadRequest('缺少必填字段');
    }

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
      throw ApiError.BadRequest(result.error || '创建考试失败');
    }

    return result.data;
  },
  { requireAuth: true }
);
