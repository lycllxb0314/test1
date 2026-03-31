/**
 * 请假 Repository
 */

import { BaseRepository, PaginatedResult } from './base.repository';

/**
 * 请假申请类型定义
 */
export interface LeaveRequest {
  id: string;
  type: '事假' | '病假' | '年假' | '调休' | '其他';
  applicantId: string;
  applicantName: string;
  startDate: string;
  endDate: string;
  duration: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  user_id?: string;
  approver_id?: string;
  approval_comment?: string;
  approved_at?: string;
  rejected_at?: string;
  cancelled_at?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 请假查询筛选
 */
export interface LeaveFilters {
  userId?: string;
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * v2 审批相关类型
 */
export interface ApproverSelection {
  employeeId: string;
  name: string;
  signType: string;
}

export interface ApprovalRecord {
  employeeId: string;
  userName: string;
  action: string;
  time: string;
}

export interface AffectedSlot {
  classId: string;
  className: string;
  grade: number;
  weekDay: number;
  periodIndex: number;
  subject: string;
  teacherId: string;
  teacherName: string;
  employeeId: string;
  weekStartDate?: string;
}

/**
 * v2 请假申请数据库行
 */
export interface LeaveRequestRow {
  id: string;
  applicant_id: string;
  applicant_name: string;
  applicant_type?: string;
  applicant_grade: number | null;
  type: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  duration: number;
  duration_unit: string;
  reason: string;
  attachments?: string[];
  need_adjustment: boolean;
  affected_slots: AffectedSlot[];
  approver_selection: ApproverSelection[];
  status: string;
  current_step: number;
  approved_by_list: ApprovalRecord[];
  approved_by?: string;
  approved_at?: string;
  reject_reason?: string;
  adjustment_status?: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
}

/**
 * 调课记录数据库行
 */
export interface CourseAdjustmentRow {
  id: string;
  leave_request_id?: string;
  applicant_id?: string;
  applicant_name?: string;
  adjust_type?: string;
  status?: string;
  effective_week?: string;
  class_id?: string;
  class_name?: string;
  grade?: number;
  week_day?: number;
  period_index?: number;
  subject?: string;
  original_slot?: Record<string, unknown>;
  reason?: string;
  reason_type?: string;
}

/**
 * 请假 Repository
 */
export class LeaveRepository extends BaseRepository<LeaveRequest> {
  constructor() {
    super('leave_requests');
  }
  
  /**
   * 查询用户的请假记录
   */
  async findByUser(
    userId: string,
    options: { status?: string; page?: number; pageSize?: number } = {}
  ): Promise<PaginatedResult<LeaveRequest>> {
    const { status, page = 1, pageSize = 20 } = options;
    
    const filters: Record<string, unknown> = { user_id: userId };
    if (status) filters.status = status;
    
    return this.findPaginated({
      filters,
      orderBy: { column: 'created_at', ascending: false },
      pagination: { page, pageSize },
    });
  }
  
  /**
   * 查询待审批的请假
   */
  async findPending(options: { page?: number; pageSize?: number } = {}): Promise<PaginatedResult<LeaveRequest>> {
    const { page = 1, pageSize = 20 } = options;
    
    return this.findPaginated({
      filters: { status: 'pending' },
      orderBy: { column: 'created_at', ascending: false },
      pagination: { page, pageSize },
    });
  }
  
  /**
   * 查询指定日期范围的请假
   */
  async findByDateRange(
    startDate: string,
    endDate: string
  ): Promise<LeaveRequest[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
      .in('status', ['pending', 'approved']);
    
    if (error) {
      console.error('[LeaveRepository] findByDateRange error:', error.message);
      return [];
    }
    
    return (data || []) as LeaveRequest[];
  }
  
  /**
   * 查询某日期的请假记录
   */
  async findByDate(date: string): Promise<LeaveRequest[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .lte('start_date', date)
      .gte('end_date', date)
      .eq('status', 'approved');
    
    if (error) {
      console.error('[LeaveRepository] findByDate error:', error.message);
      return [];
    }
    
    return (data || []) as LeaveRequest[];
  }
  
  /**
   * 检查日期范围内是否有请假
   */
  async hasLeaveInDateRange(
    userId: string,
    startDate: string,
    endDate: string,
    excludeId?: string
  ): Promise<boolean> {
    let query = this.client
      .from(this.tableName)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['pending', 'approved'])
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { count, error } = await query;
    
    if (error) {
      console.error('[LeaveRepository] hasLeaveInDateRange error:', error.message);
      return false;
    }
    
    return (count || 0) > 0;
  }
  
  /**
   * 审批请假
   */
  async approve(
    leaveId: string,
    approverId: string,
    comment?: string
  ): Promise<LeaveRequest | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({
        status: 'approved',
        approver_id: approverId,
        approval_comment: comment,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', leaveId)
      .select()
      .single();
    
    if (error) {
      console.error('[LeaveRepository] approve error:', error.message);
      return null;
    }
    
    return data as LeaveRequest;
  }
  
  /**
   * 拒绝请假
   */
  async reject(
    leaveId: string,
    approverId: string,
    reason: string
  ): Promise<LeaveRequest | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({
        status: 'rejected',
        approver_id: approverId,
        approval_comment: reason,
        rejected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', leaveId)
      .select()
      .single();
    
    if (error) {
      console.error('[LeaveRepository] reject error:', error.message);
      return null;
    }
    
    return data as LeaveRequest;
  }
  
  /**
   * 取消请假
   */
  async cancel(leaveId: string): Promise<boolean> {
    const { error } = await this.client
      .from(this.tableName)
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', leaveId)
      .eq('status', 'pending');
    
    if (error) {
      console.error('[LeaveRepository] cancel error:', error.message);
      return false;
    }
    
    return true;
  }
  
  /**
   * 统计请假天数
   */
  async calculateLeaveDays(userId: string, year: number): Promise<{
    total: number;
    byType: Record<string, number>;
  }> {
    const startOfYear = `${year}-01-01`;
    const endOfYear = `${year}-12-31`;
    
    const leaves = await this.findByDateRange(startOfYear, endOfYear);
    const userLeaves = leaves.filter(l => l.applicantId === userId);
    
    let total = 0;
    const byType: Record<string, number> = {};
    
    for (const leave of userLeaves) {
      const days = this.calculateDays(leave.startDate, leave.endDate);
      total += days;
      byType[leave.type] = (byType[leave.type] || 0) + days;
    }
    
    return { total, byType };
  }
  
  /**
   * 计算天数
   */
  private calculateDays(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  // ========================================
  // v2 审批流程相关方法
  // ========================================

  /**
   * 根据 ID 获取请假申请详情（v2 格式）
   */
  async findByIdV2(id: string): Promise<LeaveRequestRow | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('[LeaveRepository] findByIdV2 error:', error.message);
      return null;
    }
    
    return data as LeaveRequestRow;
  }

  /**
   * 更新请假申请状态
   */
  async updateStatus(
    leaveId: string,
    updates: Partial<LeaveRequestRow>
  ): Promise<LeaveRequestRow | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leaveId)
      .select()
      .single();
    
    if (error) {
      console.error('[LeaveRepository] updateStatus error:', error.message);
      return null;
    }
    
    return data as LeaveRequestRow;
  }

  /**
   * 获取待审批列表（根据审批人筛选）
   */
  async findPendingForApprover(
    employeeId: string,
    status: 'pending' | 'approved' | 'my' = 'pending'
  ): Promise<LeaveRequestRow[]> {
    let query = this.client
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status === 'pending') {
      query = query.eq('status', 'pending');
    } else if (status === 'approved') {
      query = query.in('status', ['approved', 'rejected']);
    } else if (status === 'my') {
      query = query.eq('applicant_id', employeeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[LeaveRepository] findPendingForApprover error:', error.message);
      return [];
    }

    let filteredData = (data || []) as LeaveRequestRow[];
    
    if (status === 'pending') {
      // 筛选当前用户需要审批的
      filteredData = filteredData.filter(item => {
        const approverSelection = item.approver_selection || [];
        return approverSelection.some(a => a.employeeId === employeeId);
      });
    } else if (status === 'approved') {
      // 筛选当前用户已处理过的
      filteredData = filteredData.filter(item => {
        const approvedByList = item.approved_by_list || [];
        return approvedByList.some(a => a.employeeId === employeeId);
      });
    }

    return filteredData;
  }

  /**
   * 创建调课记录
   */
  async createCourseAdjustments(
    records: Partial<CourseAdjustmentRow>[]
  ): Promise<CourseAdjustmentRow[]> {
    const { data, error } = await this.client
      .from('course_adjustments')
      .insert(records)
      .select();
    
    if (error) {
      console.error('[LeaveRepository] createCourseAdjustments error:', error.message);
      return [];
    }
    
    return (data || []) as CourseAdjustmentRow[];
  }

  /**
   * 删除调课记录（根据请假申请 ID）
   */
  async deleteCourseAdjustmentsByLeaveId(leaveRequestId: string): Promise<boolean> {
    const { error } = await this.client
      .from('course_adjustments')
      .delete()
      .eq('leave_request_id', leaveRequestId);
    
    if (error) {
      console.error('[LeaveRepository] deleteCourseAdjustmentsByLeaveId error:', error.message);
      return false;
    }
    
    return true;
  }

  /**
   * 更新调课状态
   */
  async updateAdjustmentStatus(
    leaveId: string,
    adjustmentStatus: string
  ): Promise<boolean> {
    const { error } = await this.client
      .from(this.tableName)
      .update({
        adjustment_status: adjustmentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leaveId);
    
    if (error) {
      console.error('[LeaveRepository] updateAdjustmentStatus error:', error.message);
      return false;
    }
    
    return true;
  }

  /**
   * 根据员工 ID 获取用户 UUID
   */
  async getUserUUIDByEmployeeId(employeeId: string): Promise<{ id: string; name: string } | null> {
    const { data, error } = await this.client
      .from('users')
      .select('id, name')
      .eq('employee_id', employeeId)
      .single();
    
    if (error) {
      console.error('[LeaveRepository] getUserUUIDByEmployeeId error:', error.message);
      return null;
    }
    
    return data as { id: string; name: string };
  }

  /**
   * 根据条件查询用户
   */
  async findUsersByConditions(conditions: Record<string, unknown>): Promise<{ id: string; employee_id: string; name: string }[]> {
    let query = this.client
      .from('users')
      .select('id, employee_id, name');
    
    Object.entries(conditions).forEach(([key, value]) => {
      if (key === 'additional_roles' || key === 'managed_grades') {
        // 使用 contains 操作符处理数组字段
        query = query.contains(key, value as unknown[]);
      } else {
        query = query.eq(key, value);
      }
    });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[LeaveRepository] findUsersByConditions error:', error.message);
      return [];
    }
    
    return (data || []) as { id: string; employee_id: string; name: string }[];
  }
}

// 导出单例
export const leaveRepository = new LeaveRepository();
