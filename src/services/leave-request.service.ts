/**
 * 请假服务层
 * 
 * 架构：API Route → Service → Repository
 * 处理请假审批相关的业务逻辑（v2 版本）
 */

import { BaseService, ServiceResult } from './base.service';
import {
  leaveRepository,
  LeaveRequestRow,
  ApproverSelection,
  ApprovalRecord,
  AffectedSlot,
  CourseAdjustmentRow,
} from '@/repositories/leave.repository';
import { messageRepository } from '@/repositories/message.repository';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 提交请假申请参数
 */
export interface SubmitLeaveParams {
  applicantId: string;
  applicantName: string;
  type: string;
  startDate: string;
  endDate: string;
  duration: number;
  reason: string;
  attachments?: Array<{ name: string; url: string }>;
  needAdjustment?: boolean;
  affectedSlots?: AffectedSlot[];
  approverSelection: ApproverSelection[];
}

/**
 * 审批操作参数
 */
export interface ApproveParams {
  leaveRequestId: string;
  action: 'approve' | 'reject';
  rejectReason?: string;
  user: {
    id: string;
    employeeId: string;
    name: string;
    role: string;
  };
}

/**
 * 撤销操作参数
 */
export interface CancelParams {
  leaveRequestId: string;
  user: {
    id: string;
    employeeId: string;
    name: string;
    role: string;
  };
}

/**
 * 待审批查询参数
 */
export interface PendingQueryParams {
  employeeId: string;
  status: 'pending' | 'approved' | 'my';
}

/**
 * 审批结果
 */
export interface ApproveResult {
  status: string;
  message?: string;
  approvedBy?: ApprovalRecord[];
}

/**
 * 请假服务
 */
export class LeaveRequestService extends BaseService {
  /**
   * 提交请假申请
   */
  async submitLeaveRequest(params: SubmitLeaveParams): Promise<ServiceResult<{ id: string; status: string; message: string }>> {
    const {
      applicantId,
      applicantName,
      type,
      startDate,
      endDate,
      duration,
      reason,
      attachments = [],
      needAdjustment = false,
      affectedSlots = [],
      approverSelection,
    } = params;

    try {
      // 验证审批人选择
      if (!approverSelection || approverSelection.length === 0) {
        return { success: false, error: '请选择审批人', code: 'VALIDATION_ERROR' };
      }

      const client = getSupabaseClient();

      // 插入请假申请
      const { data, error: dbError } = await client
        .from('leave_requests')
        .insert({
          applicant_id: applicantId,
          applicant_name: applicantName,
          type,
          start_date: startDate,
          end_date: endDate,
          duration,
          reason,
          attachments,
          need_adjustment: needAdjustment,
          affected_slots: affectedSlots,
          approver_selection: approverSelection,
          status: 'pending',
        })
        .select()
        .single();

      if (dbError || !data) {
        console.error('[LeaveRequestService] submitLeaveRequest insert error:', dbError);
        return { success: false, error: `提交请假申请失败: ${dbError?.message || '未知错误'}` };
      }

      // 发送消息通知审批人
      await this.notifyApprovers(data.id, {
        applicantName,
        type,
        startDate,
        endDate,
        reason,
        approverSelection,
      });

      return {
        success: true,
        data: {
          id: data.id,
          status: data.status,
          message: '请假申请提交成功',
        },
      };
    } catch (err) {
      console.error('[LeaveRequestService] submitLeaveRequest error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 通知审批人
   */
  private async notifyApprovers(
    leaveRequestId: string,
    params: {
      applicantName: string;
      type: string;
      startDate: string;
      endDate: string;
      reason: string;
      approverSelection: ApproverSelection[];
    }
  ): Promise<void> {
    const { applicantName, type, startDate, endDate, reason, approverSelection } = params;

    for (const approver of approverSelection) {
      try {
        // 根据 employeeId 查找用户的 UUID
        const approverUser = await leaveRepository.getUserUUIDByEmployeeId(approver.employeeId);
        
        if (!approverUser) {
          console.warn(`[LeaveRequestService] 未找到审批人: ${approver.employeeId}`);
          continue;
        }

        await messageRepository.create({
          title: `【待审批】${applicantName}的${type}申请`,
          content: `${applicantName}提交了${type}申请（${startDate}至${endDate}），请及时审批。原因：${reason}`,
          type: 'leave_approval',
          priority: 'high',
          sender_name: applicantName,
          recipient_id: approverUser.id,
          recipient_type: 'individual',
          related_id: leaveRequestId,
          related_type: 'leave_request',
          action_url: `/teacher/leave`,
          action_label: '去审批',
          metadata: {
            leaveRequestId,
            approverEmployeeId: approver.employeeId,
            signType: approver.signType,
          },
          created_at: new Date().toISOString(),
        } as unknown as Parameters<typeof messageRepository.create>[0]);

        console.log(`[LeaveRequestService] 已发送通知给审批人: ${approver.name} (${approver.employeeId})`);
      } catch (err) {
        console.error(`[LeaveRequestService] 发送通知给 ${approver.employeeId} 失败:`, err);
      }
    }
  }

  /**
   * 审批请假申请
   */
  async approve(params: ApproveParams): Promise<ServiceResult<ApproveResult>> {
    const { leaveRequestId, action, rejectReason, user } = params;

    try {
      // 验证操作类型
      if (!['approve', 'reject'].includes(action)) {
        return { success: false, error: '无效的操作类型', code: 'VALIDATION_ERROR' };
      }

      // 获取请假申请
      const leaveRequest = await leaveRepository.findByIdV2(leaveRequestId);
      
      if (!leaveRequest) {
        return { success: false, error: '请假申请不存在', code: 'NOT_FOUND' };
      }

      // 检查状态
      if (leaveRequest.status !== 'pending') {
        return { success: false, error: '该请假申请已处理', code: 'VALIDATION_ERROR' };
      }

      // 检查当前用户是否为审批人
      const approverSelection = leaveRequest.approver_selection || [];
      const isApprover = approverSelection.some(a => a.employeeId === user.employeeId);
      
      if (!isApprover) {
        return { success: false, error: '您不是该请假申请的审批人', code: 'FORBIDDEN' };
      }

      const now = new Date().toISOString();

      // 获取申请人UUID
      const applicantUser = await leaveRepository.getUserUUIDByEmployeeId(leaveRequest.applicant_id);

      // 驳回逻辑
      if (action === 'reject') {
        const updated = await leaveRepository.updateStatus(leaveRequestId, {
          status: 'rejected',
          reject_reason: rejectReason || '审批驳回',
          approved_by: user.employeeId,
          approved_at: now,
        });

        if (!updated) {
          return { success: false, error: '驳回失败', code: 'DATABASE_ERROR' };
        }

        // 发送消息通知申请人
        if (applicantUser) {
          await this.sendMessage({
            title: `【已驳回】请假申请`,
            content: `您的${leaveRequest.type}申请已被${user.name}驳回。${rejectReason ? `原因：${rejectReason}` : ''}`,
            type: 'leave_rejected',
            priority: 'high',
            senderId: user.id,
            senderName: user.name,
            recipientId: applicantUser.id,
            metadata: { leaveRequestId, action: 'rejected' },
          });
        }

        return { success: true, data: { status: 'rejected' } };
      }

      // 审批通过逻辑
      const signType = approverSelection[0]?.signType || 'countersign';
      const allApprovers = approverSelection.map(a => a.employeeId);

      // 获取已审批记录
      let approvedByList: ApprovalRecord[] = leaveRequest.approved_by_list || [];
      if (!Array.isArray(approvedByList)) {
        approvedByList = [];
      }

      // 添加当前审批记录
      approvedByList.push({
        employeeId: user.employeeId || '',
        userName: user.name,
        action: 'approved',
        time: now,
      });

      // 判断是否所有审批人都已同意
      const approvedEmployeeIds = approvedByList.map(a => a.employeeId);
      let isFullyApproved = false;

      if (signType === 'parallel') {
        // 或签：任一审批人同意即可
        isFullyApproved = true;
      } else {
        // 会签：所有审批人都需同意
        isFullyApproved = allApprovers.every(id => approvedEmployeeIds.includes(id));
      }

      // 还需要其他审批人审批
      if (!isFullyApproved) {
        const updated = await leaveRepository.updateStatus(leaveRequestId, {
          approved_by_list: approvedByList,
        });

        if (!updated) {
          return { success: false, error: '更新审批记录失败', code: 'DATABASE_ERROR' };
        }

        // 通知申请人当前进度
        if (applicantUser) {
          await this.sendMessage({
            title: `【审批中】请假申请进度更新`,
            content: `${user.name}已同意您的${leaveRequest.type}申请，等待其他审批人审批。`,
            type: 'leave_approval',
            priority: 'normal',
            senderId: user.id,
            senderName: user.name,
            recipientId: applicantUser.id,
            metadata: { leaveRequestId, action: 'approving' },
          });
        }

        return {
          success: true,
          data: {
            status: 'pending',
            approvedBy: approvedByList,
            message: '审批已记录，等待其他审批人审批',
          },
        };
      }

      // 所有审批人都已同意，更新状态为已批准
      const updated = await leaveRepository.updateStatus(leaveRequestId, {
        status: 'approved',
        approved_by: user.employeeId,
        approved_at: now,
        approved_by_list: approvedByList,
        current_step: 2, // 进入调课阶段
      });

      if (!updated) {
        return { success: false, error: '审批失败', code: 'DATABASE_ERROR' };
      }

      // 通知申请人审批通过
      if (applicantUser) {
        await this.sendMessage({
          title: `【已通过】请假申请`,
          content: `您的${leaveRequest.type}申请（${leaveRequest.start_date}至${leaveRequest.end_date}）已审批通过。`,
          type: 'leave_approved',
          priority: 'high',
          senderId: user.id,
          senderName: user.name,
          recipientId: applicantUser.id,
          metadata: { leaveRequestId, action: 'approved' },
        });
      }

      // 如果需要调课，创建调课任务
      if (leaveRequest.need_adjustment && leaveRequest.affected_slots?.length > 0) {
        await this.handleCourseAdjustment(leaveRequest, leaveRequestId, now);
      }

      return { success: true, data: { status: 'approved', message: '审批通过' } };
    } catch (err) {
      console.error('[LeaveRequestService] approve error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 撤销请假申请
   */
  async cancel(params: CancelParams): Promise<ServiceResult<{ status: string }>> {
    const { leaveRequestId, user } = params;

    try {
      // 获取请假申请
      const leaveRequest = await leaveRepository.findByIdV2(leaveRequestId);
      
      if (!leaveRequest) {
        return { success: false, error: '请假申请不存在', code: 'NOT_FOUND' };
      }

      // 检查是否为申请人
      if (leaveRequest.applicant_id !== user.employeeId) {
        return { success: false, error: '只能撤销自己的请假申请', code: 'FORBIDDEN' };
      }

      // 检查状态
      if (leaveRequest.status !== 'pending') {
        return { success: false, error: '该请假申请已处理，无法撤销', code: 'VALIDATION_ERROR' };
      }

      // 更新状态为已撤销
      const updated = await leaveRepository.updateStatus(leaveRequestId, {
        status: 'cancelled',
      });

      if (!updated) {
        return { success: false, error: '撤销失败', code: 'DATABASE_ERROR' };
      }

      // 删除相关的调课记录
      await leaveRepository.deleteCourseAdjustmentsByLeaveId(leaveRequestId);

      // 通知已选的审批人
      const approverSelection = leaveRequest.approver_selection || [];
      if (approverSelection.length > 0) {
        for (const approver of approverSelection) {
          const approverUser = await leaveRepository.getUserUUIDByEmployeeId(approver.employeeId);
          if (approverUser) {
            await this.sendMessage({
              title: `【已撤销】请假申请`,
              content: `${leaveRequest.applicant_name}已撤销${leaveRequest.type}申请（${leaveRequest.start_date}至${leaveRequest.end_date}）。`,
              type: 'leave_cancelled',
              priority: 'normal',
              senderId: user.id,
              senderName: user.name,
              recipientId: approverUser.id,
              metadata: { leaveRequestId, action: 'cancelled' },
            });
          }
        }
      }

      return { success: true, data: { status: 'cancelled' } };
    } catch (err) {
      console.error('[LeaveRequestService] cancel error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 获取待审批列表
   */
  async getPendingList(params: PendingQueryParams): Promise<ServiceResult<LeaveRequestRow[]>> {
    const { employeeId, status } = params;

    try {
      const data = await leaveRepository.findPendingForApprover(employeeId, status);
      
      return { success: true, data };
    } catch (err) {
      console.error('[LeaveRequestService] getPendingList error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 处理调课任务
   */
  private async handleCourseAdjustment(
    leaveRequest: LeaveRequestRow,
    leaveRequestId: string,
    now: string
  ): Promise<void> {
    const affectedSlots = leaveRequest.affected_slots;
    const applicantGrade = leaveRequest.applicant_grade;

    // 查找年段长
    let gradeLeaderUUID: string | null = null;
    let gradeLeaderName: string | null = null;

    if (applicantGrade) {
      const gradeLeaders = await leaveRepository.findUsersByConditions({
        additional_roles: ['grade_leader'],
        managed_grades: [applicantGrade],
      });

      if (gradeLeaders.length > 0) {
        gradeLeaderUUID = gradeLeaders[0].id;
        gradeLeaderName = gradeLeaders[0].name;
      }
    }

    // 如果没找到对应年级的年段长，查找所有年段长
    if (!gradeLeaderUUID) {
      const allGradeLeaders = await leaveRepository.findUsersByConditions({
        additional_roles: ['grade_leader'],
      });

      if (allGradeLeaders.length > 0) {
        gradeLeaderUUID = allGradeLeaders[0].id;
        gradeLeaderName = allGradeLeaders[0].name;
      }
    }

    // 如果还是没有年段长，通知教务处
    if (!gradeLeaderUUID) {
      const academicStaff = await leaveRepository.findUsersByConditions({
        role: 'academic_vice_principal',
      });

      if (academicStaff.length > 0) {
        gradeLeaderUUID = academicStaff[0].id;
        gradeLeaderName = academicStaff[0].name;
      }
    }

    // 创建调课记录
    const adjustmentRecords: Partial<CourseAdjustmentRow>[] = affectedSlots.map(slot => ({
      leave_request_id: leaveRequestId,
      applicant_id: leaveRequest.applicant_id,
      applicant_name: leaveRequest.applicant_name,
      adjust_type: 'substitute',
      status: 'pending',
      effective_week: slot.weekStartDate || this.getWeekMonday(new Date(leaveRequest.start_date)),
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
      reason_type: this.mapLeaveTypeToReasonType(leaveRequest.type),
    }));

    const insertedAdjustments = await leaveRepository.createCourseAdjustments(adjustmentRecords);

    if (insertedAdjustments.length > 0 && gradeLeaderUUID) {
      // 更新请假申请的调课状态
      await leaveRepository.updateAdjustmentStatus(leaveRequestId, 'pending');

      // 发送消息通知年段长
      await this.sendMessage({
        title: `【调课任务】${leaveRequest.applicant_name}请假调课`,
        content: `${leaveRequest.applicant_name}的${leaveRequest.type}申请已审批通过，需安排${affectedSlots.length}节课的代课教师。请及时处理。`,
        type: 'course_adjustment',
        priority: 'high',
        senderId: null,
        senderName: '系统通知',
        recipientId: gradeLeaderUUID,
        metadata: {
          leaveRequestId,
          adjustmentIds: insertedAdjustments.map(a => a.id),
          affectedSlotsCount: affectedSlots.length,
        },
      });
    }
  }

  /**
   * 发送消息
   */
  private async sendMessage(params: {
    title: string;
    content: string;
    type: string;
    priority: string;
    senderId: string | null;
    senderName: string;
    recipientId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await messageRepository.create({
        title: params.title,
        content: params.content,
        type: params.type,
        priority: params.priority,
        sender_id: params.senderId,
        sender_name: params.senderName,
        recipient_id: params.recipientId,
        recipient_type: 'individual',
        metadata: params.metadata,
        created_at: new Date().toISOString(),
      } as unknown as Parameters<typeof messageRepository.create>[0]);
    } catch (err) {
      console.error('[LeaveRequestService] sendMessage error:', err);
    }
  }

  /**
   * 将中文请假类型映射为数据库约束允许的英文值
   */
  private mapLeaveTypeToReasonType(leaveType: string): string {
    const typeMap: Record<string, string> = {
      '病假': 'leave',
      '事假': 'personal',
      '公假': 'training',
      '婚假': 'personal',
      '产假': 'leave',
      '丧假': 'personal',
    };
    return typeMap[leaveType] || 'other';
  }

  /**
   * 获取周一日期
   */
  private getWeekMonday(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  }
}

// 导出单例
export const leaveRequestService = new LeaveRequestService();
