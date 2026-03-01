/**
 * 学生数据管理 Hook
 * 基于统一数据架构 v2.0 - 使用 useQuery 和 usePaginatedQuery 实现
 * 
 * 提供学生相关的数据获取和管理功能
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import { useQuery, type ApiResponse, type Pagination } from './useApi';
import type {
  Student,
  StudentFullProfile,
} from '@/types';

// ============================================================
// 类型定义（本地扩展类型）
// ============================================================

/** 学生列表项（简化版） */
export interface StudentListItem {
  id: string;
  studentNo: string;
  name: string;
  gender: 'male' | 'female';
  grade: number;
  gradeName: string;
  classId: string;
  className: string;
  headTeacherName?: string;
  status: '在校' | '请假' | '休学' | '毕业' | '转学';
}

/** 学生列表查询参数 */
export interface StudentsListParams {
  search?: string;
  grade?: string;
  classId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
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
 * 获取学生列表（分页）
 */
export function useStudentsList(params: StudentsListParams = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StudentListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL('/api/students', window.location.origin);
      Object.entries({ ...params, page: params?.page || 1, pageSize: params?.pageSize || 20 }).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });

      const response = await fetch(url.toString(), {
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();

      if (result.success) {
        // API 返回格式: { success, data: [...], pagination: {...} }
        // 转换下划线格式到驼峰格式，并补充计算字段
        const gradeNames: Record<number, string> = {
          1: '一年级', 2: '二年级', 3: '三年级',
          4: '四年级', 5: '五年级', 6: '六年级',
        };
        
        const formattedData: StudentListItem[] = (result.data || []).map((item: {
          id: string;
          student_no: string;
          name: string;
          gender: string;
          grade: number;
          class_id: string;
          class_name: string;
          head_teacher_name?: string;
          status: string;
        }) => ({
          id: item.id,
          studentNo: item.student_no,
          name: item.name,
          gender: item.gender === 'male' ? 'male' : 'female' as const,
          grade: item.grade,
          gradeName: gradeNames[item.grade] || `${item.grade}年级`,
          classId: item.class_id,
          className: item.class_name,
          headTeacherName: item.head_teacher_name,
          status: item.status as StudentListItem['status'],
        }));
        
        setData(formattedData);
        setPagination(result.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 0 });
      } else {
        setError(result.error || '获取数据失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  // 初始化时自动获取数据
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    pagination,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * 获取单个学生详情
 */
export function useStudent(id: string | null) {
  return useQuery<Student | null>(
    () => id ? fetchApi<Student>(`/students/${id}`).then(r => ({
      success: r.success,
      data: r.data || null,
      error: r.error,
    })) : Promise.resolve({ success: true, data: null }),
    { enabled: !!id, deps: [id] }
  );
}

/**
 * 获取学生完整档案
 */
export function useStudentFullProfile(studentId: string | null) {
  const result = useQuery<StudentFullProfile | null>(
    () => studentId 
      ? fetchApi<StudentFullProfile>(`/students/${studentId}/full-profile`).then(r => ({
          success: r.success,
          data: r.data || null,
          error: r.error,
        }))
      : Promise.resolve({ success: true, data: null }),
    { enabled: !!studentId, deps: [studentId] }
  );

  const updateProfile = useCallback(async (updates: Partial<StudentFullProfile>): Promise<boolean> => {
    if (!studentId) return false;

    try {
      const response = await fetch(`/api/students/${studentId}/full-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const res = await response.json();
      return res.success;
    } catch {
      return false;
    }
  }, [studentId]);

  return {
    data: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
    updateProfile,
  };
}

/**
 * 按班级获取学生列表
 */
export function useStudentsByClass(classId: string | null) {
  return useQuery<Student[]>(
    () => classId 
      ? fetchApi<Student[]>(`/classes/${classId}/students`).then(r => ({
          success: r.success,
          data: r.data || [],
          error: r.error,
        }))
      : Promise.resolve({ success: true, data: [] }),
    { enabled: !!classId, deps: [classId] }
  );
}

/**
 * 搜索学生
 */
export function useStudentSearch(keyword: string, limit: number = 10) {
  return useQuery<StudentListItem[]>(
    () => keyword 
      ? fetchApi<StudentListItem[]>('/students/search', { keyword, limit }).then(r => ({
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
 * 学生操作 Hook（增删改）
 */
export function useStudentMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createStudent = useCallback(async (studentData: Partial<Student>): Promise<Student | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
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

  const updateStudent = useCallback(async (id: string, studentData: Partial<Student>): Promise<Student | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
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

  const deleteStudent = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/students/${id}`, {
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

  const batchImport = useCallback(async (students: Partial<Student>[]): Promise<{ success: number; failed: number } | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/students/batch-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students }),
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
    createStudent,
    updateStudent,
    deleteStudent,
    batchImport,
  };
}

// ============================================================
// 综合查询 Hook（聚合多个数据源）
// ============================================================

/**
 * 学生班级概览 Hook
 * 获取班级学生列表及相关统计
 */
export function useClassStudentsOverview(classId: string | null) {
  const { data: students, loading: studentsLoading, error: studentsError } = useStudentsByClass(classId);
  
  const stats = useMemo(() => {
    if (!students || students.length === 0) return null;

    const total = students.length;
    const maleCount = students.filter((s: Student) => s.gender === 'male').length;
    const femaleCount = students.filter((s: Student) => s.gender === 'female').length;
    const activeCount = students.filter((s: Student) => s.status === '在校').length;

    return {
      total,
      maleCount,
      femaleCount,
      activeCount,
    };
  }, [students]);

  return {
    students,
    stats,
    loading: studentsLoading,
    error: studentsError,
  };
}

/**
 * 学生档案摘要 Hook
 * 聚合学生基本信息、家庭信息、学业信息
 */
export function useStudentProfileSummary(studentId: string | null) {
  const { data: profile, loading: profileLoading, error: profileError } = useStudentFullProfile(studentId);

  const summary = useMemo(() => {
    if (!profile) return null;

    // 获取主要监护人信息
    const primaryParent = profile.parents?.[0];

    return {
      // 基本信息
      basic: {
        id: profile.id,
        name: profile.name,
        studentNo: profile.studentNo,
        gender: profile.gender,
        birthDate: profile.birthDate,
        grade: profile.grade,
        className: profile.className,
        status: profile.status,
      },
      // 家庭信息
      family: {
        guardian: primaryParent?.name,
        guardianPhone: primaryParent?.phone,
        guardianRelation: primaryParent?.relationship,
        address: profile.address || profile.homeAddress,
      },
      // 入学信息
      enrollment: {
        date: profile.enrollmentDate,
        type: profile.studentType,
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
  Student,
  StudentFullProfile,
};
