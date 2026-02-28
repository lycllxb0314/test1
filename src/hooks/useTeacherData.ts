/**
 * 教师数据统一管理Hooks
 * 
 * 使用统一的基础Hook库（useApi.ts）实现
 * 
 * @module hooks/useTeacherData
 */

import { useState, useCallback } from 'react';
import { useQuery, usePaginatedQuery, type QueryParams } from './useApi';
import { apiClient } from '@/services/api-client';
import type { Teacher, TeacherProfile } from '@/types';

// ============================================
// 类型定义
// ============================================

/** 教师列表项 */
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

/** 教师记录 */
export interface TeacherRecord {
  id: string;
  teacherId: string;
  type: string;
  title: string;
  description?: string;
  date: string;
  createdAt: string;
}

/** 教师荣誉 */
export interface TeacherHonor {
  id: string;
  teacherId: string;
  title: string;
  level: string;
  category: string;
  issuer?: string;
  date: string;
  certificateNo?: string;
}

/** 教师培训 */
export interface TeacherTraining {
  id: string;
  teacherId: string;
  name: string;
  type: string;
  organizer: string;
  startDate: string;
  endDate: string;
  hours: number;
  status: string;
  certificate?: string;
}

/** 教师成果 */
export interface TeacherAchievement {
  id: string;
  teacherId: string;
  type: string;
  title: string;
  level: string;
  result?: string;
  date: string;
  description?: string;
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

/** 教师列表返回结果 */
export interface TeacherListResult {
  data: TeacherListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/** 教师详情返回结果 */
export interface TeacherDetailResult {
  data: TeacherFullProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  updateProfile: (updates: Partial<TeacherFullProfile>) => Promise<boolean>;
}

// ============================================
// 教师数据Hooks
// ============================================

/**
 * 教师列表数据Hook
 */
export function useTeachersList(params: TeacherListParams = {}): TeacherListResult {
  const queryParams: QueryParams = {
    search: params.search,
    subject: params.subject,
    status: params.status,
    department: params.department,
    page: params.page || 1,
    pageSize: params.pageSize || 20,
  };
  
  const result = usePaginatedQuery<TeacherListItem>(
    (p) => apiClient.get('/teachers', p),
    queryParams
  );
  
  return {
    data: result.data || [],
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * 教师完整档案Hook
 */
export function useTeacherFullProfile(teacherId: string | null): TeacherDetailResult {
  const result = useQuery<TeacherFullProfile>(
    () => apiClient.get(`/teachers/${teacherId}/full-profile`),
    { enabled: !!teacherId, deps: [teacherId] }
  );
  
  const updateProfile = useCallback(async (updates: Partial<TeacherFullProfile>): Promise<boolean> => {
    if (!teacherId) return false;
    
    try {
      const response = await fetch(`/api/teachers/${teacherId}/full-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const res = await response.json();
      
      if (res.success) {
        result.refetch();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [teacherId, result]);
  
  return {
    data: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
    updateProfile,
  };
}

/**
 * 教师操作Hook（增删改）
 */
export function useTeacherMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTeacher = useCallback(async (teacherData: Partial<TeacherListItem>): Promise<TeacherListItem | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherData),
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

  const updateTeacher = useCallback(async (id: string, teacherData: Partial<TeacherListItem>): Promise<TeacherListItem | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/teachers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherData),
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

  const deleteTeacher = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/teachers/${id}`, {
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
    createTeacher,
    updateTeacher,
    deleteTeacher,
  };
}

// 重新导出统一Hooks以保持兼容
export { useTeachers, useTeacher, useTeacherProfile, useCreateTeacher, useUpdateTeacher, useDeleteTeacher } from './useApi';
