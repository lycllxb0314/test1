import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/services/api-client';

/**
 * 通用数据获取Hook
 * @param endpoint API端点
 * @param params 查询参数
 * @param autoFetch 是否自动获取
 */
export function useDataFetch<T>(
  endpoint: string,
  params?: Record<string, string>,
  autoFetch: boolean = true
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
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
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, [endpoint, params]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 单条数据获取Hook
 */
export function useSingleDataFetch<T>(
  endpoint: string,
  id: string | null,
  autoFetch: boolean = true
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get(`${endpoint}/${id}`) as { success: boolean; data?: T; error?: string };
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || '获取数据失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, [endpoint, id]);

  useEffect(() => {
    if (autoFetch && id) {
      fetchData();
    }
  }, [fetchData, autoFetch, id]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 数据操作Hook（创建、更新、删除）
 */
export function useDataMutation<T, R = T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (
    method: 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: T
  ): Promise<R | null> => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (method === 'POST') {
        result = await apiClient.post(endpoint, data) as { success: boolean; data?: R; error?: string };
      } else if (method === 'PUT') {
        result = await apiClient.put(endpoint, data) as { success: boolean; data?: R; error?: string };
      } else {
        result = await apiClient.delete(endpoint) as { success: boolean; data?: R; error?: string };
      }
      if (result.success && result.data) {
        return result.data;
      }
      setError(result.error || '操作失败');
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
}
