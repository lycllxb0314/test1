/**
 * 统一数据获取Hooks
 * 提供类型安全的数据获取和缓存能力
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient, type QueryParams, type PaginatedResponse, type ApiResponse } from '@/lib/api-helpers';
import type {
  User,
  Teacher,
  Student,
  ClassInfo,
  Room,
  RoomBooking,
  HabitGoal,
  StudentMonthlyGoal,
  HabitAssessment,
  HabitStar,
  StudentHabitProfile,
  ClassHabitStats,
  ResearchActivity,
  CollectivePreparation,
  LessonObservation,
  TeacherResearchProfile,
  WorkflowConfig,
  WorkflowInstance,
} from '@/types';

// ============================================
// 通用Hook工厂函数
// ============================================

interface UseDataResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

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

/**
 * 通用单条数据获取Hook
 */
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
  }, [fetcher]);

  useEffect(() => {
    fetchData();
  }, deps);

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * 通用列表数据获取Hook
 */
function useList<T>(
  fetcher: () => Promise<ApiResponse<PaginatedResponse<T>>>,
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
        setData(result.data.data || []);
        setTotal(result.data.total || 0);
        setPage(result.data.page || 1);
        setPageSize(result.data.pageSize || 20);
        setTotalPages(result.data.totalPages || 0);
      } else {
        setError(result.error || '获取数据失败');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '网络错误');
    } finally {
      setIsLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    fetchData();
  }, deps);

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

// ============================================
// 用户相关 Hooks
// ============================================

export function useUsers(params?: QueryParams): UseListResult<User> {
  return useList(() => apiClient.get<PaginatedResponse<User>>('/users', params), [JSON.stringify(params)]);
}

export function useUser(id: string): UseDataResult<User> {
  return useData(() => apiClient.get<User>(`/users/${id}`), [id]);
}

// ============================================
// 教师相关 Hooks
// ============================================

export function useTeachers(params?: QueryParams): UseListResult<Teacher> {
  return useList(() => apiClient.get<PaginatedResponse<Teacher>>('/teachers', params), [JSON.stringify(params)]);
}

export function useTeacher(id: string): UseDataResult<Teacher> {
  return useData(() => apiClient.get<Teacher>(`/teachers/${id}`), [id]);
}

export function useTeacherProfile(id: string): UseDataResult<TeacherResearchProfile> {
  return useData(() => apiClient.get<TeacherResearchProfile>(`/teachers/${id}/profile`), [id]);
}

// ============================================
// 学生相关 Hooks
// ============================================

export function useStudents(params?: QueryParams): UseListResult<Student> {
  return useList(() => apiClient.get<PaginatedResponse<Student>>('/students', params), [JSON.stringify(params)]);
}

export function useStudent(id: string): UseDataResult<Student> {
  return useData(() => apiClient.get<Student>(`/students/${id}`), [id]);
}

export function useStudentHabitProfile(id: string): UseDataResult<StudentHabitProfile> {
  return useData(() => apiClient.get<StudentHabitProfile>(`/students/${id}/habit-profile`), [id]);
}

// ============================================
// 班级相关 Hooks
// ============================================

export function useClasses(params?: QueryParams): UseListResult<ClassInfo> {
  return useList(() => apiClient.get<PaginatedResponse<ClassInfo>>('/classes', params), [JSON.stringify(params)]);
}

export function useClass(id: string): UseDataResult<ClassInfo> {
  return useData(() => apiClient.get<ClassInfo>(`/classes/${id}`), [id]);
}

export function useClassStudents(classId: string): UseListResult<Student> {
  return useList(() => apiClient.get<PaginatedResponse<Student>>(`/classes/${classId}/students`), [classId]);
}

export function useClassHabitStats(classId: string, month: string): UseDataResult<ClassHabitStats> {
  return useData(() => apiClient.get<ClassHabitStats>(`/classes/${classId}/habit-stats`, { month }), [classId, month]);
}

// ============================================
// 教室相关 Hooks
// ============================================

export function useRooms(params?: QueryParams): UseListResult<Room> {
  return useList(() => apiClient.get<PaginatedResponse<Room>>('/rooms', params), [JSON.stringify(params)]);
}

export function useRoom(id: string): UseDataResult<Room> {
  return useData(() => apiClient.get<Room>(`/rooms/${id}`), [id]);
}

export function useRoomBookings(params?: QueryParams): UseListResult<RoomBooking> {
  return useList(() => apiClient.get<PaginatedResponse<RoomBooking>>('/rooms/bookings', params), [JSON.stringify(params)]);
}

export function useRoomBooking(id: string): UseDataResult<RoomBooking> {
  return useData(() => apiClient.get<RoomBooking>(`/rooms/bookings/${id}`), [id]);
}

// ============================================
// 习惯养成相关 Hooks
// ============================================

export function useHabitGoals(params?: { category?: string; gradeLevel?: string }): UseDataResult<HabitGoal[]> {
  return useData(() => apiClient.get<HabitGoal[]>('/habit/goals', params), [JSON.stringify(params)]);
}

export function useHabitGoal(id: string): UseDataResult<HabitGoal> {
  return useData(() => apiClient.get<HabitGoal>(`/habit/goals/${id}`), [id]);
}

export function useHabitAssessments(params?: QueryParams): UseListResult<HabitAssessment> {
  return useList(() => apiClient.get<PaginatedResponse<HabitAssessment>>('/habit/assessments', params), [JSON.stringify(params)]);
}

export function useHabitStars(params?: QueryParams): UseListResult<HabitStar> {
  return useList(() => apiClient.get<PaginatedResponse<HabitStar>>('/habit/stars', params), [JSON.stringify(params)]);
}

// ============================================
// 教研活动相关 Hooks
// ============================================

export function useResearchActivities(params?: QueryParams): UseListResult<ResearchActivity> {
  return useList(() => apiClient.get<PaginatedResponse<ResearchActivity>>('/research/activities', params), [JSON.stringify(params)]);
}

export function useResearchActivity(id: string): UseDataResult<ResearchActivity> {
  return useData(() => apiClient.get<ResearchActivity>(`/research/activities/${id}`), [id]);
}

export function useCollectivePreparations(params?: QueryParams): UseListResult<CollectivePreparation> {
  return useList(() => apiClient.get<PaginatedResponse<CollectivePreparation>>('/research/preparations', params), [JSON.stringify(params)]);
}

export function useCollectivePreparation(id: string): UseDataResult<CollectivePreparation> {
  return useData(() => apiClient.get<CollectivePreparation>(`/research/preparations/${id}`), [id]);
}

export function useLessonObservations(params?: QueryParams): UseListResult<LessonObservation> {
  return useList(() => apiClient.get<PaginatedResponse<LessonObservation>>('/research/observations', params), [JSON.stringify(params)]);
}

export function useLessonObservation(id: string): UseDataResult<LessonObservation> {
  return useData(() => apiClient.get<LessonObservation>(`/research/observations/${id}`), [id]);
}

// ============================================
// 工作流相关 Hooks
// ============================================

export function useWorkflowConfigs(type?: string): UseDataResult<WorkflowConfig[]> {
  return useData(() => apiClient.get<WorkflowConfig[]>('/workflow/config', { type }), [type]);
}

export function useWorkflowConfig(id: string): UseDataResult<WorkflowConfig> {
  return useData(() => apiClient.get<WorkflowConfig>(`/workflow/config/${id}`), [id]);
}

export function useWorkflowInstances(params?: QueryParams): UseDataResult<WorkflowInstance[]> {
  return useData(() => apiClient.get<WorkflowInstance[]>('/workflow/instances', params), [JSON.stringify(params)]);
}

export function useWorkflowInstance(id: string): UseDataResult<WorkflowInstance> {
  return useData(() => apiClient.get<WorkflowInstance>(`/workflow/instances/${id}`), [id]);
}

// ============================================
// 数据操作 Hooks
// ============================================

/**
 * 通用创建Hook
 */
export function useCreate<T, D>(path: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: D): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiClient.post<T>(path, data);
      if (result.success && result.data) {
        return result.data;
      }
      setError(result.error || '创建失败');
      return null;
    } catch (e) {
      setError(e instanceof Error ? e.message : '网络错误');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [path]);

  return { create, isLoading, error };
}

/**
 * 通用更新Hook
 */
export function useUpdate<T, D>(path: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: string, data: Partial<D>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiClient.put<T>(`${path}/${id}`, data);
      if (result.success && result.data) {
        return result.data;
      }
      setError(result.error || '更新失败');
      return null;
    } catch (e) {
      setError(e instanceof Error ? e.message : '网络错误');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [path]);

  return { update, isLoading, error };
}

/**
 * 通用删除Hook
 */
export function useDelete(path: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiClient.delete(`${path}/${id}`);
      if (result.success) {
        return true;
      }
      setError(result.error || '删除失败');
      return false;
    } catch (e) {
      setError(e instanceof Error ? e.message : '网络错误');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [path]);

  return { remove, isLoading, error };
}
