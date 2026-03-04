/**
 * 请假审批 Hook v2 - 简化版
 * 
 * 参考消息中心的策略：
 * - 使用 useEffect 直接发起请求
 * - 使用 refreshKey 状态触发刷新
 * - 使用 cancelled 标志防止组件卸载后更新
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
  fetchApprovals: (status: 'pending' | 'approved' | 'my') => void;
  approve: (id: string) => Promise<{ success: boolean; message: string }>;
  reject: (id: string, reason: string) => Promise<{ success: boolean; message: string }>;
  refresh: () => void;
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
  
  // 查询参数和刷新键
  const [queryStatus, setQueryStatus] = useState<'pending' | 'approved' | 'my'>('pending');
  const [refreshKey, setRefreshKey] = useState(0);

  // 使用 useEffect 直接发起请求（参考消息中心策略）
  useEffect(() => {
    let cancelled = false;
    
    const doFetch = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/leave-requests-v2/pending?status=${queryStatus}`, {
          credentials: 'include',
        });
        
        if (cancelled) return;
        
        const result = await response.json();
        
        if (!cancelled) {
          if (result.success) {
            setApprovals(result.data || []);
            
            // 更新统计
            if (queryStatus === 'pending') {
              setStatistics(prev => ({ ...prev, pending: result.total }));
            }
          } else {
            setApprovals([]);
            setError(result.error || '获取失败');
          }
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('获取待审批请假列表失败:', err);
          setApprovals([]);
          setError('获取失败');
          setLoading(false);
        }
      }
    };
    
    doFetch();
    
    return () => {
      cancelled = true;
    };
  }, [queryStatus, refreshKey]);

  // 切换查询状态
  const fetchApprovals = useCallback((status: 'pending' | 'approved' | 'my') => {
    setQueryStatus(status);
  }, []);

  // 手动刷新
  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
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
        refresh();
        return { success: true, message: result.data?.message || '审批通过' };
      } else {
        return { success: false, message: result.error || '审批失败' };
      }
    } catch (err) {
      console.error('审批失败:', err);
      return { success: false, message: '审批失败' };
    }
  }, [refresh]);

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
        refresh();
        return { success: true, message: '已驳回' };
      } else {
        return { success: false, message: result.error || '驳回失败' };
      }
    } catch (err) {
      console.error('驳回失败:', err);
      return { success: false, message: '驳回失败' };
    }
  }, [refresh]);

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
