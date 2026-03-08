/**
 * 习惯养成数据 Hooks
 * 
 * 提供习惯评价、小目标、习惯之星、全校统计等功能
 * 数据源：Supabase 数据库
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HabitCategory,
  HabitAssessment,
  HabitGoal,
  HabitStar,
  SchoolHabitOverview,
  SchoolHabitStatsResponse,
  habitCategoryNames,
  habitCategoryColors,
} from '@/types';

// ==================== 类型定义 ====================

/** 习惯评价记录（API返回格式） */
export interface HabitAssessmentData {
  id: string;
  studentId: string;
  studentName: string;
  grade: number;
  className: string;
  category: HabitCategory;
  score: number;
  evaluatorId: string;
  evaluatorName: string;
  evaluatorType: 'teacher' | 'parent' | 'student';
  context: string;
  occurredAt: string;
  notes?: string;
}

/** 习惯评价查询参数 */
export interface HabitAssessmentFilters {
  studentId?: string;
  category?: HabitCategory;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

/** 小目标数据（API返回格式） */
export interface HabitGoalData {
  id: string;
  title: string;
  description: string;
  category: HabitCategory;
  targetGrades: number[];
  targetClasses: string[];
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'expired';
  progress: number;
  studentCount: number;
  completedCount: number;
  createdAt: string;
}

/** 小目标查询参数 */
export interface HabitGoalFilters {
  category?: HabitCategory;
  status?: 'active' | 'completed' | 'expired';
  grade?: number;
}

/** 习惯之星数据（API返回格式） */
export interface HabitStarData {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  grade: number;
  className: string;
  month: string;
  categories: HabitCategory[];
  totalScore: number;
  achievements: string;
}

/** 习惯之星查询参数 */
export interface HabitStarFilters {
  month?: string;
  grade?: number;
  category?: HabitCategory;
  limit?: number;
}

/** 创建评价记录参数 */
export interface CreateAssessmentParams {
  studentId: string;
  category: HabitCategory;
  score: number;
  evaluatorId: string;
  evaluatorName: string;
  evaluatorType: 'teacher' | 'parent' | 'student';
  context?: string;
  notes?: string;
}

/** 创建小目标参数 */
export interface CreateGoalParams {
  title: string;
  description: string;
  category: HabitCategory;
  targetGrades?: number[];
  targetClasses?: string[];
  startDate: string;
  endDate: string;
}

/** 创建习惯之星参数 */
export interface CreateStarParams {
  studentId: string;
  month: string;
  categories: HabitCategory[];
  totalScore: number;
  achievements?: string;
}

// ==================== 类型统计扩展 ====================

export interface HabitCategoryStat {
  category: HabitCategory;
  name: string;
  rate: number;
  change: number;
  stars: number;
  color: string;
  students: number;
  totalStudents: number;
  trend: 'up' | 'down' | 'stable';
  topGrade: string;
  weakGrade: string;
}

export interface GradeHabitStat {
  grade: string;
  rate: number;
  stars: number;
  students: number;
  trend: 'up' | 'down' | 'stable';
  avgRate: number;
  attention: number;
  topHabit: string;
  weakHabit: string;
}

export interface SchoolHabitStatsData {
  overview: SchoolHabitOverview;
  categoryStats: HabitCategoryStat[];
  gradeStats: GradeHabitStat[];
  month: string;
}

// ==================== useHabitAssessments Hook ====================

export interface UseHabitAssessmentsReturn {
  data: HabitAssessmentData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createAssessment: (params: CreateAssessmentParams) => Promise<boolean>;
}

/**
 * 习惯评价记录 Hook
 */
export function useHabitAssessments(filters?: HabitAssessmentFilters): UseHabitAssessmentsReturn {
  const [data, setData] = useState<HabitAssessmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.studentId) params.append('studentId', filters.studentId);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/habit/assessments?${params.toString()}`);
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('获取习惯评价记录失败:', err);
      setError(err instanceof Error ? err.message : '获取习惯评价记录失败');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.studentId, filters?.category, filters?.startDate, filters?.endDate, filters?.limit]);

  const createAssessment = useCallback(async (params: CreateAssessmentParams): Promise<boolean> => {
    try {
      const response = await fetch('/api/habit/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const result = await response.json();
      
      if (result.success) {
        await fetchData(); // 刷新数据
        return true;
      }
      return false;
    } catch (err) {
      console.error('创建习惯评价记录失败:', err);
      return false;
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    createAssessment,
  };
}

// ==================== useHabitGoals Hook ====================

export interface UseHabitGoalsReturn {
  data: HabitGoalData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createGoal: (params: CreateGoalParams) => Promise<HabitGoalData | null>;
  updateGoal: (id: string, updates: Partial<HabitGoalData>) => Promise<boolean>;
  deleteGoal: (id: string) => Promise<boolean>;
}

/**
 * 小目标管理 Hook
 */
export function useHabitGoals(filters?: HabitGoalFilters): UseHabitGoalsReturn {
  const [data, setData] = useState<HabitGoalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.grade) params.append('grade', filters.grade.toString());

      const response = await fetch(`/api/habit/goals?${params.toString()}`);
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('获取小目标列表失败:', err);
      setError(err instanceof Error ? err.message : '获取小目标列表失败');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.category, filters?.status, filters?.grade]);

  const createGoal = useCallback(async (params: CreateGoalParams): Promise<HabitGoalData | null> => {
    try {
      const response = await fetch('/api/habit/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        await fetchData();
        return result.data;
      }
      return null;
    } catch (err) {
      console.error('创建小目标失败:', err);
      return null;
    }
  }, [fetchData]);

  const updateGoal = useCallback(async (id: string, updates: Partial<HabitGoalData>): Promise<boolean> => {
    try {
      const response = await fetch('/api/habit/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      const result = await response.json();
      
      if (result.success) {
        await fetchData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('更新小目标失败:', err);
      return false;
    }
  }, [fetchData]);

  const deleteGoal = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/habit/goals?id=${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.success) {
        await fetchData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('删除小目标失败:', err);
      return false;
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    createGoal,
    updateGoal,
    deleteGoal,
  };
}

// ==================== useHabitStars Hook ====================

export interface UseHabitStarsReturn {
  data: HabitStarData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createStar: (params: CreateStarParams) => Promise<HabitStarData | null>;
}

/**
 * 习惯之星 Hook
 */
export function useHabitStars(filters?: HabitStarFilters): UseHabitStarsReturn {
  const [data, setData] = useState<HabitStarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.month) params.append('month', filters.month);
      if (filters?.grade) params.append('grade', filters.grade.toString());
      if (filters?.category) params.append('category', filters.category);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/habit/stars?${params.toString()}`);
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('获取习惯之星列表失败:', err);
      setError(err instanceof Error ? err.message : '获取习惯之星列表失败');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.month, filters?.grade, filters?.category, filters?.limit]);

  const createStar = useCallback(async (params: CreateStarParams): Promise<HabitStarData | null> => {
    try {
      const response = await fetch('/api/habit/stars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        await fetchData();
        return result.data;
      }
      return null;
    } catch (err) {
      console.error('创建习惯之星记录失败:', err);
      return null;
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    createStar,
  };
}

// ==================== useSchoolHabitStats Hook ====================

export interface UseSchoolHabitStatsReturn {
  data: SchoolHabitStatsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 全校习惯统计 Hook（调用真实API）
 */
export function useSchoolHabitStats(month?: string): UseSchoolHabitStatsReturn {
  const [data, setData] = useState<SchoolHabitStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (month) params.append('month', month);

      const response = await fetch(`/api/habit/stats/school?${params.toString()}`);
      const result = await response.json();

      if (result.success && result.data) {
        // 转换API数据格式
        const apiData = result.data;
        
        // 转换类别统计
        const categoryStats: HabitCategoryStat[] = (apiData.categoryStats || []).map((cs: {
          category: HabitCategory;
          rate: number;
          change?: number;
          evaluationCount?: number;
          trend?: 'up' | 'down' | 'stable';
        }) => ({
          category: cs.category,
          name: habitCategoryNames[cs.category],
          rate: cs.rate,
          change: cs.change || 0,
          stars: cs.evaluationCount || 0,
          color: habitCategoryColors[cs.category],
          students: 0,
          totalStudents: apiData.overview?.totalStudents || 0,
          trend: cs.trend || 'stable',
          topGrade: '',
          weakGrade: '',
        }));

        // 转换年级统计
        const gradeStats: GradeHabitStat[] = (apiData.gradeStats || []).map((gs: {
          grade: string;
          gradeNumber: number;
          students: number;
          classes: number;
          avgRate: number;
          trend?: 'up' | 'down' | 'stable';
          stars: number;
          attention?: number;
        }) => ({
          grade: gs.grade,
          rate: gs.avgRate,
          stars: gs.stars,
          students: gs.students,
          trend: gs.trend || 'stable',
          avgRate: gs.avgRate,
          attention: gs.attention || 0,
          topHabit: '',
          weakHabit: '',
        }));

        setData({
          overview: apiData.overview,
          categoryStats,
          gradeStats,
          month: apiData.month,
        });
      } else {
        setData(null);
      }
    } catch (err) {
      console.error('获取全校习惯统计失败:', err);
      setError(err instanceof Error ? err.message : '获取全校习惯统计失败');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// ==================== useStudentGoals Hook ====================

/** 学生小目标数据 */
export interface StudentGoalData {
  id: string;
  studentId: string;
  goalId?: string;
  title: string;
  description?: string;
  category: HabitCategory;
  targetCount: number;
  completedCount: number;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'expired';
  month: string;
  progress: number;
  createdAt: string;
}

export interface UseStudentGoalsReturn {
  data: StudentGoalData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createGoal: (params: Omit<StudentGoalData, 'id' | 'completedCount' | 'progress' | 'createdAt'>) => Promise<StudentGoalData | null>;
}

/**
 * 学生小目标 Hook
 */
export function useStudentGoals(studentId?: string, month?: string): UseStudentGoalsReturn {
  const [data, setData] = useState<StudentGoalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!studentId) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('studentId', studentId);
      if (month) params.append('month', month);

      const response = await fetch(`/api/habit/student-goals?${params.toString()}`);
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('获取学生小目标失败:', err);
      setError(err instanceof Error ? err.message : '获取学生小目标失败');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [studentId, month]);

  const createGoal = useCallback(async (params: Omit<StudentGoalData, 'id' | 'completedCount' | 'progress' | 'createdAt'>): Promise<StudentGoalData | null> => {
    try {
      const response = await fetch('/api/habit/student-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        await fetchData();
        return result.data;
      }
      return null;
    } catch (err) {
      console.error('创建学生小目标失败:', err);
      return null;
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    createGoal,
  };
}

// ==================== useCheckIns Hook ====================

/** 打卡记录数据 */
export interface CheckInData {
  id: string;
  studentId: string;
  studentGoalId?: string;
  checkDate: string;
  category: HabitCategory;
  notes?: string;
  checkedBy?: string;
  checkedByType: 'parent' | 'student';
  checkedByName?: string;
  createdAt: string;
}

export interface UseCheckInsReturn {
  data: CheckInData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  checkIn: (params: {
    studentId: string;
    studentGoalId?: string;
    checkDate?: string;
    category: HabitCategory;
    notes?: string;
    checkedBy?: string;
    checkedByType?: 'parent' | 'student';
    checkedByName?: string;
  }) => Promise<CheckInData | null>;
  hasCheckedToday: (goalId: string) => boolean;
}

/**
 * 打卡记录 Hook
 */
export function useCheckIns(studentId?: string, month?: string): UseCheckInsReturn {
  const [data, setData] = useState<CheckInData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const fetchData = useCallback(async () => {
    if (!studentId) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('studentId', studentId);
      if (month) params.append('month', month);

      const response = await fetch(`/api/habit/check-ins?${params.toString()}`);
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('获取打卡记录失败:', err);
      setError(err instanceof Error ? err.message : '获取打卡记录失败');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [studentId, month]);

  const checkIn = useCallback(async (params: {
    studentId: string;
    studentGoalId?: string;
    checkDate?: string;
    category: HabitCategory;
    notes?: string;
    checkedBy?: string;
    checkedByType?: 'parent' | 'student';
    checkedByName?: string;
  }): Promise<CheckInData | null> => {
    try {
      const response = await fetch('/api/habit/check-ins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        await fetchData();
        return result.data;
      } else if (result.error) {
        throw new Error(result.error);
      }
      return null;
    } catch (err) {
      console.error('打卡失败:', err);
      throw err;
    }
  }, [fetchData]);

  const hasCheckedToday = useCallback((goalId: string): boolean => {
    return data.some(d => d.studentGoalId === goalId && d.checkDate === today);
  }, [data, today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    checkIn,
    hasCheckedToday,
  };
}

// ==================== 导出 ====================

// 导出类别名称和颜色
export { habitCategoryNames, habitCategoryColors };

// 默认导出
export default {
  useHabitAssessments,
  useHabitGoals,
  useHabitStars,
  useSchoolHabitStats,
  useStudentGoals,
  useCheckIns,
};
