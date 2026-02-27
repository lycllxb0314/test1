'use client';

import React, { useState, useCallback } from 'react';
import { apiClient } from '@/services/api-client';

/**
 * 批量操作Hook
 * 提供批量选择、批量删除、批量更新等功能
 */

export interface BatchOptions<T> {
  /** API端点 */
  endpoint: string;
  /** 批量删除端点（可选，默认为 ${endpoint}/batch-delete） */
  batchDeleteEndpoint?: string;
  /** 批量更新端点（可选，默认为 ${endpoint}/batch-update） */
  batchUpdateEndpoint?: string;
  /** 操作成功回调 */
  onSuccess?: (action: 'delete' | 'update', count: number) => void;
  /** 操作失败回调 */
  onError?: (error: string) => void;
}

export interface BatchState<T> {
  /** 选中的数据ID列表 */
  selectedIds: string[];
  /** 选中的数据列表 */
  selectedItems: T[];
  /** 是否全选 */
  isAllSelected: boolean;
  /** 是否有选中 */
  hasSelection: boolean;
  /** 操作中状态 */
  processing: boolean;
}

export function useBatchOperations<T extends { id: string }>(options: BatchOptions<T>) {
  const { 
    endpoint, 
    batchDeleteEndpoint = `${endpoint}/batch-delete`,
    batchUpdateEndpoint = `${endpoint}/batch-update`,
    onSuccess, 
    onError 
  } = options;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);

  // 选中数量
  const selectedCount = selectedIds.size;
  const hasSelection = selectedCount > 0;

  // 选择/取消选择单个
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // 全选
  const selectAll = useCallback((items: T[]) => {
    setSelectedIds(new Set(items.map(item => item.id)));
  }, []);

  // 取消全选
  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // 全选/取消全选切换
  const toggleSelectAll = useCallback((items: T[]) => {
    if (selectedIds.size === items.length) {
      deselectAll();
    } else {
      selectAll(items);
    }
  }, [selectedIds.size, selectAll, deselectAll]);

  // 检查是否选中
  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  // 批量删除
  const batchDelete = useCallback(async () => {
    if (selectedIds.size === 0) return false;

    setProcessing(true);
    try {
      const result = await apiClient.post(batchDeleteEndpoint, {
        ids: Array.from(selectedIds),
      }) as { success: boolean; error?: string; data?: { count: number } };

      if (result.success) {
        const count = result.data?.count || selectedIds.size;
        onSuccess?.('delete', count);
        deselectAll();
        return true;
      } else {
        onError?.(result.error || '批量删除失败');
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      onError?.(errorMsg);
      return false;
    } finally {
      setProcessing(false);
    }
  }, [selectedIds, batchDeleteEndpoint, onSuccess, onError, deselectAll]);

  // 批量更新
  const batchUpdate = useCallback(async (updates: Partial<T>) => {
    if (selectedIds.size === 0) return false;

    setProcessing(true);
    try {
      const result = await apiClient.post(batchUpdateEndpoint, {
        ids: Array.from(selectedIds),
        updates,
      }) as { success: boolean; error?: string; data?: { count: number } };

      if (result.success) {
        const count = result.data?.count || selectedIds.size;
        onSuccess?.('update', count);
        deselectAll();
        return true;
      } else {
        onError?.(result.error || '批量更新失败');
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      onError?.(errorMsg);
      return false;
    } finally {
      setProcessing(false);
    }
  }, [selectedIds, batchUpdateEndpoint, onSuccess, onError, deselectAll]);

  // 获取选中的ID数组
  const getSelectedIds = useCallback(() => {
    return Array.from(selectedIds);
  }, [selectedIds]);

  return {
    // 状态
    selectedCount,
    hasSelection,
    processing,
    // 操作
    toggleSelect,
    selectAll,
    deselectAll,
    toggleSelectAll,
    isSelected,
    batchDelete,
    batchUpdate,
    getSelectedIds,
  };
}

/**
 * 批量操作状态栏Props
 */
export interface BatchActionBarProps {
  /** 选中数量 */
  selectedCount: number;
  /** 总数量 */
  totalCount: number;
  /** 全选/取消全选 */
  onSelectAll: () => void;
  /** 取消选择 */
  onDeselectAll: () => void;
  /** 批量删除 */
  onBatchDelete?: () => void;
  /** 批量操作按钮列表 */
  batchActions?: React.ReactNode;
  /** 处理中 */
  processing?: boolean;
}

/**
 * 表格行选择状态
 */
export function useTableRowSelection<T extends { id: string }>() {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const toggleRow = useCallback((id: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const isRowSelected = useCallback((id: string) => {
    return selectedRows.has(id);
  }, [selectedRows]);

  const clearSelection = useCallback(() => {
    setSelectedRows(new Set());
  }, []);

  const selectRows = useCallback((ids: string[]) => {
    setSelectedRows(new Set(ids));
  }, []);

  return {
    selectedRows,
    selectedCount: selectedRows.size,
    toggleRow,
    isRowSelected,
    clearSelection,
    selectRows,
  };
}
