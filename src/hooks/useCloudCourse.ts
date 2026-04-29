/**
 * 云教学系统 React Hooks
 * 
 * 封装课程、选课、学习进度、直播会话的数据获取与操作
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/services/api-client';
import type {
  CourseDomain,
  CloudCourse,
  CloudCourseEnrollment,
  CloudLearningRecord,
  CloudLiveSession,
  CloudCourseStats,
  CreateCloudCourseDTO,
  PushCloudCourseDTO,
} from '@/types/cloud-course';

// ============================================
// useCloudCourses - 课程库
// ============================================

function useCloudCourses(domain: CourseDomain, keyword?: string, includeDraft?: boolean) {
  const [courses, setCourses] = useState<CloudCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ domain });
        if (keyword) params.set('keyword', keyword);
        if (includeDraft) params.set('includeDraft', 'true');
        const res = await apiClient.get<CloudCourse[]>(`/cloud-course/courses?${params}`);
        setCourses(res.data || []);
      } catch (err) {
        console.error('[useCloudCourses] fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [domain, keyword, includeDraft, refreshKey]);

  return { courses, loading, refresh };
}

// ============================================
// useCloudCourseDetail - 课程详情
// ============================================

function useCloudCourseDetail(courseId: string | null) {
  const [course, setCourse] = useState<CloudCourse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) { setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<CloudCourse>(`/cloud-course/courses/${courseId}`);
        setCourse(res.data || null);
      } catch (err) {
        console.error('[useCloudCourseDetail] fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [courseId]);

  return { course, loading };
}

// ============================================
// useCloudCourseEnrollments - 选课记录
// ============================================

function useCloudCourseEnrollments(userId: string | null, studentId?: string) {
  const [enrollments, setEnrollments] = useState<CloudCourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ userId });
        if (studentId) params.set('studentId', studentId);
        const res = await apiClient.get<CloudCourseEnrollment[]>(`/cloud-course/enrollments?${params}`);
        setEnrollments(res.data || []);
      } catch (err) {
        console.error('[useCloudCourseEnrollments] fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [userId, studentId]);

  const enroll = useCallback(async (courseId: string) => {
    const res = await apiClient.post<CloudCourseEnrollment>('/cloud-course/enrollments', {
      userId, courseId, source: 'self',
    });
    if (res.data) {
      setEnrollments(prev => [res.data!, ...prev]);
    }
    return res.data;
  }, [userId]);

  const enrollForStudent = useCallback(async (courseId: string, stuId: string) => {
    const res = await apiClient.post<CloudCourseEnrollment>('/cloud-course/enrollments', {
      userId, studentId: stuId, courseId, source: 'pushed',
    });
    if (res.data) {
      setEnrollments(prev => [res.data!, ...prev]);
    }
    return res.data;
  }, [userId]);

  const scheduleLearning = useCallback(async (enrollmentId: string, scheduledAt: string) => {
    const res = await apiClient.put<CloudCourseEnrollment>('/cloud-course/learning', {
      action: 'schedule', enrollmentId, scheduledAt,
    });
    if (res.data) {
      setEnrollments(prev => prev.map(e => e.id === enrollmentId ? { ...e, ...res.data! } : e));
    }
    return res.data;
  }, []);

  const pushCourse = useCallback(async (pushData: PushCloudCourseDTO & { pushedBy: string; pusherName: string }) => {
    const res = await apiClient.post('/cloud-course/enrollments', {
      action: 'push', ...pushData,
    });
    return res.data;
  }, []);

  return { enrollments, loading, enroll, enrollForStudent, scheduleLearning, pushCourse };
}

// ============================================
// useCloudLearning - 学习进度
// ============================================

function useCloudLearning() {
  const startLearning = useCallback(async (enrollmentId: string, chapterId: string, recordType: 'video' | 'live' | 'quiz' | 'document' = 'video') => {
    const res = await apiClient.put<CloudLearningRecord>('/cloud-course/learning', {
      action: 'start', enrollmentId, chapterId, recordType,
    });
    return res.data;
  }, []);

  const completeLearning = useCallback(async (params: {
    recordId: string; enrollmentId: string; chapterId: string;
    watchDuration: number; quizScore?: number;
  }) => {
    const res = await apiClient.put<CloudLearningRecord>('/cloud-course/learning', {
      action: 'complete', ...params,
    });
    return res.data;
  }, []);

  const getRecords = useCallback(async (enrollmentId: string) => {
    const res = await apiClient.get<CloudLearningRecord[]>(`/cloud-course/learning?enrollmentId=${enrollmentId}`);
    return res.data || [];
  }, []);

  return { startLearning, completeLearning, getRecords };
}

// ============================================
// useCloudLiveSessions - 直播会话
// ============================================

function useCloudLiveSessions(courseId?: string, upcoming?: boolean) {
  const [sessions, setSessions] = useState<CloudLiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (courseId) params.set('courseId', courseId);
        if (upcoming) params.set('upcoming', 'true');
        const res = await apiClient.get<CloudLiveSession[]>(`/cloud-course/live?${params}`);
        setSessions(res.data || []);
      } catch (err) {
        console.error('[useCloudLiveSessions] fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [courseId, upcoming]);

  return { sessions, loading };
}

// ============================================
// useCloudCourseStats - 课程统计
// ============================================

function useCloudCourseStats() {
  const [stats, setStats] = useState<CloudCourseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<CloudCourseStats>('/cloud-course/stats');
        setStats(res.data || null);
      } catch (err) {
        console.error('[useCloudCourseStats] fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { stats, loading };
}

// ============================================
// useCloudCourseActions - 课程管理操作
// ============================================

function useCloudCourseActions() {
  const createCourse = useCallback(async (data: CreateCloudCourseDTO & { creatorId: string; creatorName: string }) => {
    const res = await apiClient.post<CloudCourse>('/cloud-course/courses', data);
    return res.data;
  }, []);

  const updateCourse = useCallback(async (id: string, data: Partial<CloudCourse>) => {
    const res = await apiClient.put<CloudCourse>(`/cloud-course/courses/${id}`, data);
    return res.data;
  }, []);

  const publishCourse = useCallback(async (id: string) => {
    const res = await apiClient.put<CloudCourse>(`/cloud-course/courses/${id}`, {
      status: 'published', publishedAt: new Date().toISOString(),
    });
    return res.data;
  }, []);

  const deleteCourse = useCallback(async (id: string) => {
    const res = await apiClient.delete(`/cloud-course/courses/${id}`);
    return res.success;
  }, []);

  return { createCourse, updateCourse, publishCourse, deleteCourse };
}

export {
  useCloudCourses,
  useCloudCourseDetail,
  useCloudCourseEnrollments,
  useCloudLearning,
  useCloudLiveSessions,
  useCloudCourseStats,
  useCloudCourseActions,
};
