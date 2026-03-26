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
  user_id?: string; // 数据库字段
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
    
    const filters: any = { user_id: userId };
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
      .eq('status', 'pending'); // 只能取消待审批的
    
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
}

// 导出单例
export const leaveRepository = new LeaveRepository();
