/**
 * 统一数据获取Hooks
 * 
 * 这是系统中唯一的基础Hook库，所有领域Hooks都应基于此实现。
 * 
 * 设计原则：
 * 1. 统一的API调用模式
 * 2. 自动缓存和重新获取
 * 3. 加载状态和错误处理
 * 4. 条件查询支持
 * 5. 类型安全
 * 
 * 分页架构：
 * - 数据获取：后端全量获取（支持5000+大数据量）
 * - 前端展示：前端分页（用户可选每页10/30/50条）
 * 
 * @module hooks/useApi
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ApiResponse, QueryParams, Pagination } from '@/services/api-client';
import { PAGINATION } from '@/lib/pagination-config';

// 重新导出类型供其他模块使用
export type { ApiResponse, QueryParams, Pagination } from '@/services/api-client';
// 导出分页常量
export { PAGINATION };

// ============================================
// 核心类型定义
// ============================================

/**
 * 查询选项
 */
export interface UseQueryOptions<T = unknown> {
  /** 是否立即执行（默认true） */
  enabled?: boolean;
  /** 依赖项变化时重新获取 */
  deps?: unknown[];
  /** 成功回调 */
  onSuccess?: (data: T) => void;
  /** 错误回调 */
  onError?: (error: string) => void;
  /** 初始数据 */
  initialData?: T | null;
  /** 是否在窗口聚焦时重新获取 */
  refetchOnWindowFocus?: boolean;
  /** 缓存时间（毫秒），0表示不缓存 */
  cacheTime?: number;
}

/**
 * 查询结果
 */
export interface UseQueryResult<T> {
  /** 数据 */
  data: T | null;
  /** 加载中 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 重新获取 */
  refetch: () => Promise<void>;
  /** 数据来源 */
  source: 'database' | 'mock' | null;
  /** 是否正在获取 */
  isFetching: boolean;
}

/**
 * Mutation结果
 */
export interface UseMutationResult<T, P> {
  /** 执行 mutation */
  mutate: (params: P) => Promise<T | null>;
  /** 执行 mutation (mutate的别名，兼容性更好) */
  mutateAsync: (params: P) => Promise<T | null>;
  /** 加载中 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 重置状态 */
  reset: () => void;
  /** 数据 */
  data: T | null;
}

/**
 * 分页查询结果
 */
export interface UsePaginatedResult<T> extends UseQueryResult<T[]> {
  /** 分页信息 */
  pagination: Pagination | null;
  /** 下一页 */
  nextPage: () => void;
  /** 上一页 */
  prevPage: () => void;
  /** 跳转页 */
  goToPage: (page: number) => void;
  /** 设置每页数量 */
  setPageSize: (size: number) => void;
  /** 当前页 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总数 */
  total: number;
  /** 总页数 */
  totalPages: number;
}

// ============================================
// 缓存管理
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  source: 'database' | 'mock';
}

const queryCache = new Map<string, CacheEntry<unknown>>();

function getCachedData<T>(key: string, cacheTime: number): T | null {
  if (cacheTime <= 0) return null;
  
  const entry = queryCache.get(key);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > cacheTime) {
    queryCache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

function setCachedData<T>(key: string, data: T, source: 'database' | 'mock'): void {
  queryCache.set(key, {
    data,
    timestamp: Date.now(),
    source,
  });
}

function getCacheKey(fn: () => Promise<ApiResponse<unknown>>, deps: unknown[]): string {
  return `${fn.toString()}_${JSON.stringify(deps)}`;
}

// ============================================
// 通用查询Hook
// ============================================

/**
 * 通用查询Hook
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data, loading, error, refetch } = useQuery(
 *     () => api.teacher.list({ department: '语文组' }),
 *     { deps: ['语文组'] }
 *   );
 * 
 *   if (loading) return <div>加载中...</div>;
 *   if (error) return <div>错误: {error}</div>;
 *   return <div>{data?.map(t => t.name)}</div>;
 * }
 * ```
 */
export function useQuery<T>(
  queryFn: () => Promise<ApiResponse<T>>,
  options: UseQueryOptions<T> = {}
): UseQueryResult<T> {
  const { 
    enabled = true, 
    deps = [], 
    onSuccess, 
    onError, 
    initialData = null,
    refetchOnWindowFocus = false,
    cacheTime = 0,
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'database' | 'mock' | null>(null);
  
  const mountedRef = useRef(true);
  const cacheKey = getCacheKey(queryFn as () => Promise<ApiResponse<unknown>>, deps);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    // 检查缓存
    if (!forceRefresh && cacheTime > 0) {
      const cached = getCachedData<T>(cacheKey, cacheTime);
      if (cached) {
        setData(cached);
        setSource('database');
        return;
      }
    }

    setLoading(prev => !prev ? true : prev);
    setIsFetching(true);
    setError(null);

    try {
      const response = await queryFn();
      
      if (!mountedRef.current) return;

      if (response.success && response.data !== undefined) {
        setData(response.data);
        setSource(response.source || 'database');
        
        // 更新缓存
        if (cacheTime > 0 && response.source === 'database') {
          setCachedData(cacheKey, response.data, response.source);
        }
        
        onSuccess?.(response.data);
      } else {
        setError(response.error || '获取数据失败');
        onError?.(response.error || '获取数据失败');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setIsFetching(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, cacheKey, cacheTime, ...deps]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  // 窗口聚焦时重新获取
  useEffect(() => {
    if (!refetchOnWindowFocus) return;
    
    const handleFocus = () => {
      fetchData(true);
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchData, refetchOnWindowFocus]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    source,
    isFetching,
  };
}

/**
 * 分页查询Hook
 * 
 * @example
 * ```tsx
 * function StudentList() {
 *   const { data, loading, pagination, nextPage, prevPage, goToPage } = 
 *     usePaginatedQuery((params) => api.student.list(params), { pageSize: 20 });
 * 
 *   return (
 *     <div>
 *       {data?.map(s => <div key={s.id}>{s.name}</div>)}
 *       <button onClick={prevPage} disabled={pagination?.page === 1}>上一页</button>
 *       <span>{pagination?.page} / {pagination?.totalPages}</span>
 *       <button onClick={nextPage} disabled={pagination?.page === pagination?.totalPages}>下一页</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePaginatedQuery<T>(
  queryFn: (params: QueryParams) => Promise<ApiResponse<T[]>>,
  initialParams: QueryParams = {}
): UsePaginatedResult<T> {
  // 分页状态单独管理
  const [page, setPage] = useState(initialParams.page || 1);
  const [pageSize, setPageSizeState] = useState(initialParams.pageSize || 20);
  
  const [data, setData] = useState<T[] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'database' | 'mock' | null>(null);
  
  // 使用 ref 存储 queryFn，避免依赖项变化导致无限循环
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;
  
  // 使用 ref 存储初始参数的非分页部分
  const filterParamsRef = useRef<Omit<QueryParams, 'page' | 'pageSize'>>({});
  
  // 更新筛选参数（排除分页参数）
  const currentFilterParams = { ...initialParams };
  delete currentFilterParams.page;
  delete currentFilterParams.pageSize;
  
  // 检测筛选参数是否变化
  const filterParamsStr = JSON.stringify(currentFilterParams);
  
  useEffect(() => {
    const prevStr = JSON.stringify(filterParamsRef.current);
    if (filterParamsStr !== prevStr) {
      filterParamsRef.current = currentFilterParams;
      // 筛选条件变化时重置页码
      if (page !== 1) {
        setPage(1);
        return; // page 变化会触发重新获取
      }
    }
  }, [filterParamsStr, page, currentFilterParams]);

  // 数据获取
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchData = async () => {
      setLoading(prev => prev ? prev : true);
      setIsFetching(true);
      setError(null);

      try {
        const queryParams: QueryParams = {
          ...filterParamsRef.current,
          page,
          pageSize,
        };
        
        const response = await queryFnRef.current(queryParams);
        
        if (controller.signal.aborted) return;
        
        if (response.success) {
          setData(response.data || []);
          setPagination(response.pagination || null);
          setSource(response.source || null);
        } else {
          setError(response.error || '获取数据失败');
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        const errorMsg = err instanceof Error ? err.message : '未知错误';
        setError(errorMsg);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setIsFetching(false);
        }
      }
    };

    fetchData();
    
    return () => controller.abort();
  }, [page, pageSize, filterParamsStr]);

  const nextPage = useCallback(() => {
    if (pagination && page < pagination.totalPages) {
      setPage(p => p + 1);
    }
  }, [pagination, page]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(p => p - 1);
    }
  }, [page]);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const setPageSize = useCallback((newSize: number) => {
    setPageSizeState(newSize);
    setPage(1);  // 改变每页数量时重置页码
  }, []);

  const refetch = useCallback(async () => {
    setIsFetching(true);
    setError(null);
    
    try {
      const queryParams: QueryParams = {
        ...filterParamsRef.current,
        page,
        pageSize,
      };
      
      const response = await queryFnRef.current(queryParams);
      
      if (response.success) {
        setData(response.data || []);
        setPagination(response.pagination || null);
        setSource(response.source || null);
      } else {
        setError(response.error || '获取数据失败');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [page, pageSize]);

  return {
    data,
    loading,
    error,
    refetch,
    source,
    isFetching,
    pagination,
    nextPage,
    prevPage,
    goToPage,
    setPageSize,
    page,
    pageSize,
    total: pagination?.total || 0,
    totalPages: pagination?.totalPages || 0,
  };
}

// ============================================
// 大数据量获取Hook
// ============================================

/**
 * 大数据量获取配置
 */
export interface UseFetchAllOptions {
  /** 每批次获取数量（默认500） */
  batchSize?: number;
  /** 最大获取数量（默认10000，防止无限获取） */
  maxTotal?: number;
  /** 是否立即执行（默认true） */
  enabled?: boolean;
  /** 成功回调 */
  onSuccess?: (data: unknown[]) => void;
  /** 错误回调 */
  onError?: (error: string) => void;
  /** 依赖项变化时重新获取 */
  deps?: unknown[];
}

/**
 * 大数据量获取结果
 */
export interface UseFetchAllResult<T> {
  /** 数据 */
  data: T[];
  /** 加载中 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 重新获取 */
  refetch: () => Promise<void>;
  /** 是否正在获取 */
  isFetching: boolean;
  /** 总数 */
  total: number;
  /** 是否已获取全部 */
  isComplete: boolean;
}

/**
 * 大数据量获取Hook
 * 
 * 自动分页获取所有数据，适用于需要一次性获取大量数据的场景
 * 支持5000+条数据的自动分批获取
 * 
 * @example
 * ```tsx
 * function TeacherList() {
 *   const { data, loading, total } = useFetchAll<Teacher>(
 *     (page, pageSize) => fetch(`/api/teachers?page=${page}&pageSize=${pageSize}`).then(r => r.json()),
 *     { batchSize: 500 }
 *   );
 *   
 *   return (
 *     <div>
 *       <p>共 {total} 条数据</p>
 *       {loading ? <div>加载中...</div> : data.map(t => <div key={t.id}>{t.name}</div>)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFetchAll<T>(
  fetchFn: (page: number, pageSize: number) => Promise<ApiResponse<T[]>>,
  options: UseFetchAllOptions = {}
): UseFetchAllResult<T> {
  const {
    batchSize = 500,
    maxTotal = 10000,
    enabled = true,
    onSuccess,
    onError,
    deps = [],
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  const mountedRef = useRef(true);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const fetchAllData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    setLoading(prev => forceRefresh ? true : (prev || true));
    setIsFetching(true);
    setError(null);
    setIsComplete(false);

    try {
      let allData: T[] = [];
      let currentPage = 1;
      let totalCount = 0;
      let hasMore = true;

      while (hasMore) {
        const response = await fetchFnRef.current(currentPage, batchSize);
        
        if (!mountedRef.current) return;

        if (!response.success) {
          throw new Error(response.error || '获取数据失败');
        }

        const pageData = response.data || [];
        allData = [...allData, ...pageData];
        
        // 更新总数
        if (response.pagination?.total !== undefined) {
          totalCount = response.pagination.total;
          setTotal(totalCount);
        } else {
          totalCount = allData.length;
          setTotal(totalCount);
        }

        // 判断是否还有更多数据
        hasMore = pageData.length === batchSize && allData.length < totalCount && allData.length < maxTotal;
        currentPage++;

        // 实时更新数据（让用户看到加载进度）
        if (mountedRef.current) {
          setData([...allData]);
        }
      }

      if (mountedRef.current) {
        setIsComplete(true);
        onSuccess?.(allData);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setIsFetching(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, batchSize, maxTotal, ...deps]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAllData();
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchAllData]);

  const refetch = useCallback(async () => {
    await fetchAllData(true);
  }, [fetchAllData]);

  return {
    data,
    loading,
    error,
    refetch,
    isFetching,
    total,
    isComplete,
  };
}

/**
 * 创建API数据获取函数
 * 用于简化useFetchAll的使用
 * 
 * @example
 * ```tsx
 * const fetchTeachers = createFetchAllFn<Teacher>('/api/teachers');
 * 
 * function TeacherList() {
 *   const { data, loading } = useFetchAll(fetchTeachers);
 *   // ...
 * }
 * ```
 */
export function createFetchAllFn<T>(endpoint: string) {
  return async (page: number, pageSize: number): Promise<ApiResponse<T[]>> => {
    const response = await fetch(`${endpoint}?page=${page}&pageSize=${pageSize}`);
    return response.json();
  };
}

// ============================================
// 前端分页Hook
// ============================================

/**
 * 前端分页结果
 */
export interface UseFrontendPaginationResult<T> {
  /** 当前页数据 */
  paginatedData: T[];
  /** 全部数据 */
  allData: T[];
  /** 当前页码 */
  page: number;
  /** 每页显示数量 */
  pageSize: number;
  /** 总数量 */
  total: number;
  /** 总页数 */
  totalPages: number;
  /** 可选的每页数量选项 */
  pageSizeOptions: readonly number[];
  /** 跳转到指定页 */
  goToPage: (page: number) => void;
  /** 上一页 */
  prevPage: () => void;
  /** 下一页 */
  nextPage: () => void;
  /** 设置每页显示数量 */
  setPageSize: (size: number) => void;
  /** 设置全部数据（用于外部更新数据后重新计算分页） */
  setData: (data: T[]) => void;
}

/**
 * 前端分页Hook
 * 
 * 用于全量获取数据后的前端分页展示
 * 支持用户选择每页显示数量（10/30/50）
 * 
 * @example
 * ```tsx
 * function TeacherList() {
 *   const { data, loading } = useFetchAll<Teacher>(fetchTeachers);
 *   const pagination = useFrontendPagination(data, { defaultPageSize: 10 });
 *   
 *   return (
 *     <div>
 *       {pagination.paginatedData.map(t => <div key={t.id}>{t.name}</div>)}
 *       <Pagination
 *         page={pagination.page}
 *         totalPages={pagination.totalPages}
 *         onPageChange={pagination.goToPage}
 *         pageSize={pagination.pageSize}
 *         pageSizeOptions={pagination.pageSizeOptions}
 *         onPageSizeChange={pagination.setPageSize}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function useFrontendPagination<T>(
  data: T[],
  options: {
    /** 默认每页显示数量（默认10） */
    defaultPageSize?: number;
    /** 可选的每页数量选项（默认[10, 30, 50]） */
    pageSizeOptions?: readonly number[];
  } = {}
): UseFrontendPaginationResult<T> {
  const {
    defaultPageSize = PAGINATION.DEFAULT_DISPLAY_PAGE_SIZE,
    pageSizeOptions = PAGINATION.PAGE_SIZE_OPTIONS,
  } = options;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(defaultPageSize);
  const [internalData, setInternalData] = useState<T[]>(data);

  // 当外部数据变化时更新内部数据
  useEffect(() => {
    setInternalData(data);
    // 数据变化时不重置页码，保持用户当前位置（如果有效）
  }, [data]);

  // 计算分页信息
  const total = internalData.length;
  const totalPages = Math.ceil(total / pageSize);

  // 获取当前页数据
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return internalData.slice(start, end);
  }, [internalData, page, pageSize]);

  // 页码变化时确保在有效范围内
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // 跳转到指定页
  const goToPage = useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages || 1));
    setPage(validPage);
  }, [totalPages]);

  // 上一页
  const prevPage = useCallback(() => {
    setPage(p => Math.max(1, p - 1));
  }, []);

  // 下一页
  const nextPage = useCallback(() => {
    setPage(p => Math.min(totalPages, p + 1));
  }, [totalPages]);

  // 设置每页显示数量
  const setPageSize = useCallback((newSize: number) => {
    setPageSizeState(newSize);
    setPage(1); // 重置到第一页
  }, []);

  // 设置全部数据
  const setData = useCallback((newData: T[]) => {
    setInternalData(newData);
    setPage(1); // 重置到第一页
  }, []);

  return {
    paginatedData,
    allData: internalData,
    page,
    pageSize,
    total,
    totalPages,
    pageSizeOptions,
    goToPage,
    prevPage,
    nextPage,
    setPageSize,
    setData,
  };
}

/**
 * Mutation Hook（用于创建、更新、删除操作）
 * 
 * @example
 * ```tsx
 * function CreateTeacherForm() {
 *   const { mutate, loading, error } = useMutation(
 *     (data: Partial<Teacher>) => api.teacher.create(data)
 *   );
 * 
 *   const handleSubmit = async (formData: Partial<Teacher>) => {
 *     const result = await mutate(formData);
 *     if (result) {
 *       alert('创建成功');
 *     }
 *   };
 * 
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useMutation<T, P>(
  mutationFn: (params: P) => Promise<ApiResponse<T>>
): UseMutationResult<T, P> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const mutate = useCallback(async (params: P): Promise<T | null> => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await mutationFn(params);
      
      if (response.success && response.data !== undefined) {
        setData(response.data);
        return response.data;
      } else {
        setError(response.error || '操作失败');
        return null;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [mutationFn]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { mutate, mutateAsync: mutate, loading, error, reset, data };
}

// ============================================
// CRUD操作Hook工厂
// ============================================

/**
 * CRUD操作配置
 */
export interface CrudHookConfig<T> {
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

/**
 * CRUD操作结果
 */
export interface UseCrudResult<T> {
  /** 数据列表 */
  data: T[];
  /** 当前选中项 */
  selected: T | null;
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 获取列表 */
  fetchList: (params?: QueryParams) => Promise<void>;
  /** 创建 */
  create: (item: Partial<T>) => Promise<T | null>;
  /** 更新 */
  update: (id: string, item: Partial<T>) => Promise<T | null>;
  /** 删除 */
  remove: (id: string) => Promise<boolean>;
  /** 选择项 */
  select: (item: T | null) => void;
  /** 清除错误 */
  clearError: () => void;
  /** 设置数据 */
  setData: React.Dispatch<React.SetStateAction<T[]>>;
}

/**
 * 通用CRUD Hook
 * 提供完整的增删改查功能
 */
export function useCrud<T extends { id: string }>(
  config: CrudHookConfig<T>
): UseCrudResult<T> {
  const { endpoint, onCreate, onUpdate, onDelete, onError } = config;
  
  const [data, setData] = useState<T[]>([]);
  const [selected, setSelected] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async (params?: QueryParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/${endpoint}?${new URLSearchParams(params as Record<string, string>)}`);
      const result = await response.json() as ApiResponse<T[]>;
      
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || '获取数据失败');
        onError?.(result.error || '获取数据失败');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '网络错误';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [endpoint, onError]);

  const create = useCallback(async (item: Partial<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const result = await response.json() as ApiResponse<T>;
      
      if (result.success && result.data) {
        setData(prev => [...prev, result.data!]);
        onCreate?.(result.data);
        return result.data;
      } else {
        setError(result.error || '创建失败');
        onError?.(result.error || '创建失败');
        return null;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '网络错误';
      setError(errorMsg);
      onError?.(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [endpoint, onCreate, onError]);

  const update = useCallback(async (id: string, item: Partial<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/${endpoint}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const result = await response.json() as ApiResponse<T>;
      
      if (result.success && result.data) {
        setData(prev => prev.map(d => d.id === id ? result.data! : d));
        onUpdate?.(result.data);
        return result.data;
      } else {
        setError(result.error || '更新失败');
        onError?.(result.error || '更新失败');
        return null;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '网络错误';
      setError(errorMsg);
      onError?.(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [endpoint, onUpdate, onError]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/${endpoint}/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json() as ApiResponse;
      
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
      const errorMsg = err instanceof Error ? err.message : '网络错误';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [endpoint, onDelete, onError]);

  const select = useCallback((item: T | null) => {
    setSelected(item);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
    selected,
    loading,
    error,
    fetchList,
    create,
    update,
    remove,
    select,
    clearError,
    setData,
  };
}

// ============================================
// 领域数据Hooks
// ============================================

import { api } from '@/services/api-client';
import type { 
  Teacher, 
  Student, 
  ClassInfo, 
  LeaveRequest, 
  ScheduleChange, 
  ExpenseReimbursement,
  Room,
  RoomBooking,
  HabitGoal,
  HabitStar,
} from '@/types';

// ========== 教师相关 ==========

/** 教师列表Hook */
export function useTeachers(params?: QueryParams) {
  return useQuery(() => api.teacher.list(params), { deps: [params] });
}

/** 教师详情Hook */
export function useTeacher(id: string | null) {
  return useQuery(
    () => api.teacher.get(id!),
    { enabled: !!id, deps: [id] }
  );
}

/** 教师完整档案Hook */
export function useTeacherProfile(id: string | null) {
  return useQuery(
    () => api.teacher.getFullProfile(id!),
    { enabled: !!id, deps: [id] }
  );
}

/** 创建教师Hook */
export function useCreateTeacher() {
  return useMutation((data: Partial<Teacher>) => api.teacher.create(data));
}

/** 更新教师Hook */
export function useUpdateTeacher() {
  return useMutation(({ id, data }: { id: string; data: Partial<Teacher> }) =>
    api.teacher.update(id, data)
  );
}

/** 删除教师Hook */
export function useDeleteTeacher() {
  return useMutation((id: string) => api.teacher.delete(id));
}

// ========== 学生相关 ==========

/** 学生列表Hook */
export function useStudents(params?: QueryParams) {
  return useQuery(() => api.student.list(params), { deps: [params] });
}

/** 学生详情Hook */
export function useStudent(id: string | null) {
  return useQuery(
    () => api.student.get(id!),
    { enabled: !!id, deps: [id] }
  );
}

/** 学生完整档案Hook */
export function useStudentProfile(id: string | null) {
  return useQuery(
    () => api.student.getFullProfile(id!),
    { enabled: !!id, deps: [id] }
  );
}

/** 学生习惯档案Hook */
export function useStudentHabitProfile(id: string | null) {
  return useQuery(
    () => api.student.getHabitProfile(id!),
    { enabled: !!id, deps: [id] }
  );
}

/** 创建学生Hook */
export function useCreateStudent() {
  return useMutation((data: Partial<Student>) => api.student.create(data));
}

/** 更新学生Hook */
export function useUpdateStudent() {
  return useMutation(({ id, data }: { id: string; data: Partial<Student> }) =>
    api.student.update(id, data)
  );
}

/** 删除学生Hook */
export function useDeleteStudent() {
  return useMutation((id: string) => api.student.delete(id));
}

// ========== 班级相关 ==========

/** 班级列表Hook */
export function useClasses(params?: QueryParams) {
  return useQuery(() => api.class.list(params), { deps: [params] });
}

/** 班级详情Hook */
export function useClass(id: string | null) {
  return useQuery(
    () => api.class.get(id!),
    { enabled: !!id, deps: [id] }
  );
}

/** 班级学生Hook */
export function useClassStudents(classId: string | null) {
  return useQuery(
    () => api.class.getStudents(classId!),
    { enabled: !!classId, deps: [classId] }
  );
}

// ========== 请假调课相关 ==========

/** 请假申请列表Hook */
export function useLeaveRequests(params?: QueryParams) {
  return useQuery(() => api.leaveRequest.list(params), { deps: [params] });
}

/** 创建请假申请Hook */
export function useCreateLeaveRequest() {
  return useMutation((data: Partial<LeaveRequest>) => api.leaveRequest.create(data));
}

/** 调课申请列表Hook */
export function useScheduleChanges(params?: QueryParams) {
  return useQuery(() => api.scheduleChange.list(params), { deps: [params] });
}

/** 创建调课申请Hook */
export function useCreateScheduleChange() {
  return useMutation((data: Partial<ScheduleChange>) => api.scheduleChange.create(data));
}

// ========== 场地预约相关 ==========

/** 场地列表Hook */
export function useRooms(params?: QueryParams) {
  return useQuery(() => api.room.list(params), { deps: [params] });
}

/** 场地预约列表Hook */
export function useRoomBookings(params?: QueryParams) {
  return useQuery(() => api.room.getBookings(params), { deps: [params] });
}

/** 审批预约Hook */
export function useApproveBooking() {
  return useMutation(
    ({ id, approved, comment }: { id: string; approved: boolean; comment?: string }) =>
      api.room.approveBooking(id, approved, comment)
  );
}

// ========== 门禁相关 ==========

/** 门禁记录Hook */
export function useAccessRecords(params?: QueryParams) {
  return useQuery(() => api.access.getRecords(params), { deps: [params] });
}

// ========== 习惯养成相关 ==========

/** 习惯目标列表Hook */
export function useHabitGoals(params?: QueryParams) {
  return useQuery(() => api.habit.getGoals(params), { deps: [params] });
}

/** 习惯之星列表Hook */
export function useHabitStars(month?: string) {
  return useQuery(() => api.habit.getStars(month ? { month } : undefined), { deps: [month] });
}

// ========== 工作流相关 ==========

/** 工作流审批Hook */
export function useWorkflowApprove() {
  return useMutation(
    ({ instanceId, nodeId, approved, comment }: {
      instanceId: string;
      nodeId: string;
      approved: boolean;
      comment?: string;
    }) => api.workflow.approve(instanceId, nodeId, approved, comment)
  );
}

// ============================================
// 统一分页Hook（核心架构）
// ============================================

/**
 * 统一分页Hook选项
 * 
 * 设计理念：
 * - 数据获取：后端全量获取（支持大数据量）
 * - 前端展示：前端分页（用户可选每页10/30/50条）
 * - 一个Hook完成所有操作，简化使用
 */
export interface UsePaginationOptions<T, F = Record<string, unknown>> {
  /** 数据获取函数（接收筛选条件和分页参数，返回数据和总数） */
  fetchFn: (filters: F, page: number, pageSize: number) => Promise<ApiResponse<T[]> & { pagination?: { total: number } }>;
  /** 默认每页显示数量 */
  defaultPageSize?: number;
  /** 每页数量选项 */
  pageSizeOptions?: readonly number[];
  /** 初始筛选条件 */
  initialFilters?: F;
  /** 是否启用 */
  enabled?: boolean;
  /** 数据转换函数 */
  transform?: (data: unknown[]) => T[];
  /** 最大获取数量（用于全量获取） */
  maxTotal?: number;
  /** 依赖项（变化时重新获取） */
  deps?: unknown[];
  /** 成功回调 */
  onSuccess?: (data: T[], total: number) => void;
  /** 错误回调 */
  onError?: (error: string) => void;
}

/**
 * 统一分页Hook结果
 */
export interface UsePaginationResult<T, F = Record<string, unknown>> {
  /** 当前页数据（前端分页后的数据） */
  data: T[];
  /** 全部数据（后端获取的所有数据） */
  allData: T[];
  /** 加载状态 */
  loading: boolean;
  /** 是否正在获取 */
  isFetching: boolean;
  /** 错误信息 */
  error: string | null;
  
  // 分页信息
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  pageSizeOptions: readonly number[];
  
  // 分页操作
  goToPage: (page: number) => void;
  prevPage: () => void;
  nextPage: () => void;
  setPageSize: (size: number) => void;
  
  // 筛选
  filters: F;
  setFilters: (filters: Partial<F>) => void;
  
  // 刷新
  refetch: () => Promise<void>;
}

/**
 * 统一分页Hook
 * 
 * 整合数据获取和前端分页，一个Hook完成所有操作
 * 
 * 架构模式：
 * 1. 后端全量获取数据（支持大数据量分批获取）
 * 2. 前端分页展示（用户可选每页10/30/50条）
 * 3. 支持筛选条件
 * 
 * @example
 * ```tsx
 * // 教师列表页面
 * function TeachersPage() {
 *   const { 
 *     data,           // 当前页数据
 *     loading, 
 *     page, pageSize, total, totalPages,
 *     goToPage, setPageSize,
 *     filters, setFilters,
 *     refetch 
 *   } = usePagination<Teacher, TeacherFilters>({
 *     fetchFn: async (filters, page, pageSize) => {
 *       const params = new URLSearchParams({ ...filters, page, pageSize });
 *       return fetch(`/api/teachers?${params}`).then(r => r.json());
 *     },
 *     initialFilters: { department: 'all' },
 *   });
 * 
 *   return (
 *     <div>
 *       {loading ? <Loading /> : data.map(t => <TeacherCard key={t.id} teacher={t} />)}
 *       <Pagination 
 *         page={page} 
 *         totalPages={totalPages}
 *         onPageChange={goToPage}
 *         pageSize={pageSize}
 *         onPageSizeChange={setPageSize}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function usePagination<T, F = Record<string, unknown>>(
  options: UsePaginationOptions<T, F>
): UsePaginationResult<T, F> {
  const {
    fetchFn,
    defaultPageSize = PAGINATION.DEFAULT_DISPLAY_PAGE_SIZE,
    pageSizeOptions = PAGINATION.PAGE_SIZE_OPTIONS,
    initialFilters = {} as F,
    enabled = true,
    transform,
    maxTotal = PAGINATION.MAX_TOTAL,
    deps = [],
    onSuccess,
    onError,
  } = options;

  // 数据状态
  const [allData, setAllData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 前端分页状态
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(defaultPageSize);

  // 筛选状态
  const [filters, setFiltersState] = useState<F>(initialFilters);

  // 计算总页数
  const totalPages = useMemo(() => Math.ceil(total / pageSize), [total, pageSize]);

  // 当前页数据
  const data = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return allData.slice(start, end);
  }, [allData, page, pageSize]);

  // 引用
  const mountedRef = useRef(true);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  // 获取数据
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    setLoading(prev => forceRefresh ? true : (prev || true));
    setIsFetching(true);
    setError(null);

    try {
      // 使用 maxTotal 作为 pageSize 获取全部数据
      const response = await fetchFnRef.current(filters, 1, maxTotal);

      if (!mountedRef.current) return;

      if (!response.success) {
        throw new Error(response.error || '获取数据失败');
      }

      // 转换数据
      const rawData = response.data || [];
      const transformedData = transform ? transform(rawData) : rawData as T[];
      
      setAllData(transformedData);
      setTotal(response.pagination?.total || transformedData.length);
      
      onSuccess?.(transformedData, response.pagination?.total || transformedData.length);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '获取数据失败';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setIsFetching(false);
      }
    }
  }, [enabled, filters, maxTotal, transform, onSuccess, onError]);

  // 初始化和依赖变化时获取数据
  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  // 筛选变化时重新获取并重置页码
  useEffect(() => {
    setPage(1);
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // 分页操作
  const goToPage = useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages || 1));
    setPage(validPage);
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage(p => Math.max(1, p - 1));
  }, []);

  const nextPage = useCallback(() => {
    setPage(p => Math.min(totalPages, p + 1));
  }, [totalPages]);

  const setPageSize = useCallback((newSize: number) => {
    setPageSizeState(newSize);
    setPage(1); // 重置到第一页
  }, []);

  // 筛选操作
  const setFilters = useCallback((newFilters: Partial<F>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  return {
    // 数据
    data,
    allData,
    loading,
    isFetching,
    error,
    
    // 分页信息
    page,
    pageSize,
    total,
    totalPages,
    pageSizeOptions,
    
    // 分页操作
    goToPage,
    prevPage,
    nextPage,
    setPageSize,
    
    // 筛选
    filters,
    setFilters,
    
    // 刷新
    refetch: () => fetchData(true),
  };
}

// ============================================
// 导出所有
// ============================================

// 类型已在前方定义并导出，此处不再重复导出
