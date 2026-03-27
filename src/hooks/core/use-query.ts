/**
 * 数据获取Hook - 核心实现
 * 
 * 六层架构中的第五层（Hook层）
 * 作为React框架与API Client层的适配器
 * 
 * 职责：
 * - 状态管理 (useState, useReducer)
 * - 副作用处理 (useEffect)
 * - 缓存控制
 * - 响应式数据获取
 * 
 * @module hooks/core/use-query
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ApiResponse, QueryParams, ListResponse } from '@/lib/api-client/types';

// ============================================
// 类型定义
// ============================================

/**
 * 查询状态
 */
export type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * 查询选项
 */
export interface QueryOptions {
  /** 是否立即执行 */
  enabled?: boolean;
  /** 刷新间隔（毫秒） */
  refetchInterval?: number;
  /** 窗口聚焦时刷新 */
  refetchOnWindowFocus?: boolean;
  /** 成功回调 */
  onSuccess?: (data: unknown) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
  /** 缓存键 */
  cacheKey?: string;
  /** 过期时间（毫秒） */
  staleTime?: number;
}

/**
 * 分页查询选项
 */
export interface PaginatedQueryOptions extends QueryOptions {
  /** 当前页 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
}

/**
 * 查询结果
 */
export interface QueryResult<T> {
  /** 数据 */
  data: T | null;
  /** 错误 */
  error: Error | null;
  /** 状态 */
  status: QueryStatus;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 是否正在获取 */
  isFetching: boolean;
  /** 是否成功 */
  isSuccess: boolean;
  /** 是否失败 */
  isError: boolean;
  /** 是否空闲 */
  isIdle: boolean;
  /** 重新获取 */
  refetch: () => Promise<void>;
}

/**
 * 分页查询结果
 */
export interface PaginatedQueryResult<T> extends Omit<QueryResult<T[]>, 'data'> {
  /** 数据列表 */
  data: T[];
  /** 分页信息 */
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  /** 下一页 */
  nextPage: () => void;
  /** 上一页 */
  prevPage: () => void;
  /** 跳转页 */
  goToPage: (page: number) => void;
  /** 设置每页数量 */
  setPageSize: (size: number) => void;
}

/**
 * 变更结果
 */
export interface MutationResult<T, P> {
  /** 执行变更 */
  mutate: (params: P) => Promise<T | null>;
  /** 异步执行 */
  mutateAsync: (params: P) => Promise<T>;
  /** 数据 */
  data: T | null;
  /** 错误 */
  error: Error | null;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 是否成功 */
  isSuccess: boolean;
  /** 是否失败 */
  isError: boolean;
  /** 重置状态 */
  reset: () => void;
}

// ============================================
// 简单内存缓存
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const queryCache = new Map<string, CacheEntry<unknown>>();

function getCachedData<T>(key: string, staleTime: number): T | null {
  const entry = queryCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > staleTime) {
    queryCache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCachedData<T>(key: string, data: T): void {
  queryCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

function invalidateCache(pattern: string): void {
  for (const key of queryCache.keys()) {
    if (key.startsWith(pattern)) {
      queryCache.delete(key);
    }
  }
}

// ============================================
// 核心Hooks
// ============================================

/**
 * 通用数据查询Hook
 */
export function useQuery<T>(
  queryKey: string,
  fetcher: () => Promise<ApiResponse<T>>,
  options: QueryOptions = {}
): QueryResult<T> {
  const {
    enabled = true,
    refetchInterval,
    refetchOnWindowFocus = true,
    onSuccess,
    onError,
    cacheKey,
    staleTime = 0,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<QueryStatus>('idle');
  const [isFetching, setIsFetching] = useState(false);

  const mountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // 检查缓存
    const key = cacheKey || queryKey;
    if (staleTime > 0) {
      const cached = getCachedData<T>(key, staleTime);
      if (cached) {
        setData(cached);
        setStatus('success');
        return;
      }
    }

    setIsFetching(true);

    try {
      const response = await fetcher();

      if (!mountedRef.current) return;

      if (response.success && response.data !== undefined) {
        setData(response.data);
        setError(null);
        setStatus('success');

        // 设置缓存
        if (staleTime > 0) {
          setCachedData(key, response.data);
        }

        onSuccess?.(response.data);
      } else {
        throw new Error(response.error || '请求失败');
      }
    } catch (err) {
      if (!mountedRef.current) return;

      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setStatus('error');
      onError?.(error);
    } finally {
      if (mountedRef.current) {
        setIsFetching(false);
      }
    }
  }, [enabled, fetcher, cacheKey, staleTime, onSuccess, onError, queryKey]);

  // 初始加载
  useEffect(() => {
    mountedRef.current = true;

    if (enabled) {
      setStatus('loading');
      fetchData();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [enabled, fetchData]);

  // 定时刷新
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(fetchData, refetchInterval);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled, fetchData]);

  // 窗口聚焦刷新
  useEffect(() => {
    if (refetchOnWindowFocus && enabled) {
      const handleFocus = () => fetchData();
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [refetchOnWindowFocus, enabled, fetchData]);

  return {
    data,
    error,
    status,
    isLoading: status === 'loading',
    isFetching,
    isSuccess: status === 'success',
    isError: status === 'error',
    isIdle: status === 'idle',
    refetch: fetchData,
  };
}

/**
 * 分页数据查询Hook
 */
export function usePaginatedQuery<T>(
  queryKey: string,
  fetcher: (params: QueryParams) => Promise<ApiResponse<ListResponse<T>>>,
  options: PaginatedQueryOptions = {}
): PaginatedQueryResult<T> {
  const {
    page = 1,
    pageSize = 10,
    ...queryOptions
  } = options;

  const [currentPage, setCurrentPage] = useState(page);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [totalItems, setTotalItems] = useState(0);
  const [items, setItems] = useState<T[]>([]);

  const fetchData = useCallback(async () => {
    const response = await fetcher({
      page: currentPage,
      pageSize: currentPageSize,
    });
    
    if (response.success && response.data) {
      setItems(response.data.data);
      setTotalItems(response.data.pagination.total);
    }
    
    return response;
  }, [fetcher, currentPage, currentPageSize]);

  const result = useQuery<ListResponse<T>>(
    `${queryKey}-${currentPage}-${currentPageSize}`,
    fetchData,
    queryOptions
  );

  const totalPages = Math.ceil(totalItems / currentPageSize);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  }, [currentPage]);

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages]
  );

  const handleSetPageSize = useCallback((size: number) => {
    setCurrentPageSize(size);
    setCurrentPage(1); // 重置到第一页
  }, []);

  return {
    data: items,
    error: result.error,
    status: result.status,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    isSuccess: result.isSuccess,
    isError: result.isError,
    isIdle: result.isIdle,
    refetch: result.refetch,
    pagination: {
      page: currentPage,
      pageSize: currentPageSize,
      total: totalItems,
      totalPages,
    },
    nextPage,
    prevPage,
    goToPage,
    setPageSize: handleSetPageSize,
  };
}

/**
 * 数据变更Hook
 */
export function useMutation<T, P>(
  mutationFn: (params: P) => Promise<ApiResponse<T>>,
  options: {
    onSuccess?: (data: T, params: P) => void;
    onError?: (error: Error, params: P) => void;
    /** 成功后使缓存失效 */
    invalidateKeys?: string[];
  } = {}
): MutationResult<T, P> {
  const { onSuccess, onError, invalidateKeys } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const mutate = useCallback(
    async (params: P): Promise<T | null> => {
      setIsLoading(true);
      setIsSuccess(false);
      setIsError(false);
      setError(null);

      try {
        const response = await mutationFn(params);

        if (!mountedRef.current) return null;

        if (response.success) {
          const responseData = response.data;
          if (responseData !== undefined && responseData !== null) {
            setData(responseData);
            setIsSuccess(true);
            onSuccess?.(responseData, params);

            // 使缓存失效
            if (invalidateKeys) {
              invalidateKeys.forEach(invalidateCache);
            }

            return responseData;
          }
        }
        throw new Error(response.error || '操作失败');
      } catch (err) {
        if (!mountedRef.current) return null;

        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsError(true);
        onError?.(error, params);
        return null;
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [mutationFn, onSuccess, onError, invalidateKeys]
  );

  const mutateAsync = useCallback(
    async (params: P): Promise<T> => {
      const result = await mutate(params);
      if (result === null) {
        throw new Error('操作失败');
      }
      return result;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutate]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setIsSuccess(false);
    setIsError(false);
  }, []);

  return {
    mutate,
    mutateAsync,
    data,
    error,
    isLoading,
    isSuccess,
    isError,
    reset,
  };
}

/**
 * 缓存控制Hook
 */
export function useQueryClient() {
  return {
    invalidateQueries: (pattern: string) => invalidateCache(pattern),
    clearCache: () => queryCache.clear(),
    getCacheSize: () => queryCache.size,
  };
}
