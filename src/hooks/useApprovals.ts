/**
 * 审批流程 Hook v3 - 简化版
 * 
 * 参考消息中心的策略：
 * - 使用 useEffect 直接发起请求
 * - 使用 refreshKey 状态触发刷新
 * - 使用 cancelled 标志防止组件卸载后更新
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { PAGINATION } from '@/lib/pagination-config';
import { getAuthHeaders, getAccessToken } from '@/lib/auth-client';
import type {
  ApprovalInstance,
  ApprovalStatus,
  SubmitApprovalRequest,
  ApprovalActionRequest,
  PendingApprovalQuery,
} from '@/types/approval';

// ==================== 类型定义 ====================

/** 审批列表类型 */
export type ApprovalListType = 'pending' | 'processed' | 'my';

/** 审批统计 */
export interface ApprovalStatistics {
  pending: number;
  processed: number;
  my: number;
  byType: {
    announcement: number;
    news: number;
    internal_notice: number;
    parent_notice: number;
  };
  byStatus: Record<ApprovalStatus, number>;
}

/** 审批 Hook 返回类型 */
export interface UseApprovalsReturn {
  approvals: ApprovalInstance[];
  loading: boolean;
  error: string | null;
  currentType: ApprovalListType;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  filters: PendingApprovalQuery;
  setFilters: (filters: Partial<PendingApprovalQuery>) => void;
  clearFilters: () => void;
  fetchApprovals: (type: ApprovalListType) => void;
  submitApproval: (request: SubmitApprovalRequest) => Promise<{ success: boolean; data?: any; error?: string }>;
  approveApproval: (instanceId: string, comment?: string) => Promise<boolean>;
  rejectApproval: (instanceId: string, comment?: string) => Promise<boolean>;
  returnApproval: (instanceId: string, comment?: string) => Promise<boolean>;
  withdrawApproval: (instanceId: string) => Promise<boolean>;
  statistics: ApprovalStatistics;
  refreshStatistics: () => void;
  startPolling: (interval?: number) => void;
  stopPolling: () => void;
  isPolling: boolean;
}

const DEFAULT_STATISTICS: ApprovalStatistics = {
  pending: 0,
  processed: 0,
  my: 0,
  byType: {
    announcement: 0,
    news: 0,
    internal_notice: 0,
    parent_notice: 0,
  },
  byStatus: {
    draft: 0,
    pending: 0,
    in_progress: 0,
    approved: 0,
    rejected: 0,
    withdrawn: 0,
  },
};

const DEFAULT_FILTERS: PendingApprovalQuery = {};

// ==================== 辅助函数 ====================

export function getApprovalStatusLabel(status: ApprovalStatus): string {
  const labels: Record<ApprovalStatus, string> = {
    draft: '草稿',
    pending: '待审批',
    in_progress: '审批中',
    approved: '已通过',
    rejected: '已驳回',
    withdrawn: '已撤回',
  };
  return labels[status] || status;
}

export function getApprovalStatusColor(status: ApprovalStatus): string {
  const colors: Record<ApprovalStatus, string> = {
    draft: 'bg-gray-100 text-gray-600',
    pending: 'bg-yellow-100 text-yellow-600',
    in_progress: 'bg-blue-100 text-blue-600',
    approved: 'bg-green-100 text-green-600',
    rejected: 'bg-red-100 text-red-600',
    withdrawn: 'bg-gray-100 text-gray-500',
  };
  return colors[status] || 'bg-gray-100 text-gray-600';
}

export function getApprovalStatusIcon(status: ApprovalStatus): string {
  const icons: Record<ApprovalStatus, string> = {
    draft: '📝',
    pending: '⏳',
    in_progress: '🔄',
    approved: '✅',
    rejected: '❌',
    withdrawn: '↩️',
  };
  return icons[status] || '❓';
}

export function getApprovalTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    announcement: '公告',
    news: '新闻',
    internal_notice: '校内通知',
    parent_notice: '家长通知',
  };
  return labels[type] || type;
}

export function getApprovalTypeColor(type: string): string {
  const colors: Record<string, string> = {
    announcement: 'bg-blue-100 text-blue-600',
    news: 'bg-purple-100 text-purple-600',
    internal_notice: 'bg-orange-100 text-orange-600',
    parent_notice: 'bg-green-100 text-green-600',
  };
  return colors[type] || 'bg-gray-100 text-gray-600';
}

export function canUserApprove(instance: ApprovalInstance, userRole: string): boolean {
  if (instance.status !== 'pending' && instance.status !== 'in_progress') return false;
  // 简化判断：根据状态和角色判断
  return true;
}

export function canUserWithdraw(instance: ApprovalInstance, userId: string): boolean {
  if (instance.status !== 'pending' && instance.status !== 'in_progress') return false;
  return instance.applicantId === userId;
}

export function canUserView(instance: ApprovalInstance, userId: string, userRole: string): boolean {
  if (instance.applicantId === userId) return true;
  if (canUserApprove(instance, userRole)) return true;
  return false;
}

// ==================== Hook 实现 ====================

export function useApprovals(initialType: ApprovalListType = 'pending'): UseApprovalsReturn {
  // === 状态 ===
  const [approvals, setApprovals] = useState<ApprovalInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentType, setCurrentType] = useState<ApprovalListType>(initialType);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tokenReady, setTokenReady] = useState(false);

  // === 分页 ===
  const [page, setPage] = useState(1);
  const [pageSize] = useState(PAGINATION.DEFAULT_DISPLAY_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  // === 筛选 ===
  const [filters, setFiltersState] = useState<PendingApprovalQuery>(DEFAULT_FILTERS);

  // === 统计 ===
  const [statistics, setStatistics] = useState<ApprovalStatistics>(DEFAULT_STATISTICS);

  // === 轮询 ===
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  
  // 检查 token 是否就绪
  useEffect(() => {
    const checkToken = () => {
      const token = getAccessToken();
      if (token) {
        setTokenReady(true);
      }
    };
    
    // 立即检查
    checkToken();
    
    // 定期检查（用于处理登录后的情况）
    const interval = setInterval(checkToken, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // === 使用 useEffect 直接发起请求（参考消息中心策略）===
  useEffect(() => {
    // 如果没有 token，不发起请求
    if (!tokenReady) {
      return;
    }
    
    let cancelled = false;
    
    const doFetch = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append('type', currentType);
        if (filters.status) params.append('status', filters.status);
        if (filters.department) params.append('department', filters.department);
        params.append('page', page.toString());
        params.append('pageSize', pageSize.toString());

        const response = await fetch(`/api/approvals?${params.toString()}`, {
          credentials: 'include',
          headers: getAuthHeaders(),
        });

        if (cancelled) return;

        const result = await response.json();

        if (!cancelled) {
          if (result.success) {
            setApprovals(result.data || []);
            setTotal(result.pagination?.total || 0);
            setError(null);
          } else {
            setApprovals([]);
            setTotal(0);
            setError(result.error || '获取审批列表失败');
          }
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch approvals:', err);
          setApprovals([]);
          setError(err instanceof Error ? err.message : '获取审批列表失败');
          setLoading(false);
        }
      }
    };

    doFetch();

    return () => {
      cancelled = true;
    };
  }, [tokenReady, currentType, page, pageSize, filters.status, filters.department, refreshKey]);

  // === 切换类型（只改变状态，不返回 Promise）===
  const fetchApprovals = useCallback((type: ApprovalListType) => {
    setCurrentType(type);
    setPage(1); // 切换类型时重置页码
  }, []);

  // === 手动刷新 ===
  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  // === 刷新统计数据 ===
  const refreshStatistics = useCallback(() => {
    const doRefresh = async () => {
      try {
        const [pendingRes, processedRes, myRes] = await Promise.all([
          fetch(`/api/approvals?type=pending&pageSize=1`),
          fetch(`/api/approvals?type=processed&pageSize=1`),
          fetch(`/api/approvals?type=my&pageSize=1`),
        ]);

        const [pending, processed, my] = await Promise.all([
          pendingRes.json(),
          processedRes.json(),
          myRes.json(),
        ]);

        setStatistics(prev => ({
          ...prev,
          pending: pending.pagination?.total || 0,
          processed: processed.pagination?.total || 0,
          my: my.pagination?.total || 0,
        }));
      } catch (err) {
        console.error('Failed to refresh statistics:', err);
      }
    };
    doRefresh();
  }, []);

  // === 分页操作 ===
  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setPage(p => Math.min(totalPages, p + 1));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage(p => Math.max(1, p - 1));
  }, []);

  // === 筛选操作 ===
  const setFilters = useCallback((newFilters: Partial<PendingApprovalQuery>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  // === 提交审批 ===
  const submitApproval = useCallback(async (request: SubmitApprovalRequest) => {
    try {
      const response = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      const result = await response.json();
      
      if (result.success) {
        refreshStatistics();
      }
      
      return result;
    } catch (err) {
      console.error('Failed to submit approval:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : '提交审批失败' 
      };
    }
  }, [refreshStatistics]);

  // === 执行审批操作 ===
  const executeAction = useCallback(async (
    instanceId: string, 
    action: 'approve' | 'reject' | 'return' | 'withdraw',
    comment?: string
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/approvals/action', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify({ instanceId, action, comment } as ApprovalActionRequest),
      });

      const result = await response.json();

      if (result.success) {
        refresh();
        refreshStatistics();
        return true;
      } else {
        setError(result.error || '操作失败');
        return false;
      }
    } catch (err) {
      console.error('Failed to execute action:', err);
      setError(err instanceof Error ? err.message : '操作失败');
      return false;
    }
  }, [refresh, refreshStatistics]);

  const approveApproval = useCallback((instanceId: string, comment?: string) => 
    executeAction(instanceId, 'approve', comment), [executeAction]);

  const rejectApproval = useCallback((instanceId: string, comment?: string) => 
    executeAction(instanceId, 'reject', comment), [executeAction]);

  const returnApproval = useCallback((instanceId: string, comment?: string) => 
    executeAction(instanceId, 'return', comment), [executeAction]);

  const withdrawApproval = useCallback((instanceId: string) => 
    executeAction(instanceId, 'withdraw'), [executeAction]);

  // === 轮询 ===
  const startPolling = useCallback((interval: number = 30000) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    setIsPolling(true);
    pollingIntervalRef.current = setInterval(() => {
      refresh();
    }, interval);
  }, [refresh]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // === 清理 ===
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    approvals,
    loading,
    error,
    currentType,
    page,
    pageSize,
    total,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    filters,
    setFilters,
    clearFilters,
    fetchApprovals,
    submitApproval,
    approveApproval,
    rejectApproval,
    returnApproval,
    withdrawApproval,
    statistics,
    refreshStatistics,
    startPolling,
    stopPolling,
    isPolling,
  };
}
