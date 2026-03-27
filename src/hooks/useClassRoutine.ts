/**
 * 班级常规评比 Hook
 * 
 * 提供班级常规评分、周评比、值日教师的数据获取和操作
 * 
 * @module hooks/useClassRoutine
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
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
 */
export function useRoutineScores(options: UseRoutineScoresOptions = {}): UseRoutineScoresReturn {
  const { classId, grade, date, startDate, endDate, autoFetch = true } = options;

  const [scores, setScores] = useState<ClassRoutineScore[]>([]);
  const [summary, setSummary] = useState<RoutineScoresSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (classId) params.set('classId', classId);
      if (grade !== undefined) params.set('grade', grade.toString());
      if (date) params.set('date', date);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      params.set('summary', 'true');

      const res = await fetch(`/api/routine-scores?${params.toString()}`, {
        credentials: 'include',
      });

      const result = await res.json();

      if (result.success) {
        setScores(result.data || []);
        setSummary(result.summary || null);
      } else {
        setError(result.error || '获取数据失败');
      }
    } catch (err) {
      console.error('获取评分记录失败:', err);
      setError('获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [classId, grade, date, startDate, endDate]);

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
        fetchData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('创建评分记录失败:', err);
      return false;
    }
  }, [fetchData]);

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
        fetchData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('批量创建评分记录失败:', err);
      return false;
    }
  }, [fetchData]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return {
    scores,
    summary,
    loading,
    error,
    refetch: fetchData,
    createScore,
    batchCreateScores,
  };
}

// ==================== Hook: 值日教师 ====================

/**
 * 获取值日教师
 */
export function useDutyTeachers(options: UseDutyTeachersOptions = {}): UseDutyTeachersReturn {
  const { grade, isActive = true, autoFetch = true } = options;

  const [dutyTeachers, setDutyTeachers] = useState<DutyTeacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (grade !== undefined) params.set('grade', grade.toString());
      params.set('active', isActive.toString());

      const res = await fetch(`/api/duty-teachers?${params.toString()}`, {
        credentials: 'include',
      });

      const result = await res.json();

      if (result.success) {
        setDutyTeachers(result.data || []);
      } else {
        setError(result.error || '获取数据失败');
      }
    } catch (err) {
      console.error('获取值日教师失败:', err);
      setError('获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [grade, isActive]);

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
        fetchData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('创建值日教师安排失败:', err);
      return false;
    }
  }, [fetchData]);

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
        fetchData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('更新值日教师安排失败:', err);
      return false;
    }
  }, [fetchData]);

  const deleteDutyTeacher = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/duty-teachers?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await res.json();

      if (result.success) {
        fetchData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('删除值日教师安排失败:', err);
      return false;
    }
  }, [fetchData]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return {
    dutyTeachers,
    loading,
    error,
    refetch: fetchData,
    createDutyTeacher,
    updateDutyTeacher,
    deleteDutyTeacher,
  };
}

// ==================== Hook: 班级日评分 ====================

/**
 * 获取班级日评分（用于班级详情页展示）
 */
export function useClassDailyRoutine(options: UseClassDailyRoutineOptions): UseClassDailyRoutineReturn {
  const { classId, date, autoFetch = true } = options;

  const [dailyScores, setDailyScores] = useState<ClassRoutineScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 默认今天
  const targetDate = date || new Date().toISOString().split('T')[0];

  const fetchData = useCallback(async () => {
    if (!classId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('classId', classId);
      params.set('date', targetDate);

      const res = await fetch(`/api/routine-scores?${params.toString()}`, {
        credentials: 'include',
      });

      const result = await res.json();

      if (result.success) {
        setDailyScores(result.data || []);
      } else {
        setError(result.error || '获取数据失败');
      }
    } catch (err) {
      console.error('获取班级日评分失败:', err);
      setError('获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [classId, targetDate]);

  // 按维度汇总
  const categoryScores = useMemo(() => {
    const map = new Map<RoutineScoreCategory, { score: number; maxScore: number }>();

    for (const category of ROUTINE_SCORE_CATEGORIES) {
      map.set(category, { score: 0, maxScore: ROUTINE_CATEGORY_MAX_SCORES[category] });
    }

    for (const s of dailyScores) {
      const existing = map.get(s.category);
      if (existing) {
        existing.score += s.score;
        existing.maxScore = Math.max(existing.maxScore, s.maxScore);
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

  useEffect(() => {
    if (autoFetch && classId) {
      fetchData();
    }
  }, [autoFetch, classId, fetchData]);

  return {
    dailyScores,
    categoryScores,
    totalScore,
    maxTotalScore,
    scoreRate,
    loading,
    error,
    refetch: fetchData,
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
 */
export function useClassWeeklyRoutine(options: UseClassWeeklyRoutineOptions): UseClassWeeklyRoutineReturn {
  const { classId, academicYear, weekNumber, autoFetch = true } = options;

  const [evaluation, setEvaluation] = useState<ClassWeeklyEvaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!classId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('classId', classId);
      if (academicYear) params.set('academicYear', academicYear);
      if (weekNumber) params.set('weekNumber', weekNumber.toString());

      const res = await fetch(`/api/weekly-evaluations?${params.toString()}`, {
        credentials: 'include',
      });

      const result = await res.json();

      if (result.success) {
        setEvaluation(result.data || null);
      } else {
        setError(result.error || '获取数据失败');
      }
    } catch (err) {
      console.error('获取班级周评分失败:', err);
      setError('获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [classId, academicYear, weekNumber]);

  useEffect(() => {
    if (autoFetch && classId) {
      fetchData();
    }
  }, [autoFetch, classId, fetchData]);

  return {
    evaluation,
    loading,
    error,
    refetch: fetchData,
  };
}
