/**
 * 课程表 API
 *
 * GET  - 获取课程表
 * POST - 创建课程
 */

import { withRoute } from '@/lib/api';
import { scheduleService } from '@/services/academic.service';
import { ApiError } from '@/lib/api-error';

/**
 * GET - 获取课程表
 */
export const GET = withRoute(
  async (req) => {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const teacherId = searchParams.get('teacherId');
    const semester = searchParams.get('semester');

    const result = await scheduleService.getOfficialSchedule({
      classId: classId || undefined,
      teacherId: teacherId || undefined,
    });

    if (!result.success) {
      throw ApiError.Internal(result.error || '获取课程表失败');
    }

    const formattedData = (result.data || []).map(s => ({
      id: s.id,
      classId: s.class_id,
      className: s.class_name,
      teacherId: s.teacher_id,
      teacherName: s.teacher_name,
      subject: s.subject,
      dayOfWeek: s.week_day,
      period: s.period_index,
      semester: semester,
      classroom: undefined,
    }));

    return formattedData;
  },
  { requireAuth: true }
);

/**
 * POST - 创建课程
 */
export const POST = withRoute(
  async (req) => {
    const body = await req.json();

    if (!body.classId || !body.subject || !body.teacherId) {
      throw ApiError.BadRequest('缺少必要参数');
    }

    const result = await scheduleService.saveSlot({
      classId: body.classId,
      className: body.className || '',
      grade: body.grade || 1,
      weekDay: body.dayOfWeek,
      periodIndex: body.period,
      subject: body.subject,
      teacherId: body.teacherId,
      teacherName: body.teacherName,
    });

    if (!result.success) {
      throw ApiError.BadRequest(result.error || '创建课程失败');
    }

    return {
      id: `sch-${Date.now()}`,
      classId: body.classId,
      subject: body.subject,
      teacherId: body.teacherId,
    };
  },
  { requireAuth: true }
);
