/**
 * 审批流程 Hook v2
 * 
 * 提供完整的审批管理功能：
 * - 获取待审批/已审批/我发起的列表
 * - 提交审批申请
 * - 执行审批操作（通过/驳回/退回/撤回）
 * - 统计数据
 * - 实时轮询更新
 * 
 * @module hooks/useApprovals
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { PAGINATION } from '@/lib/pagination-config';
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
  /** 按类型统计 */
  byType: {
    announcement: number;
    news: number;
    internal_notice: number;
    parent_notice: number;
  };
  /** 按状态统计 */
  byStatus: Record<ApprovalStatus, number>;
}

/** 审批 Hook 返回类型 */
export interface UseApprovalsReturn {
  // === 数据 ===
  approvals: ApprovalInstance[];
  loading: boolean;
  error: string | null;
  currentType: ApprovalListType;

  // === 分页 ===
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;

  // === 筛选 ===
  filters: PendingApprovalQuery;
  setFilters: (filters: Partial<PendingApprovalQuery>) => void;
  clearFilters: () => void;

  // === 操作 ===
  fetchApprovals: (type: ApprovalListType) => Promise<void>;
  submitApproval: (request: SubmitApprovalRequest) => Promise<{ success: boolean; data?: any; error?: string }>;
  approveApproval: (instanceId: string, comment?: string) => Promise<boolean>;
  rejectApproval: (instanceId: string, comment?: string) => Promise<boolean>;
  returnApproval: (instanceId: string, comment?: string) => Promise<boolean>;
  withdrawApproval: (instanceId: string) => Promise<boolean>;

  // === 统计 ===
  statistics: ApprovalStatistics;
  refreshStatistics: () => Promise<void>;

  // === 实时更新 ===
  startPolling: (interval?: number) => void;
  stopPolling: () => void;
  isPolling: boolean;
}

// 默认统计
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

// 默认筛选
const DEFAULT_FILTERS: PendingApprovalQuery = {};

// ==================== Hook 实现 ====================

export function useApprovals(initialType: ApprovalListType = 'pending'): UseApprovalsReturn {
  // === 状态 ===
  const [approvals, setApprovals] = useState<ApprovalInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentType, setCurrentType] = useState<ApprovalListType>(initialType);

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

  // 引用
  const mountedRef = useRef(true);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // === 获取审批列表 ===
  const fetchApprovals = useCallback(async (type: ApprovalListType) => {
    setLoading(true);
    setError(null);
    setCurrentType(type);
    setPage(1); // 切换类型时重置页码

    try {
      const params = new URLSearchParams();
      params.append('type', type);
      if (filters.status) params.append('status', filters.status);
      if (filters.department) params.append('department', filters.department);
      params.append('page', '1');
      params.append('pageSize', pageSize.toString());

      const response = await fetch(`/api/approvals?${params.toString()}`);
      const result = await response.json();

      if (!mountedRef.current) return;

      if (result.success) {
        setApprovals(result.data || []);
        setTotal(result.pagination?.total || 0);
      } else {
        setError(result.error || '获取审批列表失败');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('Failed to fetch approvals:', err);
      setError(err instanceof Error ? err.message : '获取审批列表失败');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [filters, pageSize]);

  // === 刷新统计数据 ===
  const refreshStatistics = useCallback(async () => {
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

      if (!mountedRef.current) return;

      setStatistics(prev => ({
        ...prev,
        pending: pending.pagination?.total || 0,
        processed: processed.pagination?.total || 0,
        my: my.pagination?.total || 0,
      }));
    } catch (err) {
      console.error('Failed to refresh statistics:', err);
    }
  }, []);

  // === 提交审批 ===
  const submitApproval = useCallback(async (request: SubmitApprovalRequest) => {
    try {
      const response = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const result = await response.json();
      
      if (result.success) {
        await refreshStatistics();
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId, action, comment } as ApprovalActionRequest),
      });

      const result = await response.json();

      if (!mountedRef.current) return false;

      if (result.success) {
        await fetchApprovals(currentType);
        await refreshStatistics();
        return true;
      } else {
        setError(result.error || '操作失败');
        return false;
      }
    } catch (err) {
      if (!mountedRef.current) return false;
      console.error('Failed to execute approval action:', err);
      setError(err instanceof Error ? err.message : '操作失败');
      return false;
    }
  }, [currentType, fetchApprovals, refreshStatistics]);

  // === 便捷方法 ===
  const approveApproval = useCallback((instanceId: string, comment?: string) => 
    executeAction(instanceId, 'approve', comment), [executeAction]);

  const rejectApproval = useCallback((instanceId: string, comment?: string) => 
    executeAction(instanceId, 'reject', comment), [executeAction]);

  const returnApproval = useCallback((instanceId: string, comment?: string) => 
    executeAction(instanceId, 'return', comment), [executeAction]);

  const withdrawApproval = useCallback((instanceId: string) => 
    executeAction(instanceId, 'withdraw'), [executeAction]);

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

  // === 轮询 ===
  const startPolling = useCallback((interval: number = 30000) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    setIsPolling(true);
    pollingIntervalRef.current = setInterval(() => {
      fetchApprovals(currentType);
      refreshStatistics();
    }, interval);
  }, [fetchApprovals, currentType, refreshStatistics]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // === 初始加载 ===
  useEffect(() => {
    fetchApprovals(initialType);
    refreshStatistics();
  }, [initialType, page]); // eslint-disable-line react-hooks/exhaustive-deps

  // 清理
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    // 数据
    approvals,
    loading,
    error,
    currentType,
    
    // 分页
    page,
    pageSize,
    total,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    
    // 筛选
    filters,
    setFilters,
    clearFilters,
    
    // 操作
    fetchApprovals,
    submitApproval,
    approveApproval,
    rejectApproval,
    returnApproval,
    withdrawApproval,
    
    // 统计
    statistics,
    refreshStatistics,
    
    // 实时更新
    startPolling,
    stopPolling,
    isPolling,
  };
}

// ==================== 辅助函数 ====================

/** 获取审批状态标签 */
export function getApprovalStatusLabel(status: ApprovalStatus): string {
  const labels: Record<ApprovalStatus, string> = {
    draft: '草稿',
    pending: '待提交',
    in_progress: '审批中',
    approved: '已通过',
    rejected: '已驳回',
    withdrawn: '已撤回',
  };
  return labels[status] || status;
}

/** 获取审批状态颜色 */
export function getApprovalStatusColor(status: ApprovalStatus): string {
  const colors: Record<ApprovalStatus, string> = {
    draft: 'bg-gray-100 text-gray-600',
    pending: 'bg-yellow-100 text-yellow-600',
    in_progress: 'bg-blue-100 text-blue-600',
    approved: 'bg-green-100 text-green-600',
    rejected: 'bg-red-100 text-red-600',
    withdrawn: 'bg-gray-100 text-gray-600',
  };
  return colors[status] || 'bg-gray-100 text-gray-600';
}

/** 获取审批状态图标 */
export function getApprovalStatusIcon(status: ApprovalStatus): string {
  const icons: Record<ApprovalStatus, string> = {
    draft: '📝',
    pending: '⏳',
    in_progress: '🔄',
    approved: '✅',
    rejected: '❌',
    withdrawn: '↩️',
  };
  return icons[status] || '📋';
}

/** 检查当前用户是否可以审批 */
export function canUserApprove(
  instance: ApprovalInstance, 
  userId: string
): boolean {
  if (instance.status !== 'in_progress') return false;
  
  const currentNode = instance.nodeRecords?.find(
    n => n.nodeOrder === instance.currentNodeOrder
  );
  
  if (!currentNode || currentNode.status !== 'pending') return false;
  
  const approverIds = currentNode.approverIds || [];
  const approvedBy = currentNode.approvedBy || [];
  const approvedUserIds = approvedBy.map(a => a.userId);
  
  return approverIds.includes(userId) && !approvedUserIds.includes(userId);
}

/** 检查当前用户是否可以撤回 */
export function canUserWithdraw(
  instance: ApprovalInstance, 
  userId: string
): boolean {
  return instance.applicantId === userId && instance.status === 'in_progress';
}

/** 检查当前用户是否可以查看详情 */
export function canUserView(
  instance: ApprovalInstance, 
  userId: string
): boolean {
  // 申请人可以查看
  if (instance.applicantId === userId) return true;
  
  // 审批人可以查看
  const allApproverIds = instance.nodeRecords?.flatMap(n => n.approverIds || []) || [];
  if (allApproverIds.includes(userId)) return true;
  
  return false;
}

/** 获取审批类型标签 */
export function getApprovalTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    announcement: '校园公告',
    news: '新闻动态',
    internal_notice: '内部通知',
    parent_notice: '家长通知',
  };
  return labels[type] || type;
}

/** 获取审批类型颜色 */
export function getApprovalTypeColor(type: string): string {
  const colors: Record<string, string> = {
    announcement: 'bg-blue-100 text-blue-600',
    news: 'bg-purple-100 text-purple-600',
    internal_notice: 'bg-orange-100 text-orange-600',
    parent_notice: 'bg-green-100 text-green-600',
  };
  return colors[type] || 'bg-gray-100 text-gray-600';
}
