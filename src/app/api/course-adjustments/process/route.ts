/**
 * 调课处理 API
 * 
 * 年段长使用：
 * - 获取待处理调课列表
 * - 安排代课教师
 * - 更新调课状态
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { success, error, ErrorCode } from '@/lib/api';
import { courseAdjustmentService } from '@/services/course-adjustment.service';

/**
 * GET - 获取调课列表
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const applicantId = searchParams.get('applicantId');
    const effectiveWeek = searchParams.get('effectiveWeek');

    const result = await courseAdjustmentService.getList({
      status: status || undefined,
      applicantId: applicantId || undefined,
      effectiveWeek: effectiveWeek ? parseInt(effectiveWeek) : undefined,
    });

    if (!result.success) {
      return NextResponse.json(error(result.error || '获取调课列表失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }

    // 转换字段名
    const formattedData = (result.data || []).map(item => ({
      id: item.id,
      leaveRequestId: item.leave_request_id,
      workflowInstanceId: item.workflow_instance_id,
      applicantId: item.applicant_id,
      applicantName: item.applicant_name,
      adjusterId: item.adjuster_id,
      adjusterName: item.adjuster_name,
      adjustType: item.adjust_type,
      originalSlot: item.original_slot,
      adjustResult: item.adjust_result,
      reason: item.reason,
      reasonType: item.reason_type,
      status: item.status,
      grade: item.grade,
      classId: item.class_id,
      className: item.class_name,
      subject: item.subject,
      weekDay: item.week_day,
      periodIndex: item.period_index,
      periodName: item.period_name,
      effectiveWeek: item.effective_week_number,
      effectiveWeekDate: item.effective_week,
      effectiveYear: item.effective_year,
      substituteEmployeeId: item.substitute_employee_id,
      substituteName: item.substitute_name,
      approvedBy: item.approved_by,
      approvedByName: item.approved_by_name,
      approvedAt: item.approved_at,
      syncStatus: item.sync_status,
      notifyStatus: item.notify_status,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      completedAt: item.completed_at,
    }));

    return NextResponse.json(success(formattedData, 'database'));
  } catch (err) {
    console.error('获取调课列表失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * POST - 处理调课（安排代课教师）
 */
export const POST = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    
    const { adjustmentId, action, substituteEmployeeId, substituteName, remark } = body;
    
    if (!adjustmentId) {
      return NextResponse.json(error('缺少调课记录ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }

    const result = await courseAdjustmentService.processAdjustment({
      adjustmentId,
      action,
      substituteEmployeeId,
      substituteName,
      remark,
      userId: user.id,
      userName: user.name,
      userEmployeeId: user.employeeId,
    });

    if (!result.success) {
      return NextResponse.json(error(result.error || '处理调课失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }

    return NextResponse.json(success({ adjustmentId, status: 'completed' }, 'database'));
  } catch (err) {
    console.error('处理调课失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
