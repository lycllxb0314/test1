/**
 * 教师数据管理 Hook
 * 基于统一数据架构 v2.0 - 使用 useQuery 和 usePaginatedQuery 实现
 * 
 * 提供教师相关的数据获取和管理功能
 */

import { useCallback, useMemo, useState } from 'react';
import { useQuery, type ApiResponse, type Pagination } from './useApi';
import type {
  Teacher,
  TeacherProfile,
  TeacherRecord,
  TeacherHonor,
  TeacherTraining,
  TeacherAchievement,
} from '@/types';

// ============================================================
// 类型定义（本地扩展类型）
// ============================================================

/** 教师列表项（简化版） */
export interface TeacherListItem {
  id: string;
  name: string;
  gender: 'male' | 'female';
  subject: string;
  title: string;
  department: string;
  phone: string;
  email: string;
  status: string;
  teachYears: number;
}

/** 教师列表查询参数 */
export interface TeacherListParams {
  search?: string;
  subject?: string;
  status?: string;
  department?: string;
  page?: number;
  pageSize?: number;
}

/** 教师完整档案 */
export interface TeacherFullProfile {
  id: string;
  userId: string;
  name: string;
  gender: '男' | '女';
  birthDate: string;
  idCard: string;
  ethnicity: string;
  politicalStatus: string;
  nativePlace: string;
  phone: string;
  email: string;
  emergencyContact: string;
  emergencyPhone: string;
  address: string;
  employeeId: string;
  subjects: string[];
  title: string;
  titleDate: string;
  education: string;
  school: string;
  major: string;
  graduationDate: string;
  teachYears: number;
  joinDate: string;
  department: string;
  isHeadTeacher: boolean;
  className?: string;
  status: string;
  records: TeacherRecord[];
  honors: TeacherHonor[];
  trainings: TeacherTraining[];
  achievements: TeacherAchievement[];
  createdAt: string;
  updatedAt: string;
}

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
 * 获取教师列表（分页）
 */
export function useTeachersList(params: TeacherListParams = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TeacherListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchApi<{ data: TeacherListItem[]; pagination: Pagination }>(
        '/teachers',
        { ...params, page: params?.page || 1, pageSize: params?.pageSize || 20 }
      );

      if (response.success && response.data) {
        setData(response.data.data);
        setPagination(response.data.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 0 });
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
    total: pagination.total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * 获取单个教师详情
 */
export function useTeacher(id: string | null) {
  return useQuery<Teacher | null>(
    () => id ? fetchApi<Teacher>(`/teachers/${id}`).then(r => ({
      success: r.success,
      data: r.data || null,
      error: r.error,
    })) : Promise.resolve({ success: true, data: null }),
    { enabled: !!id, deps: [id] }
  );
}

/**
 * 获取教师完整档案
 */
export function useTeacherFullProfile(teacherId: string | null) {
  const result = useQuery<TeacherProfile | null>(
    () => teacherId 
      ? fetchApi<TeacherProfile>(`/teachers/${teacherId}/full-profile`).then(r => ({
          success: r.success,
          data: r.data || null,
          error: r.error,
        }))
      : Promise.resolve({ success: true, data: null }),
    { enabled: !!teacherId, deps: [teacherId] }
  );

  const updateProfile = useCallback(async (updates: Partial<TeacherProfile>): Promise<boolean> => {
    if (!teacherId) return false;

    try {
      const response = await fetch(`/api/teachers/${teacherId}/full-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const res = await response.json();
      return res.success;
    } catch {
      return false;
    }
  }, [teacherId]);

  return {
    data: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
    updateProfile,
  };
}

/**
 * 搜索教师
 */
export function useTeacherSearch(keyword: string, limit: number = 10) {
  return useQuery<TeacherListItem[]>(
    () => keyword 
      ? fetchApi<TeacherListItem[]>('/teachers/search', { keyword, limit }).then(r => ({
          success: r.success,
          data: r.data || [],
          error: r.error,
        }))
      : Promise.resolve({ success: true, data: [] }),
    { enabled: !!keyword, deps: [keyword, limit] }
  );
}

// ============================================================
// 数据操作 Hook
// ============================================================

/**
 * 教师操作 Hook（增删改）
 */
export function useTeacherMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTeacher = useCallback(async (teacherData: Partial<Teacher>): Promise<Teacher | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherData),
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

  const updateTeacher = useCallback(async (id: string, teacherData: Partial<Teacher>): Promise<Teacher | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/teachers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherData),
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

  const deleteTeacher = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/teachers/${id}`, {
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

  const batchImport = useCallback(async (teachers: Partial<Teacher>[]): Promise<{ success: number; failed: number } | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/teachers/batch-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teachers }),
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

  return {
    loading,
    error,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    batchImport,
  };
}

// ============================================================
// 综合查询 Hook（聚合多个数据源）
// ============================================================

/**
 * 教师档案摘要 Hook
 * 聚合教师基本信息、培训、荣誉、成果
 */
export function useTeacherProfileSummary(teacherId: string | null) {
  const { data: profile, loading: profileLoading, error: profileError } = useTeacherFullProfile(teacherId);

  const summary = useMemo(() => {
    if (!profile) return null;

    const fullProfile = profile as unknown as TeacherFullProfile;

    return {
      // 基本信息
      basic: {
        id: profile.id,
        name: profile.name,
        employeeId: (profile as TeacherFullProfile).employeeId,
        gender: profile.gender,
        phone: profile.phone,
        email: profile.email,
        department: profile.department,
        title: profile.title,
        subjects: profile.subjects,
        teachYears: profile.teachYears,
        status: fullProfile.status,
      },
      // 统计信息
      stats: {
        totalTrainings: fullProfile.trainings?.length || 0,
        totalHonors: fullProfile.honors?.length || 0,
        totalAchievements: fullProfile.achievements?.length || 0,
        totalTrainingHours: fullProfile.trainings?.reduce((sum: number, t: TeacherTraining) => sum + t.hours, 0) || 0,
      },
    };
  }, [profile]);

  return {
    data: summary,
    loading: profileLoading,
    error: profileError,
    fullProfile: profile,
  };
}

// ============================================================
// 导出类型
// ============================================================

export type {
  Teacher,
  TeacherProfile,
  TeacherRecord,
  TeacherHonor,
  TeacherTraining,
  TeacherAchievement,
};
