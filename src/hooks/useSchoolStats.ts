/**
 * 学校统计数据 Hook
 * 
 * 从三大核心 Hook（useTeachers、useStudents、useClasses）聚合统计数据
 * 用于仪表盘和概览页面
 */

import { useState, useEffect, useMemo } from 'react';
import { useTeachers, type TeacherInfo } from './useTeachers';
import { useStudents, type StudentInfo } from './useStudents';
import { useClasses, type ClassContainer } from './useClasses';

export interface SchoolStats {
  // 学生统计（嵌套对象，兼容旧代码）
  students: {
    total: number;
    male: number;
    female: number;
    active: number;
    inactive: number;
    byGrade: Record<number, number>;
  };
  
  // 教师统计（嵌套对象，兼容旧代码）
  teachers: {
    total: number;
    male: number;
    female: number;
    bySubject: Record<string, number>;
    byTitle: { senior: number; middle: number; junior: number };
    byAge: { young: number; middle: number; senior: number };
    headTeachers: number;
  };
  
  // 班级统计（嵌套对象，兼容旧代码）
  classes: {
    total: number;
    byGrade: Record<number, number>;
    avgStudents: number;
    avgTeachers: number;
    list: Array<{ id: string; name: string; grade: number; studentCount: number; headTeacherId?: string; headTeacherName?: string }>;
  };
  
  // 学校信息
  school: {
    name: string;
    code: string;
    type: string;
    establishedYear: number;
    currentSemester: string;
    totalGrades: number;
    campusArea: number;
    awards: Array<{ name: string; year: number; level: string }>;
  };
  
  // 兼容旧版扁平属性
  teacherCount: number;
  maleTeacherCount: number;
  femaleTeacherCount: number;
  studentCount: number;
  maleStudentCount: number;
  femaleStudentCount: number;
  classCount: number;
  gradeCount: number;
  avgStudentsPerClass: number;
  avgTeachersPerClass: number;
}

export interface UseSchoolStatsReturn {
  data: SchoolStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * 学校统计数据 Hook
 */
export function useSchoolStats(): UseSchoolStatsReturn {
  const { teachers, loading: teachersLoading, refetch: refetchTeachers } = useTeachers();
  const { students, statistics: studentStats, loading: studentsLoading, refetch: refetchStudents } = useStudents();
  const { classes, loading: classesLoading, refetch: refetchClasses } = useClasses();
  
  const loading = teachersLoading || studentsLoading || classesLoading;
  
  const data = useMemo<SchoolStats | null>(() => {
    if (loading) return null;
    
    // 计算教师统计
    const teacherCount = teachers.length;
    const maleTeacherCount = teachers.filter(t => t.gender === 'male').length;
    const femaleTeacherCount = teachers.filter(t => t.gender === 'female').length;
    
    // 按学科分布
    const bySubject: Record<string, number> = {};
    teachers.forEach(t => {
      const subject = t.subject || '其他';
      bySubject[subject] = (bySubject[subject] || 0) + 1;
    });
    
    // 按职称分布（模拟）
    const byTitle = {
      senior: Math.floor(teacherCount * 0.18),
      middle: Math.floor(teacherCount * 0.52),
      junior: Math.floor(teacherCount * 0.30),
    };
    
    // 按年龄分布（模拟）
    const byAge = {
      young: Math.floor(teacherCount * 0.35),  // 35岁以下
      middle: Math.floor(teacherCount * 0.45), // 35-50岁
      senior: Math.floor(teacherCount * 0.20), // 50岁以上
    };
    
    // 学生统计来自 useStudents
    const studentCount = studentStats?.total || students.length;
    const maleStudentCount = studentStats?.maleCount || students.filter(s => s.gender === 'male').length;
    const femaleStudentCount = studentStats?.femaleCount || students.filter(s => s.gender === 'female').length;
    
    // 班级统计
    const classCount = classes.length;
    const grades = new Set(classes.map(c => c.grade));
    const gradeCount = grades.size;
    
    // 按年级分布
    const byGrade: Record<number, number> = {};
    classes.forEach(c => {
      byGrade[c.grade] = (byGrade[c.grade] || 0) + 1;
    });
    
    // 平均值
    const avgStudentsPerClass = classCount > 0 ? Math.round(studentCount / classCount) : 0;
    const avgTeachersPerClass = classCount > 0 ? Math.round(teacherCount / classCount) : 0;
    
    return {
      // 嵌套对象
      students: {
        total: studentCount,
        male: maleStudentCount,
        female: femaleStudentCount,
        active: studentCount, // 假设全部在校
        inactive: 0,
        byGrade: studentStats?.gradeDistribution || {},
      },
      teachers: {
        total: teacherCount,
        male: maleTeacherCount,
        female: femaleTeacherCount,
        bySubject,
        byTitle,
        byAge,
        headTeachers: classes.filter(c => c.headTeacherId).length,
      },
      classes: {
        total: classCount,
        byGrade,
        avgStudents: avgStudentsPerClass,
        avgTeachers: avgTeachersPerClass,
        list: classes.map(c => ({
          id: c.id,
          name: c.name,
          grade: c.grade,
          studentCount: c.students?.length || 0,
          headTeacherId: c.headTeacherId,
          headTeacherName: c.headTeacherName,
        })),
      },
      school: {
        name: '龙岩师范附属小学',
        code: '3508001001',
        type: '公办',
        establishedYear: 1912,
        currentSemester: '2024-2025学年第二学期',
        totalGrades: gradeCount,
        campusArea: 25000,
        awards: [
          { name: '全国文明校园', year: 2023, level: '国家级' },
          { name: '福建省示范小学', year: 2022, level: '省级' },
          { name: '龙岩市德育工作先进学校', year: 2024, level: '市级' },
        ],
      },
      
      // 扁平属性（兼容旧代码）
      teacherCount,
      maleTeacherCount,
      femaleTeacherCount,
      studentCount,
      maleStudentCount,
      femaleStudentCount,
      classCount,
      gradeCount,
      avgStudentsPerClass,
      avgTeachersPerClass,
    };
  }, [teachers, students, studentStats, classes, loading]);
  
  const refetch = () => {
    refetchTeachers();
    refetchStudents();
    refetchClasses();
  };
  
  return {
    data,
    loading,
    error: null,
    refetch,
  };
}

export default useSchoolStats;
