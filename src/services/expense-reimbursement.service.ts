/**
 * 报销记录业务服务
 */
import { BaseService, ServiceResult } from './base.service';
import { expenseReimbursementRepository } from '@/repositories/expense-reimbursement.repository';
import type { ExpenseRecord, ExpenseItem, ExpenseStatistics } from '@/types/general';

type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'paid' | 'reimbursed' | 'cancelled';

/** 数据库行类型 - 与 Repository 保持一致 */
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

/** 数据库行转前端类型 */
function rowToRecord(row: ExpenseRow): ExpenseRecord {
  return {
    id: row.id,
    expenseNo: row.id.substring(0, 8).toUpperCase(),
    title: row.title,
    type: row.type as ExpenseRecord['type'],
    items: (row.items as ExpenseItem[]) || [],
    totalAmount: Number(row.total_amount || row.amount || 0),
    amount: Number(row.amount || row.total_amount || 0),
    description: row.description || '',
    urgency: (row.urgency || 'normal') as ExpenseRecord['urgency'],
    images: row.images || [],
    invoices: row.invoices || [],
    applicantId: row.applicant_id,
    applicantName: row.applicant_name,
    department: row.department || '',
    status: row.status as ExpenseStatus,
    reviewedById: row.approved_by || undefined,
    reviewedByName: row.approved_by_name || undefined,
    reviewedAt: row.approved_at || undefined,
    rejectionReason: row.rejection_reason || undefined,
    rejection_reason: row.rejection_reason || undefined,
    reimbursedById: row.paid_by || undefined,
    reimbursedByName: row.paid_by_name || undefined,
    reimbursedAt: row.paid_at || undefined,
    reimbursementNo: row.payment_voucher || undefined,
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at,
  };
}

/** 前端类型转数据库行 */
function recordToRow(record: Partial<ExpenseRecord>, isNew: boolean = false): Partial<ExpenseRow> {
  const row: Partial<ExpenseRow> = {
    title: record.title,
    type: record.type,
    items: record.items,
    amount: record.amount || record.totalAmount,
    total_amount: record.totalAmount || record.amount,
    description: record.description,
    images: record.images,
    applicant_id: record.applicantId,
    applicant_name: record.applicantName,
    department: record.department,
    urgency: record.urgency,
    status: record.status as ExpenseStatus,
    approved_by: record.reviewedById,
    approved_by_name: record.reviewedByName,
    approved_at: record.reviewedAt,
    rejection_reason: record.rejectionReason,
    paid_by: record.reimbursedById,
    paid_by_name: record.reimbursedByName,
    paid_at: record.reimbursedAt,
    payment_voucher: record.reimbursementNo,
  };

  if (isNew) {
    row.id = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    row.created_at = new Date().toISOString();
    row.updated_at = new Date().toISOString();
    if (!row.status) row.status = 'pending';
  } else {
    row.updated_at = new Date().toISOString();
  }

  return row;
}

export class ExpenseReimbursementService extends BaseService {
  /** 获取列表 */
  async getExpenses(filters?: {
    status?: string;
    type?: string;
    applicantId?: string;
    department?: string;
  }): Promise<ServiceResult<ExpenseRecord[]>> {
    try {
      const rows = await expenseReimbursementRepository.getList(filters);
      const records = rows.map(row => rowToRecord(row));
      return this.ok(records);
    } catch (err) {
      console.error('[ExpenseReimbursementService] getExpenses error:', err);
      return this.fail('获取报销列表失败', 'SERVER_ERROR');
    }
  }

  /** 获取详情 */
  async getExpenseById(id: string): Promise<ServiceResult<ExpenseRecord>> {
    try {
      const row = await expenseReimbursementRepository.findById(id);
      if (!row) {
        return this.fail('报销记录不存在', 'NOT_FOUND');
      }
      return this.ok(rowToRecord(row));
    } catch (err) {
      console.error('[ExpenseReimbursementService] getExpenseById error:', err);
      return this.fail('获取报销详情失败', 'SERVER_ERROR');
    }
  }

  /** 创建报销申请 */
  async createExpense(data: Partial<ExpenseRecord> & {
    totalAmount?: number;
    urgency?: string;
  }): Promise<ServiceResult<ExpenseRecord>> {
    try {
      const rowData = recordToRow(data, true);
      const row = await expenseReimbursementRepository.create(rowData as Parameters<typeof expenseReimbursementRepository.create>[0]);
      if (!row) {
        return this.fail('创建报销申请失败', 'CREATE_FAILED');
      }
      return this.ok(rowToRecord(row));
    } catch (err) {
      console.error('[ExpenseReimbursementService] createExpense error:', err);
      return this.fail('创建报销申请失败', 'SERVER_ERROR');
    }
  }

  /** 更新报销申请 */
  async updateExpense(id: string, data: Partial<ExpenseRecord>): Promise<ServiceResult<ExpenseRecord>> {
    try {
      const rowData = recordToRow(data, false);
      const row = await expenseReimbursementRepository.update(id, rowData as Parameters<typeof expenseReimbursementRepository.update>[1]);
      if (!row) {
        return this.fail('更新报销申请失败', 'UPDATE_FAILED');
      }
      return this.ok(rowToRecord(row));
    } catch (err) {
      console.error('[ExpenseReimbursementService] updateExpense error:', err);
      return this.fail('更新报销申请失败', 'SERVER_ERROR');
    }
  }

  /** 删除报销申请 */
  async deleteExpense(id: string): Promise<ServiceResult<boolean>> {
    try {
      await expenseReimbursementRepository.delete(id);
      return this.ok(true);
    } catch (err) {
      console.error('[ExpenseReimbursementService] deleteExpense error:', err);
      return this.fail('删除报销申请失败', 'SERVER_ERROR');
    }
  }

  /** 获取统计数据 */
  async getStatistics(applicantId?: string): Promise<ServiceResult<ExpenseStatistics>> {
    try {
      const stats = await expenseReimbursementRepository.getStatistics(applicantId);
      return this.ok({
        total: stats.total,
        totalCount: stats.total,
        pending: stats.pending,
        pendingCount: stats.pending,
        approved: stats.approved,
        approvedCount: stats.approved,
        rejected: stats.rejected,
        paid: stats.paid,
        paidCount: stats.paid,
        reimbursed: stats.paid,
        totalAmount: stats.totalAmount,
        pendingAmount: stats.pendingAmount,
        approvedAmount: stats.approvedAmount,
        paidAmount: stats.paidAmount,
        reimbursedAmount: stats.paidAmount,
      });
    } catch (err) {
      console.error('[ExpenseReimbursementService] getStatistics error:', err);
      return this.fail('获取统计数据失败', 'SERVER_ERROR');
    }
  }

  /** 批准报销 */
  async approveExpense(id: string, data: {
    approvedBy?: string;
    approvedByName?: string;
    approvedAmount?: number;
  }): Promise<ServiceResult<ExpenseRecord>> {
    try {
      const row = await expenseReimbursementRepository.updateStatus(id, 'approved', {
        approved_by: data.approvedBy,
        approved_by_name: data.approvedByName,
        approved_at: new Date().toISOString(),
        approved_amount: data.approvedAmount,
      });
      if (!row) {
        return this.fail('批准报销失败', 'UPDATE_FAILED');
      }
      return this.ok(rowToRecord(row));
    } catch (err) {
      console.error('[ExpenseReimbursementService] approveExpense error:', err);
      return this.fail('批准报销失败', 'SERVER_ERROR');
    }
  }

  /** 拒绝报销 */
  async rejectExpense(id: string, reason: string): Promise<ServiceResult<ExpenseRecord>> {
    try {
      const row = await expenseReimbursementRepository.updateStatus(id, 'rejected', {
        rejection_reason: reason,
      });
      if (!row) {
        return this.fail('拒绝报销失败', 'UPDATE_FAILED');
      }
      return this.ok(rowToRecord(row));
    } catch (err) {
      console.error('[ExpenseReimbursementService] rejectExpense error:', err);
      return this.fail('拒绝报销失败', 'SERVER_ERROR');
    }
  }

  /** 标记已付款 */
  async payExpense(id: string, data: {
    paidAt?: string;
    paidBy?: string;
    paidByName?: string;
    paymentMethod?: string;
    paymentVoucher?: string;
  }): Promise<ServiceResult<ExpenseRecord>> {
    try {
      const row = await expenseReimbursementRepository.updateStatus(id, 'paid', {
        paid_at: data.paidAt || new Date().toISOString(),
        paid_by: data.paidBy,
        paid_by_name: data.paidByName,
        payment_method: data.paymentMethod,
        payment_voucher: data.paymentVoucher,
      });
      if (!row) {
        return this.fail('标记付款失败', 'UPDATE_FAILED');
      }
      return this.ok(rowToRecord(row));
    } catch (err) {
      console.error('[ExpenseReimbursementService] payExpense error:', err);
      return this.fail('标记付款失败', 'SERVER_ERROR');
    }
  }
}

// 导出单例
export const expenseReimbursementService = new ExpenseReimbursementService();
