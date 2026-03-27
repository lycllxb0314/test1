/**
 * 班级常规评比 Hook
 * 
 * 提供班级常规评分、周评比、值日教师的数据获取和操作
 * 
 * @module hooks/useClassRoutine
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCache } from './useCache';
import type {
  ClassRoutineScore,
  DutyTeacher,
  ClassWeeklyEvaluation,
  ClassDailyScoreSummary,
  RoutineScoreCategory,
  RoutineScoreQueryParams,
  CreateRoutineScoreParams,
  BatchCreateRoutineScoresParams,
} from '@/types/class-routine';
import { ROUTINE_SCORE_CATEGORIES, ROUTINE_CATEGORY_MAX_SCORES } from '@/types/class-routine';

// ==================== 类型定义 ====================

interface RoutineScoresSummary {
  totalRecords: number;
  byCategory: Record<string, { totalScore: number; count: number }>;
  byGrade: Record<number, { totalScore: number; count: number }>;
  classRanking: Array<{
    classId: string;
    className: string;
    grade: number;
    totalScore: number;
    count: number;
    avgScore: number;
  }>;
}

interface UseRoutineScoresOptions {
  classId?: string;
  grade?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
  autoFetch?: boolean;
}

interface UseRoutineScoresReturn {
  scores: ClassRoutineScore[];
  summary: RoutineScoresSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createScore: (params: CreateRoutineScoreParams) => Promise<boolean>;
  batchCreateScores: (params: BatchCreateRoutineScoresParams) => Promise<boolean>;
}

interface UseDutyTeachersOptions {
  grade?: number;
  isActive?: boolean;
  autoFetch?: boolean;
}

interface UseDutyTeachersReturn {
  dutyTeachers: DutyTeacher[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createDutyTeacher: (params: {
    teacherId: string;
    teacherName: string;
    grade: number;
    weekDay: number;
  }) => Promise<boolean>;
  updateDutyTeacher: (params: {
    id: string;
    grade?: number;
    weekDay?: number;
    isActive?: boolean;
  }) => Promise<boolean>;
  deleteDutyTeacher: (id: string) => Promise<boolean>;
}

interface UseClassDailyRoutineOptions {
  classId: string;
  date?: string;
  autoFetch?: boolean;
}

interface UseClassDailyRoutineReturn {
  dailyScores: ClassRoutineScore[];
  categoryScores: Array<{
    category: RoutineScoreCategory;
    score: number;
    maxScore: number;
  }>;
  totalScore: number;
  maxTotalScore: number;
  scoreRate: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ==================== Hook: 评分记录 ====================

/**
 * 获取评分记录
 * 
 * 使用缓存机制：
 * - 缓存时间：2分钟
 * - 请求去重：避免并发重复请求
 */
export function useRoutineScores(options: UseRoutineScoresOptions = {}): UseRoutineScoresReturn {
  const { classId, grade, date, startDate, endDate, autoFetch = true } = options;

  const { 
    data: scores, 
    loading, 
    error, 
    refetch 
  } = useCache<ClassRoutineScore[]>({
    key: 'routine-scores',
    params: { classId, grade, date, startDate, endDate },
    fetcher: async () => {
      const params = new URLSearchParams();
      if (classId) params.set('classId', classId);
      if (grade !== undefined) params.set('grade', grade.toString());
      if (date) params.set('date', date);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/routine-scores?${params.toString()}`, {
        credentials: 'include',
      });

      const result = await res.json();
      if (result.success) {
        return result.data || [];
      }
      throw new Error(result.error || '获取数据失败');
    },
    ttl: 2 * 60 * 1000, // 2分钟缓存
    enabled: autoFetch,
    immediate: true,
  });

  const createScore = useCallback(async (params: CreateRoutineScoreParams): Promise<boolean> => {
    try {
      const res = await fetch('/api/routine-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(params),
      });

      const result = await res.json();

      if (result.success) {
        refetch();
        return true;
      }
      return false;
    } catch (err) {
      console.error('创建评分记录失败:', err);
      return false;
    }
  }, [refetch]);

  const batchCreateScores = useCallback(async (params: BatchCreateRoutineScoresParams): Promise<boolean> => {
    try {
      const res = await fetch('/api/routine-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(params),
      });

      const result = await res.json();

      if (result.success) {
        refetch();
        return true;
      }
      return false;
    } catch (err) {
      console.error('批量创建评分记录失败:', err);
      return false;
    }
  }, [refetch]);

  // 计算汇总数据
  const summary = useMemo<RoutineScoresSummary | null>(() => {
    if (!scores) return null;

    const byCategory: Record<string, { totalScore: number; count: number }> = {};
    const byGrade: Record<number, { totalScore: number; count: number }> = {};

    for (const s of scores) {
      // 按维度汇总
      if (!byCategory[s.category]) {
        byCategory[s.category] = { totalScore: 0, count: 0 };
      }
      byCategory[s.category].totalScore += s.score;
      byCategory[s.category].count++;

      // 按年级汇总
      if (!byGrade[s.grade]) {
        byGrade[s.grade] = { totalScore: 0, count: 0 };
      }
      byGrade[s.grade].totalScore += s.score;
      byGrade[s.grade].count++;
    }

    return {
      totalRecords: scores.length,
      byCategory,
      byGrade,
      classRanking: [], // TODO: 实现班级排名逻辑
    };
  }, [scores]);

  return {
    scores: scores || [],
    summary,
    loading,
    error: error?.message || null,
    refetch,
    createScore,
    batchCreateScores,
  };
}

// ==================== Hook: 值日教师 ====================

/**
 * 获取值日教师
 * 
 * 使用缓存机制：
 * - 缓存时间：5分钟（值日教师安排变化频率低）
 * - 请求去重：避免并发重复请求
 */
export function useDutyTeachers(options: UseDutyTeachersOptions = {}): UseDutyTeachersReturn {
  const { grade, isActive = true, autoFetch = true } = options;

  const { 
    data: dutyTeachers, 
    loading, 
    error, 
    refetch 
  } = useCache<DutyTeacher[]>({
    key: 'duty-teachers',
    params: { grade, isActive },
    fetcher: async () => {
      const params = new URLSearchParams();
      if (grade !== undefined) params.set('grade', grade.toString());
      params.set('active', isActive.toString());

      const res = await fetch(`/api/duty-teachers?${params.toString()}`, {
        credentials: 'include',
      });

      const result = await res.json();
      if (result.success) {
        return result.data || [];
      }
      throw new Error(result.error || '获取数据失败');
    },
    ttl: 5 * 60 * 1000, // 5分钟缓存
    enabled: autoFetch,
    immediate: true,
  });

  const createDutyTeacher = useCallback(async (params: {
    teacherId: string;
    teacherName: string;
    grade: number;
    weekDay: number;
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/duty-teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(params),
      });

      const result = await res.json();

      if (result.success) {
        refetch();
        return true;
      }
      return false;
    } catch (err) {
      console.error('创建值日教师安排失败:', err);
      return false;
    }
  }, [refetch]);

  const updateDutyTeacher = useCallback(async (params: {
    id: string;
    grade?: number;
    weekDay?: number;
    isActive?: boolean;
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/duty-teachers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(params),
      });

      const result = await res.json();

      if (result.success) {
        refetch();
        return true;
      }
      return false;
    } catch (err) {
      console.error('更新值日教师安排失败:', err);
      return false;
    }
  }, [refetch]);

  const deleteDutyTeacher = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/duty-teachers?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await res.json();

      if (result.success) {
        refetch();
        return true;
      }
      return false;
    } catch (err) {
      console.error('删除值日教师安排失败:', err);
      return false;
    }
  }, [refetch]);

  return {
    dutyTeachers: dutyTeachers || [],
    loading,
    error: error?.message || null,
    refetch,
    createDutyTeacher,
    updateDutyTeacher,
    deleteDutyTeacher,
  };
}

// ==================== Hook: 班级日评分 ====================

/**
 * 获取班级日评分（用于班级详情页展示）
 * 
 * 使用缓存机制：
 * - 缓存时间：2分钟（常规评分更新频率较低）
 * - 请求去重：避免并发重复请求
 * - 自动过期：数据过期后自动刷新
 */
export function useClassDailyRoutine(options: UseClassDailyRoutineOptions): UseClassDailyRoutineReturn {
  const { classId, date, autoFetch = true } = options;

  // 默认今天
  const targetDate = date || new Date().toISOString().split('T')[0];

  // 使用缓存 hook
  const { 
    data: dailyScores, 
    loading, 
    error, 
    refetch,
    isFromCache 
  } = useCache<ClassRoutineScore[]>({
    key: 'routine-scores-daily',
    params: { classId, date: targetDate },
    fetcher: async () => {
      const params = new URLSearchParams();
      params.set('classId', classId);
      params.set('date', targetDate);

      const res = await fetch(`/api/routine-scores?${params.toString()}`, {
        credentials: 'include',
      });

      const result = await res.json();
      if (result.success) {
        return result.data || [];
      }
      throw new Error(result.error || '获取数据失败');
    },
    ttl: 2 * 60 * 1000, // 2分钟缓存
    enabled: autoFetch && !!classId,
    immediate: true,
  });

  // 按维度汇总
  const categoryScores = useMemo(() => {
    const map = new Map<RoutineScoreCategory, { score: number; maxScore: number }>();

    for (const category of ROUTINE_SCORE_CATEGORIES) {
      map.set(category, { score: 0, maxScore: ROUTINE_CATEGORY_MAX_SCORES[category] });
    }

    if (dailyScores) {
      for (const s of dailyScores) {
        const existing = map.get(s.category);
        if (existing) {
          existing.score += s.score;
          existing.maxScore = Math.max(existing.maxScore, s.maxScore);
        }
      }
    }

    return Array.from(map.entries()).map(([category, data]) => ({
      category,
      score: data.score,
      maxScore: data.maxScore,
    }));
  }, [dailyScores]);

  const totalScore = useMemo(() => {
    return categoryScores.reduce((sum, c) => sum + c.score, 0);
  }, [categoryScores]);

  const maxTotalScore = useMemo(() => {
    return categoryScores.reduce((sum, c) => sum + c.maxScore, 0);
  }, [categoryScores]);

  const scoreRate = useMemo(() => {
    return maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;
  }, [totalScore, maxTotalScore]);

  return {
    dailyScores: dailyScores || [],
    categoryScores,
    totalScore,
    maxTotalScore,
    scoreRate,
    loading,
    error: error?.message || null,
    refetch,
  };
}

// ==================== Hook: 班级周评分 ====================

interface UseClassWeeklyRoutineOptions {
  classId: string;
  academicYear?: string;
  weekNumber?: number;
  autoFetch?: boolean;
}

interface UseClassWeeklyRoutineReturn {
  evaluation: ClassWeeklyEvaluation | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 获取班级周评分
 * 
 * 使用缓存机制：
 * - 缓存时间：5分钟（周评比数据更新频率低）
 * - 请求去重：避免并发重复请求
 */
export function useClassWeeklyRoutine(options: UseClassWeeklyRoutineOptions): UseClassWeeklyRoutineReturn {
  const { classId, academicYear, weekNumber, autoFetch = true } = options;

  const { 
    data: evaluation, 
    loading, 
    error, 
    refetch 
  } = useCache<ClassWeeklyEvaluation | null>({
    key: 'weekly-evaluation',
    params: { classId, academicYear, weekNumber },
    fetcher: async () => {
      const params = new URLSearchParams();
      params.set('classId', classId);
      if (academicYear) params.set('academicYear', academicYear);
      if (weekNumber) params.set('weekNumber', weekNumber.toString());

      const res = await fetch(`/api/weekly-evaluations?${params.toString()}`, {
        credentials: 'include',
      });

      const result = await res.json();
      if (result.success) {
        return result.data || null;
      }
      throw new Error(result.error || '获取数据失败');
    },
    ttl: 5 * 60 * 1000, // 5分钟缓存
    enabled: autoFetch && !!classId,
    immediate: true,
  });

  return {
    evaluation: evaluation || null,
    loading,
    error: error?.message || null,
    refetch,
  };
}
