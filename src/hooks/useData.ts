/**
 * 统一数据获取Hooks
 * 
 * @deprecated 此文件已废弃，请使用 '@/hooks/useApi' 中的统一Hooks
 * 
 * 迁移指南：
 * - useData → useQuery
 * - useList → usePaginatedQuery
 * - useUsers → useTeachers 或自定义查询
 * - useTeacher/useTeachers → 直接从 useApi 导入
 * - useStudent/useStudents → 直接从 useApi 导入
 * - useClass/useClasses → 直接从 useApi 导入
 * 
 * @example
 * // 旧代码
 * import { useTeachers } from '@/hooks/useData';
 * const { data, isLoading } = useTeachers();
 * 
 * // 新代码
 * import { useTeachers } from '@/hooks/useApi';
 * const { data, loading } = useTeachers();
 */

// 重新导出统一Hooks以保持向后兼容
export {
  // 基础Hooks
  useQuery,
  usePaginatedQuery,
  useMutation,
  useCrud,
  
  // 类型
  type UseQueryOptions,
  type UseQueryResult,
  type UseMutationResult,
  type UsePaginatedResult,
  
  // 领域Hooks
  useTeachers,
  useTeacher,
  useTeacherProfile,
  useCreateTeacher,
  useUpdateTeacher,
  useDeleteTeacher,
  useStudents,
  useStudent,
  useStudentProfile,
  useStudentHabitProfile,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
  useClasses,
  useClass,
  useClassStudents,
  useLeaveRequests,
  useCreateLeaveRequest,
  useScheduleChanges,
  useCreateScheduleChange,
  useRooms,
  useRoomBookings,
  useApproveBooking,
  useAccessRecords,
  useExpenses,
  useExpense,
  useExpenseStatistics,
  useCreateExpense,
  useUpdateExpense,
  useSubmitExpense,
  useDeleteExpense,
  useApproveExpense,
  useProcessExpense,
  useHabitGoals,
  useHabitStars,
  useWorkflowApprove,
} from './useApi';

// 内部实现（已废弃，仅用于类型兼容）
import { useState, useEffect, useCallback } from 'react';
import { apiClient, type QueryParams, type ApiResponse, type Pagination, type PaginatedResponse } from '@/services/api-client';

/** @deprecated 使用 useQuery 代替 */
interface UseDataResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/** @deprecated 使用 usePaginatedQuery 代替 */
interface UseListResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/** @deprecated 使用 useQuery 代替 */
function useData<T>(
  fetcher: () => Promise<ApiResponse<T>>,
  deps: unknown[] = []
): UseDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetcher();
      if (result.success && result.data !== undefined) {
        setData(result.data);
      } else {
        setError(result.error || '获取数据失败');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '网络错误');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, JSON.stringify(deps)]);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(deps)]);

  return { data, isLoading, error, refetch: fetchData };
}

/** @deprecated 使用 usePaginatedQuery 代替 */
function useList<T>(
  fetcher: () => Promise<ApiResponse<T[] | PaginatedResponse<T>>>,
  deps: unknown[] = []
): UseListResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetcher();
      if (result.success && result.data) {
        if (Array.isArray(result.data)) {
          setData(result.data);
          setTotal(result.pagination?.total || result.data.length);
          setPage(result.pagination?.page || 1);
          setPageSize(result.pagination?.pageSize || 20);
          setTotalPages(result.pagination?.totalPages || 1);
        } else if ('data' in result.data && Array.isArray(result.data.data)) {
          setData(result.data.data);
          setTotal(result.data.total || result.pagination?.total || 0);
          setPage(result.data.page || result.pagination?.page || 1);
          setPageSize(result.data.pageSize || result.pagination?.pageSize || 20);
          setTotalPages(result.data.totalPages || result.pagination?.totalPages || 1);
        }
      } else {
        setError(result.error || '获取数据失败');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '网络错误');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, JSON.stringify(deps)]);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(deps)]);

  return { 
    data, 
    total, 
    page, 
    pageSize, 
    totalPages, 
    isLoading, 
    error, 
    refetch: fetchData 
  };
}

export { useData, useList };
