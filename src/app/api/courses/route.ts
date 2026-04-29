/**
 * 课程 API
 *
 * GET  - 获取课程列表
 * POST - 创建课程
 */

import { withRoute } from '@/lib/api';
import { courseService } from '@/services/course.service';
import { ApiError } from '@/lib/api-error';
import type { CourseType } from '@/types/course';

/**
 * GET - 获取课程列表
 */
export const GET = withRoute(
  async (req) => {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') as CourseType | undefined;
    const isMain = searchParams.get('isMain') === 'true' ? true : undefined;

    const result = await courseService.getList({ type, isMain });

    if (!result.success || !result.data) {
      throw ApiError.Internal(result.error || '获取课程列表失败');
    }

    return result.data;
  },
  { requireAuth: true }
);

/**
 * POST - 创建课程
 */
export const POST = withRoute(
  async (req) => {
    const body = await req.json();

    const result = await courseService.create({
      name: body.name,
      code: body.code,
      type: body.type as CourseType,
      isMain: body.isMain,
      description: body.description,
    });

    if (!result.success) {
      throw ApiError.BadRequest(result.error || '创建课程失败');
    }

    return result.data;
  },
  { requireAuth: true }
);
