/**
 * 经费管理服务层
 * 
 * 架构：API Route → Service → Repository
 * 处理班级经费相关的业务逻辑
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { expenseRepository, ExpenseRecord } from '@/repositories/expense.repository';

/**
 * 经费查询参数
 */
export interface ExpenseQueryParams {
  classId?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  applicantId?: string;
  department?: string;
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 创建经费参数
 */
export interface CreateExpenseParams {
  classId: string;
  type: string;
  amount: number;
  description: string;
  applicantId: string;
  applicantName: string;
  [key: string]: unknown;
}

/**
 * 经费服务
 */
export class ExpenseService extends BaseService {
  /**
   * 获取经费列表
   */
  async getList(params: ExpenseQueryParams): Promise<PaginatedServiceResult<Record<string, unknown>>> {
    try {
      const result = await expenseRepository.findList({
        classId: params.classId,
        type: params.type,
        status: params.status,
        startDate: params.startDate,
        endDate: params.endDate,
        applicantId: params.applicantId,
        department: params.department,
        category: params.category,
        search: params.search,
        page: params.page,
        pageSize: params.pageSize,
      });

      return {
        success: true,
        data: result.data as unknown as Record<string, unknown>[],
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
        },
      };
    } catch (err) {
      console.error('Get expense list error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 根据ID获取经费详情
   */
  async getById(id: string): Promise<ServiceResult<ExpenseRecord>> {
    try {
      const data = await expenseRepository.findById(id);
      
      if (!data) {
        return { success: false, error: '经费记录不存在', code: 'NOT_FOUND' };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Get expense by id error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 创建经费申请
   */
  async create(params: CreateExpenseParams): Promise<ServiceResult<ExpenseRecord>> {
    try {
      const expenseId = `expense-${Date.now()}`;
      const expenseNo = `BX${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Date.now()).slice(-6)}`;

      const data = await expenseRepository.create({
        id: expenseId,
        expense_no: expenseNo,
        class_id: params.classId,
        type: params.type,
        amount: params.amount,
        total_amount: params.amount,
        description: params.description,
        applicant_id: params.applicantId,
        applicant_name: params.applicantName,
        status: 'pending',
      });

      if (!data) {
        return { success: false, error: '创建失败' };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Create expense error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 更新经费
   */
  async update(id: string, params: Record<string, unknown>): Promise<ServiceResult<ExpenseRecord>> {
    try {
      const data = await expenseRepository.update(id, params);
      
      if (!data) {
        return { success: false, error: '更新失败' };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Update expense error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 删除经费
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    try {
      const success = await expenseRepository.delete(id);
      
      if (!success) {
        return { success: false, error: '删除失败' };
      }

      return { success: true };
    } catch (err) {
      console.error('Delete expense error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 审批经费
   */
  async approve(id: string, approverId: string, approverName: string, approved: boolean, comment?: string): Promise<ServiceResult<ExpenseRecord>> {
    try {
      const existing = await expenseRepository.findById(id);

      if (!existing) {
        return { success: false, error: '经费记录不存在', code: 'NOT_FOUND' };
      }

      if (existing.status !== 'pending') {
        return { success: false, error: '该记录已处理', code: 'ALREADY_PROCESSED' };
      }

      const data = await expenseRepository.updateStatus(id, approved ? 'approved' : 'rejected', {
        approver_id: approverId,
        approver_name: approverName,
        approval_comment: comment,
        approved_at: new Date().toISOString(),
      });

      if (!data) {
        return { success: false, error: '审批失败' };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Approve expense error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 处理经费（完成/取消）
   */
  async process(id: string, action: 'complete' | 'cancel', processorId: string, processorName: string, note?: string): Promise<ServiceResult<ExpenseRecord>> {
    try {
      const existing = await expenseRepository.findById(id);

      if (!existing) {
        return { success: false, error: '经费记录不存在', code: 'NOT_FOUND' };
      }

      if (existing.status !== 'approved') {
        return { success: false, error: '只能处理已审批的记录', code: 'INVALID_STATUS' };
      }

      const data = await expenseRepository.updateStatus(id, action === 'complete' ? 'completed' : 'cancelled', {
        processor_id: processorId,
        processor_name: processorName,
        process_note: note,
        processed_at: new Date().toISOString(),
      });

      if (!data) {
        return { success: false, error: '处理失败' };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Process expense error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 获取经费统计
   */
  async getStatistics(classId?: string): Promise<ServiceResult<{
    total: number;
    pending: number;
    approved: number;
    completed: number;
    rejected: number;
    totalAmount: number;
    pendingAmount: number;
    completedAmount: number;
  }>> {
    try {
      const expenses = await expenseRepository.findAllForStats(classId);

      const stats = {
        total: expenses.length,
        pending: expenses.filter(e => e.status === 'pending').length,
        approved: expenses.filter(e => e.status === 'approved').length,
        completed: expenses.filter(e => e.status === 'completed').length,
        rejected: expenses.filter(e => e.status === 'rejected').length,
        totalAmount: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
        pendingAmount: expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + (e.amount || 0), 0),
        completedAmount: expenses.filter(e => e.status === 'completed').reduce((sum, e) => sum + (e.amount || 0), 0),
      };

      return { success: true, data: stats };
    } catch (err) {
      console.error('Get expense statistics error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 获取班级经费余额
   */
  async getBalance(classId: string): Promise<ServiceResult<{ balance: number }>> {
    try {
      // 收入
      const incomes = await expenseRepository.findCompletedByClass(classId, 'income');
      // 支出
      const expenses = await expenseRepository.findCompletedByClass(classId, 'expense');

      const totalIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
      const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      return { success: true, data: { balance: totalIncome - totalExpense } };
    } catch (err) {
      console.error('Get balance error:', err);
      return { success: false, error: '服务器错误' };
    }
  }
}

// 导出单例
export const expenseService = new ExpenseService();
