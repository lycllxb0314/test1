/**
 * 请假审批 API
 * 
 * 审批人对请假申请进行审批/驳回
 * 审批通过后会自动：
 * 1. 更新请假状态
 * 2. 如果需要调课，创建调课任务并通知年段长
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

/**
 * POST - 审批请假申请
 */
export const POST = protectedRoute(async (
  request: NextRequest, 
  context: ExtendedRouteContext
) => {
  try {
    const client = getSupabaseClient();
    const params = await context.params;
    if (!params?.id) {
      return NextResponse.json(error('缺少请假申请ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    const leaveRequestId = params.id;
    const { user } = context;
    const body = await request.json();
    const { action, rejectReason } = body;

    // 验证操作类型
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(error('无效的操作类型', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }

    // 获取请假申请
    const { data: leaveRequest, error: fetchError } = await client
      .from('leave_requests')
      .select('*')
      .eq('id', leaveRequestId)
      .single();

    if (fetchError || !leaveRequest) {
      return NextResponse.json(error('请假申请不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }

    // 检查状态
    if (leaveRequest.status !== 'pending') {
      return NextResponse.json(error('该请假申请已处理', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }

    // 检查当前用户是否为审批人
    const approverSelection = leaveRequest.approver_selection || [];
    const isApprover = approverSelection.some((a: any) => a.employeeId === user.employeeId);
    
    if (!isApprover) {
      return NextResponse.json(error('您不是该请假申请的审批人', ErrorCode.FORBIDDEN), { status: 403 });
    }

    const now = new Date().toISOString();

    if (action === 'reject') {
      // 驳回
      const { error: updateError } = await client
        .from('leave_requests')
        .update({
          status: 'rejected',
          reject_reason: rejectReason || '审批驳回',
          approved_by: user.employeeId,
          approved_at: now,
          updated_at: now,
        })
        .eq('id', leaveRequestId);

      if (updateError) {
        console.error('驳回失败:', updateError);
        return NextResponse.json(error('驳回失败', ErrorCode.DATABASE_ERROR), { status: 500 });
      }

      // 通知申请人
      await client.from('messages').insert({
        title: `【已驳回】请假申请`,
        content: `您的${leaveRequest.type}申请已被${user.name}驳回。${rejectReason ? `原因：${rejectReason}` : ''}`,
        event: 'leave_approval',
        priority: 'high',
        sender_id: user.employeeId,
        sender_name: user.name,
        sender_role: user.role,
        recipient_id: leaveRequest.applicant_id,
        metadata: { leaveRequestId, action: 'rejected' },
      });

      return NextResponse.json(success({ status: 'rejected' }, 'database'));
    }

    // 审批通过
    // 检查签批方式
    const signType = approverSelection[0]?.signType || 'countersign';
    const allApprovers = approverSelection.map((a: any) => a.employeeId);
    
    // 获取已审批记录
    let approvedByList = leaveRequest.approved_by_list || [];
    if (!Array.isArray(approvedByList)) {
      approvedByList = [];
    }

    // 添加当前审批记录
    approvedByList.push({
      employeeId: user.employeeId,
      userName: user.name,
      action: 'approved',
      time: now,
    });

    // 判断是否所有审批人都已同意（会签）或任一审批人同意（或签）
    const approvedEmployeeIds = approvedByList.map((a: any) => a.employeeId);
    let isFullyApproved = false;

    if (signType === 'parallel') {
      // 或签：任一审批人同意即可
      isFullyApproved = true;
    } else {
      // 会签：所有审批人都需同意
      isFullyApproved = allApprovers.every((id: string) => approvedEmployeeIds.includes(id));
    }

    if (!isFullyApproved) {
      // 还需要其他审批人审批，只记录当前审批
      const { error: updateError } = await client
        .from('leave_requests')
        .update({
          approved_by_list: approvedByList,
          updated_at: now,
        })
        .eq('id', leaveRequestId);

      if (updateError) {
        console.error('更新审批记录失败:', updateError);
        return NextResponse.json(error('更新审批记录失败', ErrorCode.DATABASE_ERROR), { status: 500 });
      }

      // 通知申请人当前进度
      await client.from('messages').insert({
        title: `【审批中】请假申请进度更新`,
        content: `${user.name}已同意您的${leaveRequest.type}申请，等待其他审批人审批。`,
        event: 'leave_approval',
        priority: 'normal',
        sender_id: user.employeeId,
        sender_name: user.name,
        sender_role: user.role,
        recipient_id: leaveRequest.applicant_id,
        metadata: { leaveRequestId, action: 'approving' },
      });

      return NextResponse.json(success({ 
        status: 'pending', 
        approvedBy: approvedByList,
        message: '审批已记录，等待其他审批人审批' 
      }, 'database'));
    }

    // 所有审批人都已同意，更新状态为已批准
    const { error: updateError } = await client
      .from('leave_requests')
      .update({
        status: 'approved',
        approved_by: user.employeeId,
        approved_at: now,
        approved_by_list: approvedByList,
        current_step: 2, // 进入调课阶段
        updated_at: now,
      })
      .eq('id', leaveRequestId);

    if (updateError) {
      console.error('审批失败:', updateError);
      return NextResponse.json(error('审批失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }

    // === 审批通过后，触发后续流程 ===
    
    // 1. 通知申请人审批通过
    await client.from('messages').insert({
      title: `【已通过】请假申请`,
      content: `您的${leaveRequest.type}申请（${leaveRequest.start_date}至${leaveRequest.end_date}）已审批通过。`,
      event: 'leave_approval',
      priority: 'high',
      sender_id: user.employeeId,
      sender_name: user.name,
      sender_role: user.role,
      recipient_id: leaveRequest.applicant_id,
      metadata: { leaveRequestId, action: 'approved' },
    });

    // 2. 如果需要调课，创建调课任务并通知年段长
    if (leaveRequest.need_adjustment && leaveRequest.affected_slots?.length > 0) {
      const affectedSlots = leaveRequest.affected_slots;
      
      // 获取申请人年级
      const applicantGrade = leaveRequest.applicant_grade;
      
      // 查找对应年级的年段长（兼任角色）
      let gradeLeaderId = null;
      let gradeLeaderName = null;
      
      if (applicantGrade) {
        // 从 users 表查找 additional_roles 包含 grade_leader 且管理该年级的用户
        const { data: gradeLeaders } = await client
          .from('users')
          .select('employee_id, name, additional_roles')
          .contains('additional_roles', [{ role: 'grade_leader', grades: [applicantGrade] }]);
        
        if (gradeLeaders && gradeLeaders.length > 0) {
          gradeLeaderId = gradeLeaders[0].employee_id;
          gradeLeaderName = gradeLeaders[0].name;
        }
      }

      // 如果没找到年级对应的年段长，查找所有年段长
      if (!gradeLeaderId) {
        const { data: allGradeLeaders } = await client
          .from('users')
          .select('employee_id, name, additional_roles')
          .contains('additional_roles', [{ role: 'grade_leader' }]);
        
        if (allGradeLeaders && allGradeLeaders.length > 0) {
          gradeLeaderId = allGradeLeaders[0].employee_id;
          gradeLeaderName = allGradeLeaders[0].name;
        }
      }

      // 如果还是没有年段长，通知教务处
      if (!gradeLeaderId) {
        const { data: academicStaff } = await client
          .from('users')
          .select('employee_id, name')
          .eq('role', 'academic_vice_principal')
          .limit(1);
        
        if (academicStaff && academicStaff.length > 0) {
          gradeLeaderId = academicStaff[0].employee_id;
          gradeLeaderName = academicStaff[0].name;
        }
      }

      // 创建调课记录
      const adjustmentRecords = affectedSlots.map((slot: any) => ({
        leave_request_id: leaveRequestId,
        applicant_id: leaveRequest.applicant_id,
        applicant_name: leaveRequest.applicant_name,
        adjust_type: 'substitute',
        status: 'pending',
        effective_week: slot.weekStartDate || getWeekMonday(new Date(leaveRequest.start_date)),
        class_id: slot.classId,
        class_name: slot.className,
        grade: slot.grade,
        week_day: slot.weekDay,
        period_index: slot.periodIndex,
        subject: slot.subject,
        original_slot: {
          teacherId: slot.teacherId,
          teacherName: slot.teacherName,
          employeeId: slot.employeeId,
        },
        reason: leaveRequest.reason,
        reason_type: leaveRequest.type,
      }));

      const { data: insertedAdjustments, error: adjustError } = await client
        .from('course_adjustments')
        .insert(adjustmentRecords)
        .select();

      if (adjustError) {
        console.error('创建调课记录失败:', adjustError);
      } else if (gradeLeaderId) {
        // 更新请假申请的调课状态
        await client
          .from('leave_requests')
          .update({
            adjustment_status: 'pending',
            updated_at: now,
          })
          .eq('id', leaveRequestId);

        // 发送消息通知年段长
        await client.from('messages').insert({
          title: `【调课任务】${leaveRequest.applicant_name}请假调课`,
          content: `${leaveRequest.applicant_name}的${leaveRequest.type}申请已审批通过，需安排${affectedSlots.length}节课的代课教师。请及时处理。`,
          event: 'course_adjustment',
          priority: 'high',
          sender_id: 'system',
          sender_name: '系统通知',
          sender_role: 'system',
          recipient_id: gradeLeaderId,
          metadata: {
            leaveRequestId,
            adjustmentIds: insertedAdjustments?.map((a: any) => a.id),
            affectedSlotsCount: affectedSlots.length,
          },
        });
      }
    }

    return NextResponse.json(success({ 
      status: 'approved',
      message: '审批通过' 
    }, 'database'));

  } catch (err) {
    console.error('审批失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * 辅助函数：获取周一日期
 */
function getWeekMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}
