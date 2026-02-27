'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/services/api-client';

/**
 * 通用CRUD操作Hook
 * 提供创建、读取、更新、删除的统一封装
 */

export interface CrudOptions<T> {
  /** API端点 */
  endpoint: string;
  /** 创建成功回调 */
  onCreate?: (data: T) => void;
  /** 更新成功回调 */
  onUpdate?: (data: T) => void;
  /** 删除成功回调 */
  onDelete?: (id: string) => void;
  /** 操作失败回调 */
  onError?: (error: string) => void;
}

export interface CrudState<T> {
  /** 数据列表 */
  data: T[];
  /** 当前选中的数据（用于编辑） */
  selected: T | null;
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
}

export function useCrudOperations<T extends { id: string }>(options: CrudOptions<T>) {
  const { endpoint, onCreate, onUpdate, onDelete, onError } = options;

  const [data, setData] = useState<T[]>([]);
  const [selected, setSelected] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取列表
  const fetchData = useCallback(async (params?: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get(endpoint, params) as { success: boolean; data?: T[]; error?: string };
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || '获取数据失败');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [endpoint, onError]);

  // 创建
  const create = useCallback(async (item: Partial<T>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.post(endpoint, item) as { success: boolean; data?: T; error?: string };
      if (result.success && result.data) {
        setData(prev => [...prev, result.data!]);
        onCreate?.(result.data);
        return true;
      } else {
        setError(result.error || '创建失败');
        onError?.(result.error || '创建失败');
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [endpoint, onCreate, onError]);

  // 更新
  const update = useCallback(async (id: string, item: Partial<T>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.put(`${endpoint}/${id}`, item) as { success: boolean; data?: T; error?: string };
      if (result.success && result.data) {
        setData(prev => prev.map(d => d.id === id ? result.data! : d));
        setSelected(null);
        onUpdate?.(result.data);
        return true;
      } else {
        setError(result.error || '更新失败');
        onError?.(result.error || '更新失败');
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [endpoint, onUpdate, onError]);

  // 删除
  const remove = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.delete(`${endpoint}/${id}`) as { success: boolean; error?: string };
      if (result.success) {
        setData(prev => prev.filter(d => d.id !== id));
        onDelete?.(id);
        return true;
      } else {
        setError(result.error || '删除失败');
        onError?.(result.error || '删除失败');
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [endpoint, onDelete, onError]);

  // 选择数据（用于编辑）
  const select = useCallback((item: T | null) => {
    setSelected(item);
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // 状态
    data,
    selected,
    loading,
    error,
    // 操作
    fetchData,
    create,
    update,
    remove,
    select,
    clearError,
    // 设置数据（用于外部更新）
    setData,
  };
}

/**
 * 通用确认对话框Hook
 */
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<boolean>) | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const confirm = useCallback((
    action: () => Promise<boolean>,
    confirmTitle: string,
    confirmDescription: string
  ) => {
    setPendingAction(() => action);
    setTitle(confirmTitle);
    setDescription(confirmDescription);
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (pendingAction) {
      await pendingAction();
    }
    setIsOpen(false);
    setPendingAction(null);
  }, [pendingAction]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setPendingAction(null);
  }, []);

  return {
    isOpen,
    title,
    description,
    confirm,
    handleConfirm,
    handleCancel,
  };
}
