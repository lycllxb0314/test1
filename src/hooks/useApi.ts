/**
 * 统一数据获取Hooks
 * 
 * 设计原则：
 * 1. 统一的API调用模式
 * 2. 自动缓存和重新获取
 * 3. 加载状态和错误处理
 * 4. 条件查询支持
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ApiResponse, QueryParams, Pagination } from '@/services/api-client';

// ============================================
// 核心类型定义
// ============================================

export interface UseQueryOptions {
  /** 是否立即执行 */
  enabled?: boolean;
  /** 依赖项变化时重新获取 */
  deps?: unknown[];
  /** 成功回调 */
  onSuccess?: (data: unknown) => void;
  /** 错误回调 */
  onError?: (error: string) => void;
  /** 初始数据 */
  initialData?: unknown;
}

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
}

export interface UseMutationResult<T, P> {
  /** 执行 mutation */
  mutate: (params: P) => Promise<T | null>;
  /** 加载中 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 重置状态 */
  reset: () => void;
}

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
}

// ============================================
// 通用查询Hook
// ============================================

/**
 * 通用查询Hook
 */
export function useQuery<T>(
  queryFn: () => Promise<ApiResponse<T>>,
  options: UseQueryOptions = {}
): UseQueryResult<T> {
  const { enabled = true, deps = [], onSuccess, onError, initialData = null } = options;

  const [data, setData] = useState<T | null>(initialData as T);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'database' | 'mock' | null>(null);
  
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await queryFn();
      
      if (!mountedRef.current) return;

      if (response.success && response.data !== undefined) {
        setData(response.data);
        setSource(response.source || null);
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
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    source,
  };
}

/**
 * 分页查询Hook
 */
export function usePaginatedQuery<T>(
  queryFn: (params: QueryParams) => Promise<ApiResponse<T[]>>,
  initialParams: QueryParams = {}
): UsePaginatedResult<T> {
  const [params, setParams] = useState<QueryParams>({
    page: 1,
    pageSize: 20,
    ...initialParams,
  });
  
  const [data, setData] = useState<T[] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'database' | 'mock' | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await queryFn(params);
      
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
    }
  }, [params, queryFn]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const nextPage = useCallback(() => {
    if (pagination && params.page && params.page < pagination.totalPages) {
      setParams(prev => ({ ...prev, page: (prev.page || 1) + 1 }));
    }
  }, [pagination, params.page]);

  const prevPage = useCallback(() => {
    if (params.page && params.page > 1) {
      setParams(prev => ({ ...prev, page: (prev.page || 1) - 1 }));
    }
  }, [params.page]);

  const goToPage = useCallback((page: number) => {
    setParams(prev => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setParams(prev => ({ ...prev, pageSize, page: 1 }));
  }, []);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    source,
    pagination,
    nextPage,
    prevPage,
    goToPage,
    setPageSize,
  };
}

/**
 * Mutation Hook（用于创建、更新、删除操作）
 */
export function useMutation<T, P>(
  mutationFn: (params: P) => Promise<ApiResponse<T>>
): UseMutationResult<T, P> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (params: P): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await mutationFn(params);
      
      if (response.success && response.data !== undefined) {
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
  }, []);

  return { mutate, loading, error, reset };
}

// ============================================
// 领域数据Hooks
// ============================================

import { api } from '@/services/api-client';
import type { Teacher, Student, ClassInfo, LeaveRequest, ScheduleChange } from '@/types';

/**
 * 教师列表Hook
 */
export function useTeachers(params?: QueryParams) {
  return useQuery(() => api.teacher.list(params), { deps: [params] });
}

/**
 * 教师详情Hook
 */
export function useTeacher(id: string | null) {
  return useQuery(
    () => api.teacher.get(id!),
    { enabled: !!id, deps: [id] }
  );
}

/**
 * 教师完整档案Hook
 */
export function useTeacherProfile(id: string | null) {
  return useQuery(
    () => api.teacher.getFullProfile(id!),
    { enabled: !!id, deps: [id] }
  );
}

/**
 * 学生列表Hook
 */
export function useStudents(params?: QueryParams) {
  return useQuery(() => api.student.list(params), { deps: [params] });
}

/**
 * 学生详情Hook
 */
export function useStudent(id: string | null) {
  return useQuery(
    () => api.student.get(id!),
    { enabled: !!id, deps: [id] }
  );
}

/**
 * 学生完整档案Hook
 */
export function useStudentProfile(id: string | null) {
  return useQuery(
    () => api.student.getFullProfile(id!),
    { enabled: !!id, deps: [id] }
  );
}

/**
 * 学生习惯档案Hook
 */
export function useStudentHabitProfile(id: string | null) {
  return useQuery(
    () => api.student.getHabitProfile(id!),
    { enabled: !!id, deps: [id] }
  );
}

/**
 * 班级列表Hook
 */
export function useClasses(params?: QueryParams) {
  return useQuery(() => api.class.list(params), { deps: [params] });
}

/**
 * 班级详情Hook
 */
export function useClass(id: string | null) {
  return useQuery(
    () => api.class.get(id!),
    { enabled: !!id, deps: [id] }
  );
}

/**
 * 班级学生Hook
 */
export function useClassStudents(classId: string | null) {
  return useQuery(
    () => api.class.getStudents(classId!),
    { enabled: !!classId, deps: [classId] }
  );
}

/**
 * 请假申请列表Hook
 */
export function useLeaveRequests(params?: QueryParams) {
  return useQuery(() => api.leaveRequest.list(params), { deps: [params] });
}

/**
 * 调课申请列表Hook
 */
export function useScheduleChanges(params?: QueryParams) {
  return useQuery(() => api.scheduleChange.list(params), { deps: [params] });
}

/**
 * 场地列表Hook
 */
export function useRooms(params?: QueryParams) {
  return useQuery(() => api.room.list(params), { deps: [params] });
}

/**
 * 场地预约列表Hook
 */
export function useRoomBookings(params?: QueryParams) {
  return useQuery(() => api.room.getBookings(params), { deps: [params] });
}

/**
 * 门禁记录Hook
 */
export function useAccessRecords(params?: QueryParams) {
  return useQuery(() => api.access.getRecords(params), { deps: [params] });
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * 创建教师Hook
 */
export function useCreateTeacher() {
  return useMutation((data: Partial<Teacher>) => api.teacher.create(data));
}

/**
 * 更新教师Hook
 */
export function useUpdateTeacher() {
  return useMutation(({ id, data }: { id: string; data: Partial<Teacher> }) =>
    api.teacher.update(id, data)
  );
}

/**
 * 删除教师Hook
 */
export function useDeleteTeacher() {
  return useMutation((id: string) => api.teacher.delete(id));
}

/**
 * 创建学生Hook
 */
export function useCreateStudent() {
  return useMutation((data: Partial<Student>) => api.student.create(data));
}

/**
 * 更新学生Hook
 */
export function useUpdateStudent() {
  return useMutation(({ id, data }: { id: string; data: Partial<Student> }) =>
    api.student.update(id, data)
  );
}

/**
 * 删除学生Hook
 */
export function useDeleteStudent() {
  return useMutation((id: string) => api.student.delete(id));
}

/**
 * 创建请假申请Hook
 */
export function useCreateLeaveRequest() {
  return useMutation((data: Partial<LeaveRequest>) => api.leaveRequest.create(data));
}

/**
 * 创建调课申请Hook
 */
export function useCreateScheduleChange() {
  return useMutation((data: Partial<ScheduleChange>) => api.scheduleChange.create(data));
}

/**
 * 审批预约Hook
 */
export function useApproveBooking() {
  return useMutation(
    ({ id, approved, comment }: { id: string; approved: boolean; comment?: string }) =>
      api.room.approveBooking(id, approved, comment)
  );
}

/**
 * 工作流审批Hook
 */
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
