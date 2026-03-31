/**
 * 经费管理服务层
 * 
 * 处理班级经费相关的业务逻辑
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { getSupabaseClient } from '@/storage/database/supabase-client';

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
  async getList(params: ExpenseQueryParams): Promise<PaginatedServiceResult<Record<string, unknown>[]>> {
    try {
      const client = getSupabaseClient();
      const { page = 1, pageSize = 20, classId, type, status, startDate, endDate, applicantId } = params;

      let query = client
        .from('class_expenses')
        .select('*', { count: 'exact' });

      if (classId) {
        query = query.eq('class_id', classId);
      }
      if (type) {
        query = query.eq('type', type);
      }
      if (status) {
        query = query.eq('status', status);
      }
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }
      if (applicantId) {
        query = query.eq('applicant_id', applicantId);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        return { success: false, error: '获取经费列表失败' };
      }

      return {
        success: true,
        data: data || [],
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
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
  async getById(id: string): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('class_expenses')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
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
  async create(params: CreateExpenseParams): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const client = getSupabaseClient();

      const expenseId = `expense-${Date.now()}`;

      const { data, error } = await client
        .from('class_expenses')
        .insert({
          id: expenseId,
          class_id: params.classId,
          type: params.type,
          amount: params.amount,
          description: params.description,
          applicant_id: params.applicantId,
          applicant_name: params.applicantName,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: '创建失败: ' + error.message };
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
  async update(id: string, params: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const client = getSupabaseClient();

      const { data, error } = await client
        .from('class_expenses')
        .update({
          ...params,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
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
      const client = getSupabaseClient();

      const { error } = await client
        .from('class_expenses')
        .delete()
        .eq('id', id);

      if (error) {
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
  async approve(id: string, approverId: string, approverName: string, approved: boolean, comment?: string): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const client = getSupabaseClient();

      const { data: existing } = await client
        .from('class_expenses')
        .select('*')
        .eq('id', id)
        .single();

      if (!existing) {
        return { success: false, error: '经费记录不存在', code: 'NOT_FOUND' };
      }

      if (existing.status !== 'pending') {
        return { success: false, error: '该记录已处理', code: 'ALREADY_PROCESSED' };
      }

      const { data, error } = await client
        .from('class_expenses')
        .update({
          status: approved ? 'approved' : 'rejected',
          approver_id: approverId,
          approver_name: approverName,
          approval_comment: comment,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
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
  async process(id: string, action: 'complete' | 'cancel', processorId: string, processorName: string, note?: string): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const client = getSupabaseClient();

      const { data: existing } = await client
        .from('class_expenses')
        .select('*')
        .eq('id', id)
        .single();

      if (!existing) {
        return { success: false, error: '经费记录不存在', code: 'NOT_FOUND' };
      }

      if (existing.status !== 'approved') {
        return { success: false, error: '只能处理已审批的记录', code: 'INVALID_STATUS' };
      }

      const { data, error } = await client
        .from('class_expenses')
        .update({
          status: action === 'complete' ? 'completed' : 'cancelled',
          processor_id: processorId,
          processor_name: processorName,
          process_note: note,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
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
      const client = getSupabaseClient();

      let query = client.from('class_expenses').select('*');
      if (classId) {
        query = query.eq('class_id', classId);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: '获取统计失败' };
      }

      const expenses = data || [];

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
      const client = getSupabaseClient();

      // 收入
      const { data: incomes } = await client
        .from('class_expenses')
        .select('amount')
        .eq('class_id', classId)
        .eq('type', 'income')
        .eq('status', 'completed');

      // 支出
      const { data: expenses } = await client
        .from('class_expenses')
        .select('amount')
        .eq('class_id', classId)
        .eq('type', 'expense')
        .eq('status', 'completed');

      const totalIncome = incomes?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0;
      const totalExpense = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

      return { success: true, data: { balance: totalIncome - totalExpense } };
    } catch (err) {
      console.error('Get balance error:', err);
      return { success: false, error: '服务器错误' };
    }
  }
}

// 导出单例
export const expenseService = new ExpenseService();
