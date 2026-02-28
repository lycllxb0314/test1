/**
 * 学生数据统一管理Hooks
 * 
 * 使用统一的基础Hook库（useApi.ts）实现
 * 
 * @module hooks/useStudentData
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, usePaginatedQuery, type QueryParams } from './useApi';
import { apiClient } from '@/services/api-client';
import type { StudentFullProfile } from '@/types';

// ============================================
// 类型定义
// ============================================

/** 学生列表项 */
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

/** 分页信息 */
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
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

/** 学生列表返回结果 */
export interface StudentsListResult {
  data: StudentListItem[];
  pagination: Pagination;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** 学生完整档案返回结果 */
export interface StudentFullProfileResult {
  data: StudentFullProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProfile: (updates: Partial<StudentFullProfile>) => Promise<boolean>;
}

// ============================================
// 学生数据Hooks
// ============================================

/**
 * 学生列表数据Hook
 */
export function useStudentsList(params: StudentsListParams = {}): StudentsListResult {
  const queryParams: QueryParams = {
    search: params.search,
    grade: params.grade,
    classId: params.classId,
    status: params.status,
    page: params.page || 1,
    pageSize: params.pageSize || 20,
  };
  
  const result = usePaginatedQuery<StudentListItem>(
    (p) => apiClient.get('/students', p),
    queryParams
  );
  
  return {
    data: result.data || [],
    pagination: result.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * 学生完整档案Hook
 */
export function useStudentFullProfile(studentId: string | null): StudentFullProfileResult {
  const [data, setData] = useState<StudentFullProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!studentId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/students/${studentId}/full-profile`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || '获取学生档案失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<StudentFullProfile>): Promise<boolean> => {
    if (!studentId) return false;

    setLoading(true);
    try {
      const response = await fetch(`/api/students/${studentId}/full-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const result = await response.json();

      if (result.success) {
        setData(prev => prev ? { ...prev, ...updates } : null);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  return { data, loading, error, refetch: fetchProfile, updateProfile };
}

/**
 * 学生操作Hook（增删改）
 */
export function useStudentMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createStudent = useCallback(async (studentData: Partial<StudentListItem>): Promise<StudentListItem | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });
      const result = await response.json();

      if (result.success) {
        return result.data;
      }
      setError(result.error || '创建失败');
      return null;
    } catch (err) {
      setError('网络错误，请重试');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStudent = useCallback(async (id: string, studentData: Partial<StudentListItem>): Promise<StudentListItem | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });
      const result = await response.json();

      if (result.success) {
        return result.data;
      }
      setError(result.error || '更新失败');
      return null;
    } catch (err) {
      setError('网络错误，请重试');
      return null;
    } finally {
      setLoading(false);
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

      if (result.success) {
        return true;
      }
      setError(result.error || '删除失败');
      return false;
    } catch (err) {
      setError('网络错误，请重试');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createStudent,
    updateStudent,
    deleteStudent,
  };
}
