/**
 * 报销记录数据仓库
 */
import { BaseRepository } from './base.repository';

/** 数据库行类型 */
type ExpenseRow = {
  id: string;
  title: string;
  type: string;
  items: unknown;
  amount: number | null;
  total_amount: number | null;
  description: string | null;
  images: string[] | null;
  invoices: string[] | null;
  applicant_id: string;
  applicant_name: string;
  department: string | null;
  urgency: string | null;
  status: string;
  approved_amount: number | null;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  paid_at: string | null;
  paid_by: string | null;
  paid_by_name: string | null;
  payment_method: string | null;
  payment_voucher: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export class ExpenseReimbursementRepository extends BaseRepository<ExpenseRow> {
  constructor() {
    super('expense_reimbursements');
  }

  /** 获取列表（支持筛选） */
  async getList(filters?: {
    status?: string;
    type?: string;
    applicantId?: string;
    department?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ExpenseRow[]> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.applicantId) {
      query = query.eq('applicant_id', filters.applicantId);
    }
    if (filters?.department) {
      query = query.eq('department', filters.department);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[ExpenseReimbursementRepository] getList error:', error.message);
      return [];
    }
    return (data as ExpenseRow[]) || [];
  }

  /** 获取统计数据 */
  async getStatistics(applicantId?: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    paid: number;
    totalAmount: number;
    pendingAmount: number;
    approvedAmount: number;
    paidAmount: number;
  }> {
    let query = this.client
      .from(this.tableName)
      .select('status, amount, total_amount');

    if (applicantId) {
      query = query.eq('applicant_id', applicantId);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error('[ExpenseReimbursementRepository] getStatistics error:', error?.message);
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        paid: 0,
        totalAmount: 0,
        pendingAmount: 0,
        approvedAmount: 0,
        paidAmount: 0,
      };
    }

    const stats = {
      total: data.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      paid: 0,
      totalAmount: 0,
      pendingAmount: 0,
      approvedAmount: 0,
      paidAmount: 0,
    };

    for (const item of data) {
      const amount = Number(item.total_amount || item.amount) || 0;
      stats.totalAmount += amount;

      switch (item.status) {
        case 'pending':
          stats.pending++;
          stats.pendingAmount += amount;
          break;
        case 'approved':
          stats.approved++;
          stats.approvedAmount += amount;
          break;
        case 'rejected':
          stats.rejected++;
          break;
        case 'paid':
        case 'reimbursed':
          stats.paid++;
          stats.paidAmount += amount;
          break;
      }
    }

    return stats;
  }

  /** 更新状态 */
  async updateStatus(
    id: string,
    status: string,
    extraData?: Record<string, unknown>
  ): Promise<ExpenseRow | null> {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
      ...extraData,
    };

    const { data, error } = await this.client
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[ExpenseReimbursementRepository] updateStatus error:', error.message);
      return null;
    }
    return data as ExpenseRow;
  }
}

// 导出单例
export const expenseReimbursementRepository = new ExpenseReimbursementRepository();
