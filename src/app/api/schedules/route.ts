/**
 * 课程表 API
 * 
 * GET: 获取课程表
 * POST: 创建课程
 * 
 * ⚠️ 架构原则：
 * - 使用统一认证中间件
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { ok, fail, serverError } from '@/lib/api';
import { scheduleService } from '@/services/academic.service';

/**
 * GET: 获取课程表
 */
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');
  const teacherId = searchParams.get('teacherId');
  const semester = searchParams.get('semester');

  try {
    const result = await scheduleService.getOfficialSchedule({
      classId: classId || undefined,
      teacherId: teacherId || undefined,
    });

    if (!result.success) {
      return fail(result.error || '获取课程表失败');
    }

    // 格式化数据
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

    return ok(formattedData);
  } catch (error) {
    console.error('获取课程表失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * POST: 创建课程
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    
    if (!body.classId || !body.subject || !body.teacherId) {
      return fail('缺少必要参数');
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
      return fail(result.error || '创建课程失败');
    }

    return ok({
      id: `sch-${Date.now()}`,
      classId: body.classId,
      subject: body.subject,
      teacherId: body.teacherId,
    });
  } catch (error) {
    console.error('创建课程失败:', error);
    return serverError('服务器错误');
  }
});
