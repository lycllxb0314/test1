/**
 * 课后服务选课 Hooks
 *
 * 封装课后服务相关的数据获取和操作逻辑
 * @module hooks/useAfterSchool
 */

import { useCallback } from 'react';
import { useQuery, useMutation } from '@/hooks/useApi';
import { apiClient } from '@/services/api-client';
import type { ApiResponse } from '@/services/api-client';
import type { AfterSchoolCourse, CourseEnrollment, CreateCourseDTO, DayOfWeek, CourseCategory } from '@/types/after-school';

// ============================================
// 家长端 Hooks
// ============================================

/**
 * 获取可选课程列表（按年级筛选）
 */
export function useAvailableCourses(grade?: number, options?: { enabled?: boolean }) {
  return useQuery<AfterSchoolCourse[]>(
    () => apiClient.get<AfterSchoolCourse[]>(
      `/after-school/courses${grade ? `?grade=${grade}` : ''}`
    ),
    {
      deps: [grade],
      enabled: options?.enabled !== false,
      cacheTime: 30_000,
    }
  );
}

/**
 * 获取学生选课记录
 */
export function useStudentEnrollments(studentId: string | null) {
  return useQuery<CourseEnrollment[]>(
    () => apiClient.get<CourseEnrollment[]>(
      `/after-school/enrollments?studentId=${studentId}`
    ),
    {
      deps: [studentId],
      enabled: !!studentId,
    }
  );
}

/**
 * 一键选课
 */
export function useEnrollCourse() {
  return useMutation<{ enrollmentId: string }, {
    courseId: string;
    studentId: string;
    studentName?: string;
    className?: string;
  }>(
    (params) => apiClient.post<{ enrollmentId: string }>(
      '/after-school/enroll',
      params
    )
  );
}

/**
 * 退课
 */
export function useCancelEnrollment() {
  return useMutation<{ success: boolean }, {
    courseId: string;
    studentId: string;
    cancelReason?: string;
  }>(
    (params) => apiClient.post<{ success: boolean }>(
      '/after-school/enroll',
      { ...params, action: 'cancel' }
    )
  );
}

// ============================================
// 教务/教师端 Hooks
// ============================================

/**
 * 获取课程列表（管理端分页）
 */
export function useAdminCourses(page = 1, pageSize = 20, status?: string, category?: string) {
  return useQuery<{ courses: AfterSchoolCourse[]; total: number }>(
    () => apiClient.get<{ courses: AfterSchoolCourse[]; total: number }>(
      `/after-school/courses?mode=admin&page=${page}&pageSize=${pageSize}${status ? `&status=${status}` : ''}${category ? `&category=${category}` : ''}`
    ),
    {
      deps: [page, pageSize, status, category],
    }
  );
}

/**
 * 获取课程详情
 */
export function useCourseDetail(courseId: string | null) {
  return useQuery<AfterSchoolCourse>(
    () => apiClient.get<AfterSchoolCourse>(`/after-school/courses/${courseId}`),
    {
      deps: [courseId],
      enabled: !!courseId,
    }
  );
}

/**
 * 创建课程
 */
export function useCreateCourse() {
  return useMutation<AfterSchoolCourse, CreateCourseDTO>(
    (params) => apiClient.post<AfterSchoolCourse>('/after-school/courses', params)
  );
}

/**
 * 更新课程
 */
export function useUpdateCourse() {
  return useMutation<AfterSchoolCourse, { id: string; data: Partial<CreateCourseDTO> }>(
    ({ id, data }) => apiClient.patch<AfterSchoolCourse>(`/after-school/courses/${id}`, data)
  );
}

/**
 * 删除课程
 */
export function useDeleteCourse() {
  return useMutation<null, string>(
    (id) => apiClient.delete<null>(`/after-school/courses/${id}`)
  );
}

/**
 * 获取点名表
 */
export function useClassRoster(courseId: string | null) {
  return useQuery<CourseEnrollment[]>(
    () => apiClient.get<CourseEnrollment[]>(`/after-school/roster/${courseId}`),
    {
      deps: [courseId],
      enabled: !!courseId,
    }
  );
}

/**
 * 获取课程选课记录（管理端）
 */
export function useCourseEnrollments(courseId: string | null, status?: string) {
  return useQuery<CourseEnrollment[]>(
    () => apiClient.get<CourseEnrollment[]>(
      `/after-school/enrollments?mode=admin&courseId=${courseId}${status ? `&status=${status}` : ''}`
    ),
    {
      deps: [courseId, status],
      enabled: !!courseId,
    }
  );
}

// ============================================
// 辅助函数
// ============================================

/** 星期映射 */
const DAY_NAMES: Record<number, string> = {
  1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六', 7: '周日',
};

/** 获取星期名称 */
export function getDayName(dayOfWeek: DayOfWeek | number | undefined): string {
  if (dayOfWeek === undefined) return '';
  return DAY_NAMES[dayOfWeek] || `周${dayOfWeek}`;
}

/** 类别选项 */
export const CATEGORY_OPTIONS: { value: CourseCategory; label: string }[] = [
  { value: 'care', label: '课后托管' },
  { value: 'interest', label: '兴趣班' },
  { value: 'art', label: '艺术' },
  { value: 'sports', label: '体育' },
  { value: 'tech', label: '科技' },
  { value: 'academic', label: '学科辅导' },
];
