import { useState, useEffect, useCallback } from 'react';

/**
 * 习惯养成数据获取 Hook
 */

// 习惯类别类型
export type HabitCategory = 
  | 'civilization' | 'writing' | 'reading' | 'sports' 
  | 'safety' | 'hygiene' | 'aesthetic' | 'labor';

// 习惯类别名称映射
export const habitCategoryNames: Record<HabitCategory, string> = {
  civilization: '文明',
  writing: '书写',
  reading: '阅读',
  sports: '运动',
  safety: '安全',
  hygiene: '卫生',
  aesthetic: '审美',
  labor: '劳动',
};

// 习惯类别颜色映射
export const habitCategoryColors: Record<HabitCategory, string> = {
  civilization: 'bg-rose-100 text-rose-600',
  writing: 'bg-blue-100 text-blue-600',
  reading: 'bg-amber-100 text-amber-600',
  sports: 'bg-green-100 text-green-600',
  safety: 'bg-orange-100 text-orange-600',
  hygiene: 'bg-cyan-100 text-cyan-600',
  aesthetic: 'bg-purple-100 text-purple-600',
  labor: 'bg-emerald-100 text-emerald-600',
};

// 全校统计概览
export interface SchoolHabitOverview {
  totalStudents: number;
  totalClasses: number;
  totalTeachers: number;
  averageRate: number;
  rateChange: number;
  habitStars: number;
  starsChange: number;
  attentionStudents: number;
  attentionChange: number;
  monthlyEvaluations: number;
  goalsCompletion: number;
}

// 习惯类别统计
export interface HabitCategoryStat {
  category: HabitCategory;
  rate: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  evaluationCount?: number;
  topGrade?: string;
  weakGrade?: string;
}

// 年级统计
export interface GradeHabitStat {
  grade: string;
  gradeNumber: number;
  students: number;
  classes: number;
  avgRate: number;
  trend: 'up' | 'down' | 'stable';
  stars: number;
  attention: number;
  topHabit?: string;
  weakHabit?: string;
}

// 学校习惯统计响应
export interface SchoolHabitStatsResponse {
  overview: SchoolHabitOverview;
  categoryStats: HabitCategoryStat[];
  gradeStats: GradeHabitStat[];
  month: string;
}

// 小目标数据
export interface HabitGoal {
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

// 习惯之星
export interface HabitStar {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  grade: number;
  className: string;
  month: string;
  categories: HabitCategory[];
  totalScore: number;
  avatar?: string;
  achievements?: string;
}

// 学生习惯评价记录
export interface HabitAssessment {
  id: string;
  studentId: string;
  studentName: string;
  grade: number;
  className: string;
  category: HabitCategory;
  score: number;
  evaluatorId: string;
  evaluatorName: string;
  evaluatorType: 'teacher' | 'classmate' | 'parent' | 'self';
  context?: string;
  occurredAt: string;
  createdAt: string;
  notes?: string;
}

/**
 * 获取全校习惯统计
 */
export function useSchoolHabitStats(month?: string) {
  const [data, setData] = useState<SchoolHabitStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (month) params.append('month', month);
      
      const response = await fetch(`/api/habit/stats/school?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || '获取数据失败');
        // 使用模拟数据作为fallback
        setData(getMockSchoolStats());
      }
    } catch (err) {
      console.error('Failed to fetch school habit stats:', err);
      setError('网络错误');
      // 使用模拟数据作为fallback
      setData(getMockSchoolStats());
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 获取习惯养成目标列表
 */
export function useHabitGoals(filters?: {
  category?: HabitCategory;
  status?: 'active' | 'completed' | 'expired';
  grade?: number;
}) {
  const [data, setData] = useState<HabitGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.grade) params.append('grade', filters.grade.toString());
      
      const response = await fetch(`/api/habit/goals?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || '获取数据失败');
        setData([]);
      }
    } catch (err) {
      console.error('Failed to fetch habit goals:', err);
      setError('网络错误');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.category, filters?.status, filters?.grade]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 获取习惯之星列表
 */
export function useHabitStars(filters?: {
  month?: string;
  grade?: number;
  category?: HabitCategory;
  limit?: number;
}) {
  const [data, setData] = useState<HabitStar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.month) params.append('month', filters.month);
      if (filters?.grade) params.append('grade', filters.grade.toString());
      if (filters?.category) params.append('category', filters.category);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const response = await fetch(`/api/habit/stars?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || '获取数据失败');
        setData([]);
      }
    } catch (err) {
      console.error('Failed to fetch habit stars:', err);
      setError('网络错误');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.month, filters?.grade, filters?.category, filters?.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 获取学生习惯评价记录
 */
export function useHabitAssessments(filters?: {
  studentId?: string;
  category?: HabitCategory;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const [data, setData] = useState<HabitAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.studentId) params.append('studentId', filters.studentId);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const response = await fetch(`/api/habit/assessments?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || '获取数据失败');
        setData([]);
      }
    } catch (err) {
      console.error('Failed to fetch habit assessments:', err);
      setError('网络错误');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.studentId, filters?.category, filters?.startDate, filters?.endDate, filters?.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// 模拟数据（作为fallback）
function getMockSchoolStats(): SchoolHabitStatsResponse {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  return {
    overview: {
      totalStudents: 1896,
      totalClasses: 42,
      totalTeachers: 128,
      averageRate: 86.3,
      rateChange: 2.1,
      habitStars: 186,
      starsChange: 12,
      attentionStudents: 47,
      attentionChange: -8,
      monthlyEvaluations: 3428,
      goalsCompletion: 78.5,
    },
    categoryStats: [
      { category: 'civilization', rate: 89.2, trend: 'up', change: 2.3, topGrade: '三年级', weakGrade: '六年级' },
      { category: 'writing', rate: 78.5, trend: 'stable', change: 0.5, topGrade: '五年级', weakGrade: '一年级' },
      { category: 'reading', rate: 92.1, trend: 'up', change: 3.8, topGrade: '四年级', weakGrade: '二年级' },
      { category: 'sports', rate: 83.7, trend: 'up', change: 1.2, topGrade: '三年级', weakGrade: '六年级' },
      { category: 'safety', rate: 91.5, trend: 'stable', change: 0.2, topGrade: '二年级', weakGrade: '五年级' },
      { category: 'hygiene', rate: 85.8, trend: 'up', change: 1.5, topGrade: '四年级', weakGrade: '一年级' },
      { category: 'aesthetic', rate: 72.3, trend: 'down', change: -1.2, topGrade: '五年级', weakGrade: '二年级' },
      { category: 'labor', rate: 87.6, trend: 'up', change: 2.1, topGrade: '三年级', weakGrade: '六年级' },
    ],
    gradeStats: [
      { grade: '一年级', gradeNumber: 1, students: 320, classes: 6, avgRate: 82.1, trend: 'up', stars: 24, attention: 12 },
      { grade: '二年级', gradeNumber: 2, students: 315, classes: 6, avgRate: 84.5, trend: 'stable', stars: 28, attention: 9 },
      { grade: '三年级', gradeNumber: 3, students: 328, classes: 6, avgRate: 89.2, trend: 'up', stars: 38, attention: 5 },
      { grade: '四年级', gradeNumber: 4, students: 324, classes: 6, avgRate: 88.7, trend: 'up', stars: 36, attention: 6 },
      { grade: '五年级', gradeNumber: 5, students: 308, classes: 6, avgRate: 86.3, trend: 'stable', stars: 32, attention: 8 },
      { grade: '六年级', gradeNumber: 6, students: 301, classes: 6, avgRate: 85.1, trend: 'down', stars: 28, attention: 7 },
    ],
    month,
  };
}
