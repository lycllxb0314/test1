/**
 * 习惯养成数据管理 Hook
 * 基于统一数据架构 v2.0 - 使用 useQuery 和 usePaginatedQuery 实现
 * 
 * 提供习惯养成相关的数据获取和管理功能
 */

import { useCallback, useMemo, useState } from 'react';
import { useQuery, usePaginatedQuery, type QueryParams, type ApiResponse, type Pagination } from './useApi';
import type {
  HabitRecord,
  HabitEvaluation,
  HabitStatistics,
  HabitGoal,
  HabitStar,
  HabitCategory,
  HabitTrend,
  SchoolHabitStatsResponse,
  HabitGoalTemplate,
  HabitStarRule,
  HabitAssessment,
  SchoolHabitOverview,
} from '@/types';

// 重新导出习惯分类相关常量（供页面使用）
export { habitCategoryNames, habitCategoryColors, habitCategoryIcons } from '@/types';

// ============================================================
// 辅助函数：统一 API 调用
// ============================================================

async function fetchApi<T>(path: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
  const url = new URL(`/api${path}`, window.location.origin);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }

  try {
    const response = await fetch(url.toString(), {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络请求失败',
    };
  }
}

// ============================================================
// 基础查询 Hook
// ============================================================

/**
 * 获取习惯记录列表
 */
export function useHabitRecords(params?: {
  studentId?: string;
  classId?: string;
  category?: HabitCategory;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HabitRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchApi<{ data: HabitRecord[]; pagination: Pagination }>(
        '/moral/habit/records',
        { ...params, page: params?.page || 1, pageSize: params?.pageSize || 20 }
      );

      if (response.success && response.data) {
        setData(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setError(response.error || '获取数据失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  return {
    data,
    loading,
    error,
    pagination,
    refetch: fetchData,
  };
}

/**
 * 获取单个习惯记录详情
 */
export function useHabitRecord(id: string | null) {
  return useQuery<HabitRecord | null>(
    () => id ? fetchApi<HabitRecord>(`/moral/habit/records/${id}`).then(r => ({
      success: r.success,
      data: r.data || null,
      error: r.error,
    })) : Promise.resolve({ success: true, data: null }),
    { enabled: !!id, deps: [id] }
  );
}

/**
 * 获取习惯评价记录
 */
export function useHabitEvaluations(params?: {
  studentId?: string;
  classId?: string;
  teacherId?: string;
  category?: HabitCategory;
  academicYear?: string;
  semester?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HabitEvaluation[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchApi<{ data: HabitEvaluation[]; pagination: Pagination }>(
        '/moral/habit/evaluations',
        { ...params, page: params?.page || 1, pageSize: params?.pageSize || 20 }
      );

      if (response.success && response.data) {
        setData(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setError(response.error || '获取数据失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  return {
    data,
    loading,
    error,
    pagination,
    refetch: fetchData,
  };
}

/**
 * 获取学生习惯统计数据
 */
export function useHabitStatistics(studentId: string | null) {
  return useQuery<HabitStatistics | null>(
    () => studentId 
      ? fetchApi<HabitStatistics>(`/moral/habit/statistics/${studentId}`).then(r => ({
          success: r.success,
          data: r.data || null,
          error: r.error,
        }))
      : Promise.resolve({ success: true, data: null }),
    { enabled: !!studentId, deps: [studentId] }
  );
}

/**
 * 获取学生习惯趋势数据
 */
export function useHabitTrend(studentId: string | null, months: number = 6) {
  return useQuery<HabitTrend | null>(
    () => studentId 
      ? fetchApi<HabitTrend>(`/moral/habit/trend/${studentId}`, { months }).then(r => ({
          success: r.success,
          data: r.data || null,
          error: r.error,
        }))
      : Promise.resolve({ success: true, data: null }),
    { enabled: !!studentId, deps: [studentId, months] }
  );
}

/**
 * 获取习惯目标列表
 */
export function useHabitGoals(params?: {
  studentId?: string;
  classId?: string;
  status?: 'active' | 'completed' | 'all';
  category?: HabitCategory;
}) {
  return useQuery<HabitGoal[]>(
    () => fetchApi<HabitGoal[]>('/moral/habit/goals', params).then(r => ({
      success: r.success,
      data: r.data || [],
      error: r.error,
    })),
    { deps: [JSON.stringify(params)] }
  );
}

/**
 * 获取习惯之星列表
 */
export function useHabitStars(params?: {
  classId?: string;
  grade?: string;
  category?: HabitCategory;
  academicYear?: string;
  semester?: string;
  limit?: number;
}) {
  return useQuery<HabitStar[]>(
    () => fetchApi<HabitStar[]>('/moral/habit/stars', params).then(r => ({
      success: r.success,
      data: r.data || [],
      error: r.error,
    })),
    { deps: [JSON.stringify(params)] }
  );
}

// ============================================================
// 全校统计 Hook
// ============================================================

/**
 * 获取全校习惯养成统计概览
 */
export function useSchoolHabitStats(month?: string) {
  const currentMonth = month || new Date().toISOString().slice(0, 7);
  
  return useQuery<SchoolHabitStatsResponse>(
    () => fetchApi<SchoolHabitStatsResponse>('/moral/habit/school-stats', { month: currentMonth }).then(r => ({
      success: r.success,
      data: r.data || {
        overview: {} as SchoolHabitOverview,
        categoryStats: [],
        gradeStats: [],
        month: currentMonth,
      },
      error: r.error,
    })),
    { deps: [currentMonth] }
  );
}

/**
 * 获取习惯目标模板
 */
export function useHabitGoalTemplates(category?: HabitCategory) {
  return useQuery<HabitGoalTemplate[]>(
    () => fetchApi<HabitGoalTemplate[]>('/moral/habit/goal-templates', category ? { category } : undefined).then(r => ({
      success: r.success,
      data: r.data || [],
      error: r.error,
    })),
    { deps: [category] }
  );
}

/**
 * 获取习惯之星评选规则
 */
export function useHabitStarRules() {
  return useQuery<HabitStarRule[]>(
    () => fetchApi<HabitStarRule[]>('/moral/habit/star-rules').then(r => ({
      success: r.success,
      data: r.data || [],
      error: r.error,
    })),
    {}
  );
}

// ============================================================
// 数据操作 Hook
// ============================================================

/**
 * 习惯评价操作 Hook
 */
export function useHabitEvaluationActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEvaluation = useCallback(async (data: Partial<HabitEvaluation>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/moral/habit/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      setLoading(false);
      return result.success ? result.data : null;
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
      setLoading(false);
      return null;
    }
  }, []);

  const updateEvaluation = useCallback(async (id: string, data: Partial<HabitEvaluation>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/moral/habit/evaluations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      setLoading(false);
      return result.success ? result.data : null;
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
      setLoading(false);
      return null;
    }
  }, []);

  const deleteEvaluation = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/moral/habit/evaluations/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      setLoading(false);
      return result.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
      setLoading(false);
      return false;
    }
  }, []);

  return {
    loading,
    error,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
  };
}

/**
 * 习惯目标操作 Hook
 */
export function useHabitGoalActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGoal = useCallback(async (data: Partial<HabitGoal>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/moral/habit/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      setLoading(false);
      return result.success ? result.data : null;
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
      setLoading(false);
      return null;
    }
  }, []);

  const updateGoal = useCallback(async (id: string, data: Partial<HabitGoal>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/moral/habit/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      setLoading(false);
      return result.success ? result.data : null;
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
      setLoading(false);
      return null;
    }
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/moral/habit/goals/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      setLoading(false);
      return result.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
      setLoading(false);
      return false;
    }
  }, []);

  return {
    loading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
  };
}

/**
 * 习惯记录操作 Hook
 */
export function useHabitRecordActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRecord = useCallback(async (data: Partial<HabitRecord>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/moral/habit/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      setLoading(false);
      return result.success ? result.data : null;
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
      setLoading(false);
      return null;
    }
  }, []);

  const updateRecord = useCallback(async (id: string, data: Partial<HabitRecord>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/moral/habit/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      setLoading(false);
      return result.success ? result.data : null;
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
      setLoading(false);
      return null;
    }
  }, []);

  const deleteRecord = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/moral/habit/records/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      setLoading(false);
      return result.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
      setLoading(false);
      return false;
    }
  }, []);

  return {
    loading,
    error,
    createRecord,
    updateRecord,
    deleteRecord,
  };
}

// ============================================================
// 综合查询 Hook（聚合多个数据源）
// ============================================================

/**
 * 学生习惯综合数据 Hook
 * 聚合学生统计数据、趋势数据、目标列表
 */
export function useStudentHabitSummary(studentId: string | null) {
  const { data: stats, loading: statsLoading, error: statsError } = useHabitStatistics(studentId);
  const { data: trend, loading: trendLoading, error: trendError } = useHabitTrend(studentId);
  const { data: goals, loading: goalsLoading, error: goalsError } = useHabitGoals({ 
    studentId: studentId || undefined, 
    status: 'active' 
  });

  const loading = statsLoading || trendLoading || goalsLoading;
  const error = statsError || trendError || goalsError;

  const summary = useMemo(() => {
    if (!studentId) return null;

    return {
      studentId,
      stats,
      trend,
      activeGoals: goals,
    };
  }, [studentId, stats, trend, goals]);

  return {
    data: summary,
    loading,
    error,
  };
}

/**
 * 班级习惯数据概览 Hook
 */
export function useClassHabitOverview(classId: string | null) {
  const { data: stars, loading: starsLoading } = useHabitStars({ 
    classId: classId || undefined,
    limit: 10,
  });
  
  const { data: goals, loading: goalsLoading } = useHabitGoals({ 
    classId: classId || undefined,
    status: 'active',
  });

  const loading = starsLoading || goalsLoading;

  return {
    stars,
    activeGoals: goals,
    loading,
  };
}

// ============================================================
// 导出类型
// ============================================================

export type {
  HabitRecord,
  HabitEvaluation,
  HabitStatistics,
  HabitGoal,
  HabitStar,
  HabitCategory,
  HabitTrend,
  HabitAssessment,
};
