/**
 * 学生习惯档案 API
 *
 * GET - 获取学生习惯档案
 */

import { withRoute } from '@/lib/api';
import { studentService } from '@/services/student.service';
import { habitStatisticsService } from '@/services/habit.ext.service';
import { ApiError } from '@/lib/api-error';

export const GET = withRoute(
  async (req, ctx) => {
    const { id } = ctx.params;
    if (!id) throw ApiError.BadRequest('缺少学生ID');

    // 获取学生基本信息
    const studentResult = await studentService.getStudent(id as string);

    if (!studentResult.success) {
      if (studentResult.code === 'NOT_FOUND') throw ApiError.NotFound('学生');
      throw ApiError.Internal(studentResult.error || '获取学生信息失败');
    }

    // 获取学生习惯统计
    const habitResult = await habitStatisticsService.getStatistics({ studentId: id as string });

    return {
      student: studentResult.data,
      habitStats: habitResult.data,
    };
  },
  { requireAuth: true }
);
