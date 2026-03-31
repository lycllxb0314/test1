/**
 * 调课申请 API
 * 
 * GET: 获取调课列表
 * POST: 创建调课申请
 * 
 * ⚠️ 架构原则：
 * - 使用统一认证中间件
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { ok, fail, serverError } from '@/lib/api';
import { scheduleChangeService } from '@/services/schedule-change.service';

/**
 * GET: 获取调课列表
 */
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const applicantId = searchParams.get('applicantId');

  try {
    const result = await scheduleChangeService.getList({
      status: status || undefined,
      applicantId: applicantId || undefined,
    });

    if (!result.success) {
      return fail(result.error || '获取调课列表失败');
    }

    // 格式化数据
    const formattedData = (result.data || []).map(c => ({
      id: c.id,
      applicantId: c.applicant_id,
      applicantName: c.applicant_name,
      originalScheduleId: c.original_schedule_id,
      newScheduleId: c.new_schedule_id,
      changeType: c.change_type,
      reason: c.reason,
      status: c.status,
      approverId: c.approver_id,
      approverName: c.approver_name,
      approvedAt: c.approved_at,
      createdAt: c.created_at,
    }));

    return ok(formattedData);
  } catch (error) {
    console.error('获取调课列表失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * POST: 创建调课申请
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    
    if (!body.applicantId || !body.changeType) {
      return fail('缺少必要参数');
    }

    const result = await scheduleChangeService.create({
      applicant_id: body.applicantId,
      applicant_name: body.applicantName,
      original_schedule_id: body.originalScheduleId,
      new_schedule_id: body.newScheduleId,
      change_type: body.changeType,
      reason: body.reason,
      // 原始课表信息
      original_class_id: body.originalClassId,
      original_class_name: body.originalClassName,
      original_subject: body.originalSubject,
      original_teacher_id: body.originalTeacherId,
      original_teacher_name: body.originalTeacherName,
      original_day_of_week: body.originalDayOfWeek,
      original_period: body.originalPeriod,
      // 新课表信息
      new_class_id: body.newClassId,
      new_class_name: body.newClassName,
      new_subject: body.newSubject,
      new_teacher_id: body.newTeacherId,
      new_teacher_name: body.newTeacherName,
      new_day_of_week: body.newDayOfWeek,
      new_period: body.newPeriod,
    });

    if (!result.success) {
      return fail(result.error || '创建调课申请失败');
    }

    return ok({
      id: result.data!.id,
      applicantId: result.data!.applicant_id,
      status: result.data!.status,
    });
  } catch (error) {
    console.error('创建调课申请失败:', error);
    return serverError('服务器错误');
  }
});
