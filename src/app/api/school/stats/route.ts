/**
 * 学校统计 API
 *
 * GET - 获取学校统计数据
 */

import { withRoute } from '@/lib/api';
import { schoolStatsService } from '@/services/misc.service';
import { ApiError } from '@/lib/api-error';

export const GET = withRoute(
  async (req) => {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const result = startDate && endDate
      ? await schoolStatsService.getByDateRange(startDate, endDate)
      : await schoolStatsService.getLatest();

    if (!result.success || !result.data) {
      throw ApiError.Internal(result.error || '获取学校统计失败');
    }

    return result.data;
  },
  { requireAuth: true }
);
