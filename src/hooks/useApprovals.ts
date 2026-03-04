/**
 * 审批流程 Hook
 * 
 * 提供完整的审批管理功能：
 * - 获取待审批/已审批/我发起的列表
 * - 提交审批申请
 * - 执行审批操作
 * - 撤回审批
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PAGINATION } from '@/lib/pagination-config';
import type {
  ApprovalInstance,
  ApprovalStatus,
  SubmitApprovalRequest,
  ApprovalActionRequest,
  PendingApprovalQuery,
  Announcement,
} from '@/types/approval';

// ==================== 类型定义 ====================

/** 审批列表类型 */
export type ApprovalListType = 'pending' | 'processed' | 'my';

/** 审批 Hook 返回类型 */
export interface UseApprovalsReturn {
  // === 数据 ===
  approvals: ApprovalInstance[];
  loading: boolean;
  error: string | null;

  // === 分页 ===
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  goToPage: (page: number) => void;

  // === 筛选 ===
  filters: PendingApprovalQuery;
  setFilters: (filters: Partial<PendingApprovalQuery>) => void;

  // === 操作 ===
  fetchApprovals: (type: ApprovalListType) => Promise<void>;
  submitApproval: (request: SubmitApprovalRequest) => Promise<{ success: boolean; data?: any; error?: string }>;
  approveApproval: (instanceId: string, comment?: string) => Promise<boolean>;
  rejectApproval: (instanceId: string, comment?: string) => Promise<boolean>;
  returnApproval: (instanceId: string, comment?: string) => Promise<boolean>;
  withdrawApproval: (instanceId: string) => Promise<boolean>;

  // === 统计 ===
  statistics: {
    pending: number;
    processed: number;
    my: number;
  };
  refreshStatistics: () => Promise<void>;
}

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
  const [filters, setFiltersState] = useState<PendingApprovalQuery>({});

  // === 统计 ===
  const [statistics, setStatistics] = useState({
    pending: 0,
    processed: 0,
    my: 0,
  });

  const totalPages = Math.ceil(total / pageSize);

  // === 获取审批列表 ===
  const fetchApprovals = useCallback(async (type: ApprovalListType) => {
    setLoading(true);
    setError(null);
    setCurrentType(type);

    try {
      const params = new URLSearchParams();
      params.append('type', type);
      if (filters.status) params.append('status', filters.status);
      if (filters.department) params.append('department', filters.department);
      params.append('page', '1'); // 始终从第一页开始
      params.append('pageSize', pageSize.toString());

      const response = await fetch(`/api/approvals?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setApprovals(result.data || []);
        setTotal(result.pagination?.total || 0);
      } else {
        setError(result.error || '获取审批列表失败');
      }
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
      setError(err instanceof Error ? err.message : '获取审批列表失败');
    } finally {
      setLoading(false);
    }
  }, [filters, pageSize]); // 移除 page 依赖，因为总是从第一页开始

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

      setStatistics({
        pending: pending.pagination?.total || 0,
        processed: processed.pagination?.total || 0,
        my: my.pagination?.total || 0,
      });
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

      if (result.success) {
        await fetchApprovals(currentType);
        await refreshStatistics();
        return true;
      } else {
        setError(result.error || '操作失败');
        return false;
      }
    } catch (err) {
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
    setPage(Math.max(1, Math.min(newPage, totalPages || 1)));
  }, [totalPages]);

  // === 筛选操作 ===
  const setFilters = useCallback((newFilters: Partial<PendingApprovalQuery>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  // === 初始加载 ===
  useEffect(() => {
    fetchApprovals(initialType);
    refreshStatistics();
  }, [initialType, page]); // eslint-disable-line react-hooks/exhaustive-deps

  // === 类型切换时重新加载 ===
  useEffect(() => {
    // 当 fetchApprovals 被调用时（通过按钮点击），会自动触发
  }, [currentType]);

  return {
    approvals,
    loading,
    error,
    page,
    pageSize,
    total,
    totalPages,
    goToPage,
    filters,
    setFilters,
    fetchApprovals,
    submitApproval,
    approveApproval,
    rejectApproval,
    returnApproval,
    withdrawApproval,
    statistics,
    refreshStatistics,
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
