/**
 * 学生习惯数据 Hook
 * 
 * 基于学生数据提供习惯养成统计和分析功能
 * 用于德育习惯模块
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useStudents } from './useStudents';
import { HabitCategory as HabitCategoryType, habitCategoryNames as categoryNames, habitCategoryColors as categoryColors } from '@/types';

// 习惯类别类型
export type HabitCategory = HabitCategoryType;

// 导出类别名称和颜色（重命名避免冲突）
export const habitCategoryNames = categoryNames;
export const habitCategoryColors = categoryColors;

// 习惯统计数据结构
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

export interface SchoolHabitStatsData {
  overview: SchoolHabitOverview;
  categoryStats: HabitCategoryStat[];
  gradeStats: GradeHabitStat[];
}

export interface UseSchoolHabitStatsReturn {
  data: SchoolHabitStatsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * 学校习惯统计 Hook
 */
export function useSchoolHabitStats(): UseSchoolHabitStatsReturn {
  const { students, statistics, loading: studentsLoading, refetch } = useStudents();
  
  const loading = studentsLoading;
  
  const data = useMemo<SchoolHabitStatsData | null>(() => {
    if (loading) {
      // 返回默认数据结构，避免 null
      return {
        overview: {
          totalStudents: 0,
          totalClasses: 0,
          totalTeachers: 0,
          averageRate: 0,
          rateChange: 0,
          habitStars: 0,
          starsChange: 0,
          attentionStudents: 0,
          attentionChange: 0,
          monthlyEvaluations: 0,
          goalsCompletion: 0,
        },
        categoryStats: [],
        gradeStats: [],
      };
    }
    
    // 计算年级统计
    const gradeMap = new Map<string, { students: number; stars: number }>();
    students.forEach(s => {
      const grade = s.gradeName || `${s.grade}年级`;
      const current = gradeMap.get(grade) || { students: 0, stars: 0 };
      gradeMap.set(grade, {
        students: current.students + 1,
        stars: current.stars + (s.habitStars || 0),
      });
    });
    
    const gradeStats: GradeHabitStat[] = Array.from(gradeMap.entries()).map(([grade, data]) => ({
      grade,
      rate: data.students > 0 ? Math.round((data.stars / data.students) * 10) / 10 : 0,
      stars: data.stars,
      students: data.students,
      trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable' as const,
      avgRate: data.students > 0 ? 75 + Math.random() * 20 : 0,
      attention: Math.floor(data.students * 0.05),
      topHabit: '文明习惯',
      weakHabit: '劳动习惯',
    }));
    
    // 计算习惯类别统计（模拟数据，实际应从数据库获取）
    const categories: HabitCategory[] = [
      'civilization', 'writing', 'reading', 'sports',
      'safety', 'hygiene', 'aesthetic', 'labor'
    ];
    
    const categoryStats: HabitCategoryStat[] = categories.map(category => ({
      category,
      name: habitCategoryNames[category],
      rate: 75 + Math.random() * 20,
      change: Math.random() * 4 - 2,
      stars: Math.floor(Math.random() * 100),
      color: habitCategoryColors[category],
      students: Math.floor(students.length * (0.7 + Math.random() * 0.3)),
      totalStudents: students.length,
      trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable' as const,
      topGrade: '五年级',
      weakGrade: '一年级',
    }));
    
    // 概览数据
    const totalStudents = students.length;
    const totalClasses = new Set(students.map(s => s.classId)).size;
    const overview: SchoolHabitOverview = {
      totalStudents,
      totalClasses,
      totalTeachers: 0, // 从其他来源获取
      averageRate: 82.5,
      rateChange: 2.3,
      habitStars: Math.floor(totalStudents * 0.15),
      starsChange: 5,
      attentionStudents: Math.floor(totalStudents * 0.05),
      attentionChange: -2,
      monthlyEvaluations: totalStudents * 8,
      goalsCompletion: 85,
    };
    
    return {
      overview,
      categoryStats,
      gradeStats,
    };
  }, [students, loading]);
  
  return {
    data,
    loading,
    error: null,
    refetch,
  };
}

export default useSchoolHabitStats;
