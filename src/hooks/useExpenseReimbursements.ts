/**
 * 报销申请 Hooks
 */

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/services/api-client';
import type { 
  ExpenseRecord, 
  ExpenseStatistics, 
  ExpenseFilters,
  ExpenseItem
} from '@/types/general';

/**
 * 报销列表 Hook
 */
export function useExpenses(filters?: ExpenseFilters) {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.applicantId) params.set('applicantId', filters.applicantId);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.type) params.set('type', filters.type);
      if (filters?.department) params.set('department', filters.department);

      const response = await apiClient.get<{ data: ExpenseRecord[]; pagination: { total: number } }>(
        `/api/expense-reimbursements?${params.toString()}`
      );

      if (response.success && response.data) {
        setExpenses(response.data.data || []);
        setTotal(response.data.pagination?.total || 0);
      } else {
        setError(response.message || '获取报销列表失败');
      }
    } catch (err) {
      setError('获取报销列表失败');
      console.error('[useExpenses] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters?.applicantId, filters?.status, filters?.type, filters?.department]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return { expenses, loading, error, total, refetch: fetchExpenses };
}

/**
 * 别名导出 - 兼容旧代码
 */
export const useExpenseReimbursements = useExpenses;

/**
 * 报销统计 Hook
 */
export function useExpenseStatistics(applicantId?: string) {
  const [statistics, setStatistics] = useState<ExpenseStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = applicantId ? `?applicantId=${applicantId}` : '';
      const response = await apiClient.get<{ data: ExpenseStatistics }>(
        `/api/expense-reimbursements/stats${params}`
      );

      if (response.success && response.data) {
        const data = response.data.data;
        // 确保所有字段都有值
        if (data) {
          setStatistics({
            total: data.total || 0,
            totalCount: data.totalCount || data.total || 0,
            pending: data.pending || 0,
            pendingCount: data.pendingCount || data.pending || 0,
            approved: data.approved || 0,
            approvedCount: data.approvedCount || data.approved || 0,
            rejected: data.rejected || 0,
            paid: data.paid || 0,
            paidCount: data.paidCount || data.paid || 0,
            reimbursed: data.reimbursed || 0,
            totalAmount: data.totalAmount || 0,
            pendingAmount: data.pendingAmount || 0,
            approvedAmount: data.approvedAmount || 0,
            paidAmount: data.paidAmount || 0,
            reimbursedAmount: data.reimbursedAmount || 0,
            byType: data.byType || [],
          });
        } else {
          setStatistics(null);
        }
      } else {
        setError(response.message || '获取统计数据失败');
      }
    } catch (err) {
      setError('获取统计数据失败');
      console.error('[useExpenseStatistics] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [applicantId]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return { statistics, loading, error, refetch: fetchStatistics };
}

/**
 * 我的报销 Hook（教师端）
 */
export function useMyExpenses(applicantId?: string) {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyExpenses = useCallback(async () => {
    if (!applicantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ data: ExpenseRecord[] }>(
        `/api/expense-reimbursements?applicantId=${applicantId}`
      );

      if (response.success && response.data) {
        setExpenses(response.data.data || []);
      } else {
        setError(response.message || '获取我的报销失败');
      }
    } catch (err) {
      setError('获取我的报销失败');
      console.error('[useMyExpenses] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [applicantId]);

  useEffect(() => {
    fetchMyExpenses();
  }, [fetchMyExpenses]);

  return { expenses, loading, error, refetch: fetchMyExpenses };
}

/**
 * 报销操作 Hook
 */
export function useExpenseActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createExpense = useCallback(async (data: {
    title: string;
    type: string;
    amount: number;
    description?: string;
    applicantId: string;
    applicantName: string;
    department?: string;
    urgency?: string;
    items?: ExpenseItem[];
    images?: string[];
    invoices?: string[];
    note?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ data: ExpenseRecord }>(
        '/api/expense-reimbursements',
        {
          ...data,
          totalAmount: data.amount,
          items: data.items || [],
        }
      );

      if (response.success && response.data) {
        return response.data.data;
      } else {
        setError(response.message || '创建报销申请失败');
        return undefined;
      }
    } catch (err) {
      setError('创建报销申请失败');
      console.error('[useExpenseActions] Create error:', err);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateExpense = useCallback(async (id: string, data: Partial<ExpenseRecord>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.put<{ data: ExpenseRecord }>(
        `/api/expense-reimbursements/${id}`,
        data
      );

      if (response.success && response.data) {
        return response.data.data;
      } else {
        setError(response.message || '更新报销申请失败');
        return undefined;
      }
    } catch (err) {
      setError('更新报销申请失败');
      console.error('[useExpenseActions] Update error:', err);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.delete(`/api/expense-reimbursements/${id}`);
      return response.success;
    } catch (err) {
      setError('删除报销申请失败');
      console.error('[useExpenseActions] Delete error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveExpense = useCallback(async (
    id: string,
    data: {
      approverId: string;
      approverName: string;
      comment?: string;
    }
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ data: ExpenseRecord }>(
        `/api/expense-reimbursements/${id}/approve`,
        { action: 'approve', ...data }
      );

      if (response.success && response.data) {
        return response.data.data;
      } else {
        setError(response.message || '审批失败');
        return undefined;
      }
    } catch (err) {
      setError('审批失败');
      console.error('[useExpenseActions] Approve error:', err);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectExpense = useCallback(async (
    id: string,
    data: {
      approverId: string;
      approverName: string;
      reason: string;
    }
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ data: ExpenseRecord }>(
        `/api/expense-reimbursements/${id}/approve`,
        { action: 'reject', ...data }
      );

      if (response.success && response.data) {
        return response.data.data;
      } else {
        setError(response.message || '拒绝失败');
        return undefined;
      }
    } catch (err) {
      setError('拒绝失败');
      console.error('[useExpenseActions] Reject error:', err);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  const payExpense = useCallback(async (
    id: string,
    data: {
      paidAmount: number;
      paymentMethod: string;
      transactionNo?: string;
    }
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ data: ExpenseRecord }>(
        `/api/expense-reimbursements/${id}/approve`,
        { action: 'pay', ...data }
      );

      if (response.success && response.data) {
        return response.data.data;
      } else {
        setError(response.message || '支付失败');
        return undefined;
      }
    } catch (err) {
      setError('支付失败');
      console.error('[useExpenseActions] Pay error:', err);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
    approveExpense,
    rejectExpense,
    payExpense,
  };
}

// 创建报销别名
export function useCreateExpense() {
  return useExpenseActions();
}
