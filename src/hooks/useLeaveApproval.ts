/**
 * 请假审批 Hook
 * 
 * 用于审批人获取待审批请假列表、执行审批操作
 */

import { useState, useEffect, useCallback } from 'react';

// ==================== 类型定义 ====================

export interface LeaveApprovalItem {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantGrade?: number;
  type: string;
  startDate: string;
  endDate: string;
  duration: number;
  durationUnit: string;
  reason: string;
  needAdjustment: boolean;
  affectedSlots: any[];
  approverSelection: any[];
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  approvedByList: any[];
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveApprovalStatistics {
  pending: number;
  approved: number;
  rejected: number;
}

export interface UseLeaveApprovalReturn {
  // 数据
  approvals: LeaveApprovalItem[];
  loading: boolean;
  error: string | null;
  statistics: LeaveApprovalStatistics;
  
  // 操作
  fetchApprovals: (status: 'pending' | 'approved' | 'my') => Promise<void>;
  approve: (id: string) => Promise<{ success: boolean; message: string }>;
  reject: (id: string, reason: string) => Promise<{ success: boolean; message: string }>;
  refresh: () => Promise<void>;
}

// ==================== Hook 实现 ====================

export function useLeaveApproval(): UseLeaveApprovalReturn {
  const [approvals, setApprovals] = useState<LeaveApprovalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<LeaveApprovalStatistics>({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  // 获取待审批列表
  const fetchApprovals = useCallback(async (status: 'pending' | 'approved' | 'my' = 'pending') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/leave-requests-v2/pending?status=${status}`, {
        credentials: 'include',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setApprovals(result.data || []);
        
        // 更新统计
        if (status === 'pending') {
          setStatistics(prev => ({ ...prev, pending: result.total }));
        }
      } else {
        setError(result.error || '获取失败');
      }
    } catch (err) {
      console.error('获取待审批请假列表失败:', err);
      setError('获取失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 审批通过
  const approve = useCallback(async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`/api/leave-requests-v2/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'approve' }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        return { success: true, message: result.data?.message || '审批通过' };
      } else {
        return { success: false, message: result.error || '审批失败' };
      }
    } catch (err) {
      console.error('审批失败:', err);
      return { success: false, message: '审批失败' };
    }
  }, []);

  // 审批驳回
  const reject = useCallback(async (id: string, reason: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`/api/leave-requests-v2/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'reject', rejectReason: reason }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        return { success: true, message: '已驳回' };
      } else {
        return { success: false, message: result.error || '驳回失败' };
      }
    } catch (err) {
      console.error('驳回失败:', err);
      return { success: false, message: '驳回失败' };
    }
  }, []);

  // 刷新
  const refresh = useCallback(async () => {
    await fetchApprovals('pending');
  }, [fetchApprovals]);

  return {
    approvals,
    loading,
    error,
    statistics,
    fetchApprovals,
    approve,
    reject,
    refresh,
  };
}
