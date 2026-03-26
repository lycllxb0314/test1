/**
 * 全局数据状态管理
 * 
 * 解决多个组件重复请求同一数据的问题
 * 采用 Context + 单例模式，确保全局数据只请求一次
 * 
 * @module providers/GlobalDataProvider
 */

'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { PAGINATION } from '@/lib/pagination-config'

// ============================================
// 类型定义
// ============================================

/** 数据状态 */
interface DataState<T> {
  data: T[]
  loading: boolean
  error: string | null
  loaded: boolean
  lastFetch: number | null
}

/** 全局数据上下文 */
interface GlobalDataContextType {
  // 教师数据
  teachers: DataState<TeacherInfo>
  fetchTeachers: (force?: boolean) => Promise<void>
  
  // 学生数据
  students: DataState<StudentInfo>
  fetchStudents: (force?: boolean) => Promise<void>
  
  // 班级数据
  classes: DataState<ClassInfo>
  fetchClasses: (force?: boolean) => Promise<void>
  
  // 通用方法
  invalidateCache: (key?: string) => void
  getCacheStatus: () => Record<string, { loaded: boolean; age: number | null }>
}

// 基础类型（简化版，避免循环依赖）
interface TeacherInfo {
  id: string
  name: string
  gender: string
  subject: string
  title: string
  department: string
  phone: string
  email: string
  status: string
  primaryRole: string
  additionalRoles: string[]
  weeklyHours: number
  currentHours: number
  teachableSubjects: string[]
  teachableGrades: number[]
  isHeadTeacher: boolean
  headTeacherClassId?: string
  headTeacherClassName?: string
  subTeacherClasses?: Array<{ classId: string; className: string }>
  teachYears?: number
  [key: string]: unknown
}

interface Parent {
  id?: string
  name: string
  relationship: string
  phone: string
  isPrimary?: boolean
  [key: string]: unknown
}

interface StudentInfo {
  id: string
  studentNo: string
  name: string
  gender: 'male' | 'female'
  grade: number
  gradeName: string
  classId: string
  className: string
  status: string
  parents: Parent[]
  [key: string]: unknown
}

interface ClassInfo {
  id: string
  name: string
  grade: number
  gradeName: string
  headTeacherId?: string
  headTeacherName?: string
  studentCount: number
  [key: string]: unknown
}

// ============================================
// Context
// ============================================

const GlobalDataContext = createContext<GlobalDataContextType | null>(null)

// ============================================
// 缓存配置
// ============================================

const CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存

// ============================================
// Provider 组件
// ============================================

export function GlobalDataProvider({ children }: { children: React.ReactNode }) {
  // 教师状态
  const [teachers, setTeachers] = useState<DataState<TeacherInfo>>({
    data: [],
    loading: false,
    error: null,
    loaded: false,
    lastFetch: null,
  })
  
  // 学生状态
  const [students, setStudents] = useState<DataState<StudentInfo>>({
    data: [],
    loading: false,
    error: null,
    loaded: false,
    lastFetch: null,
  })
  
  // 班级状态
  const [classes, setClasses] = useState<DataState<ClassInfo>>({
    data: [],
    loading: false,
    error: null,
    loaded: false,
    lastFetch: null,
  })

  // 请求锁（防止并发重复请求）
  const fetchingRef = useRef<Set<string>>(new Set())

  // ============================================
  // 数据获取函数
  // ============================================

  // 获取教师数据
  const fetchTeachers = useCallback(async (force = false) => {
    // 检查是否正在请求
    if (fetchingRef.current.has('teachers')) return
    
    // 检查缓存是否有效
    if (!force && teachers.loaded && teachers.lastFetch) {
      const age = Date.now() - teachers.lastFetch
      if (age < CACHE_TTL) return
    }

    fetchingRef.current.add('teachers')
    setTeachers(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch(`/api/teachers?pageSize=${PAGINATION.ENTITY_CONFIG.teachers.fetchPageSize}`)
      const result = await response.json()

      if (result.success && result.data) {
        const formattedData: TeacherInfo[] = result.data.map((t: Record<string, unknown>) => ({
          id: t.id as string,
          name: t.name as string,
          gender: t.gender === 'male' ? '男' : t.gender === 'female' ? '女' : '男',
          subject: (t.primarySubject as string) || (t.primary_subject as string) || (t.subjects as string[])?.[0] || '语文',
          title: (t.title as string) || '二级教师',
          department: (t.department as string) || `${(t.subjects as string[])?.[0] || '语文'}组`,
          phone: (t.phone as string) || '',
          email: (t.email as string) || '',
          status: (t.status as string) || 'active',
          primaryRole: (t.primaryRole as string) || (t.role as string) || 'subject_teacher',
          additionalRoles: (t.additionalRoles as string[]) || (t.additional_roles as string[]) || [],
          weeklyHours: (t.weeklyHours as number) || (t.total_weekly_hours as number) || 13,
          currentHours: (t.currentHours as number) || (t.used_hours as number) || 0,
          teachableSubjects: (t.teachableSubjects as string[]) || (t.teachable_subjects as string[]) || [],
          teachableGrades: (t.teachableGrades as number[]) || (t.teachable_grades as number[]) || [1, 2, 3, 4, 5, 6],
          isHeadTeacher: (t.isHeadTeacher as boolean) || false,
          headTeacherClassId: (t.headTeacherClassId as string) || (t.head_teacher_class_id as string),
          headTeacherClassName: (t.headTeacherClassName as string) || (t.head_teacher_class_name as string),
          subTeacherClasses: (t.subTeacherClasses as Array<{ classId: string; className: string }>) || [],
          teachYears: (t.teachYears as number) || (t.teach_years as number) || 0,
        }))

        setTeachers({
          data: formattedData,
          loading: false,
          error: null,
          loaded: true,
          lastFetch: Date.now(),
        })
      } else {
        setTeachers(prev => ({
          ...prev,
          loading: false,
          error: result.error || '获取教师数据失败',
        }))
      }
    } catch (err) {
      setTeachers(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : '获取教师数据失败',
      }))
    } finally {
      fetchingRef.current.delete('teachers')
    }
  }, [teachers.loaded, teachers.lastFetch])

  // 获取学生数据
  const fetchStudents = useCallback(async (force = false) => {
    if (fetchingRef.current.has('students')) return
    
    if (!force && students.loaded && students.lastFetch) {
      const age = Date.now() - students.lastFetch
      if (age < CACHE_TTL) return
    }

    fetchingRef.current.add('students')
    setStudents(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch(`/api/students?pageSize=${PAGINATION.ENTITY_CONFIG.students.maxTotal}`)
      const result = await response.json()

      if (result.success && result.data) {
        const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
        
        const formattedData: StudentInfo[] = result.data.map((s: Record<string, unknown>) => ({
          id: s.id as string,
          studentNo: (s.studentNo as string) || (s.student_no as string) || '',
          name: s.name as string,
          gender: (s.gender as StudentInfo['gender']) || 'male',
          grade: (s.grade as number) || 1,
          gradeName: GRADE_NAMES[s.grade as number] || '一年级',
          classId: (s.classId as string) || (s.class_id as string) || '',
          className: (s.className as string) || (s.class_name as string) || '',
          status: (s.status as string) || '在校',
          parents: (s.parents as Parent[]) || [],
        }))

        setStudents({
          data: formattedData,
          loading: false,
          error: null,
          loaded: true,
          lastFetch: Date.now(),
        })
      } else {
        setStudents(prev => ({
          ...prev,
          loading: false,
          error: result.error || '获取学生数据失败',
        }))
      }
    } catch (err) {
      setStudents(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : '获取学生数据失败',
      }))
    } finally {
      fetchingRef.current.delete('students')
    }
  }, [students.loaded, students.lastFetch])

  // 获取班级数据
  const fetchClasses = useCallback(async (force = false) => {
    if (fetchingRef.current.has('classes')) return
    
    if (!force && classes.loaded && classes.lastFetch) {
      const age = Date.now() - classes.lastFetch
      if (age < CACHE_TTL) return
    }

    fetchingRef.current.add('classes')
    setClasses(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch('/api/classes?pageSize=100')
      const result = await response.json()

      if (result.success && result.data) {
        const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
        
        const formattedData: ClassInfo[] = result.data.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          name: c.name as string,
          grade: (c.grade as number) || 1,
          gradeName: GRADE_NAMES[c.grade as number] || '一年级',
          headTeacherId: (c.headTeacherId as string) || (c.head_teacher_id as string),
          headTeacherName: (c.headTeacherName as string) || (c.head_teacher_name as string),
          studentCount: (c.studentCount as number) || (c.student_count as number) || 0,
        }))

        setClasses({
          data: formattedData,
          loading: false,
          error: null,
          loaded: true,
          lastFetch: Date.now(),
        })
      } else {
        setClasses(prev => ({
          ...prev,
          loading: false,
          error: result.error || '获取班级数据失败',
        }))
      }
    } catch (err) {
      setClasses(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : '获取班级数据失败',
      }))
    } finally {
      fetchingRef.current.delete('classes')
    }
  }, [classes.loaded, classes.lastFetch])

  // ============================================
  // 工具方法
  // ============================================

  // 使缓存失效
  const invalidateCache = useCallback((key?: string) => {
    if (key === 'teachers') {
      setTeachers(prev => ({ ...prev, loaded: false, lastFetch: null }))
    } else if (key === 'students') {
      setStudents(prev => ({ ...prev, loaded: false, lastFetch: null }))
    } else if (key === 'classes') {
      setClasses(prev => ({ ...prev, loaded: false, lastFetch: null }))
    } else {
      // 清除所有
      setTeachers(prev => ({ ...prev, loaded: false, lastFetch: null }))
      setStudents(prev => ({ ...prev, loaded: false, lastFetch: null }))
      setClasses(prev => ({ ...prev, loaded: false, lastFetch: null }))
    }
  }, [])

  // 获取缓存状态
  const getCacheStatus = useCallback(() => {
    return {
      teachers: {
        loaded: teachers.loaded,
        age: teachers.lastFetch ? Date.now() - teachers.lastFetch : null,
      },
      students: {
        loaded: students.loaded,
        age: students.lastFetch ? Date.now() - students.lastFetch : null,
      },
      classes: {
        loaded: classes.loaded,
        age: classes.lastFetch ? Date.now() - classes.lastFetch : null,
      },
    }
  }, [teachers.loaded, teachers.lastFetch, students.loaded, students.lastFetch, classes.loaded, classes.lastFetch])

  // ============================================
  // 自动预加载
  // ============================================

  useEffect(() => {
    // 组件挂载时预加载核心数据
    if (!teachers.loaded) fetchTeachers()
    if (!classes.loaded) fetchClasses()
    // 学生数据延迟加载（数据量较大）
    const timer = setTimeout(() => {
      if (!students.loaded) fetchStudents()
    }, 1000)
    
    return () => clearTimeout(timer)
  // 仅在首次挂载时执行
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ============================================
  // Context 值
  // ============================================

  const value = useMemo(() => ({
    teachers,
    fetchTeachers,
    students,
    fetchStudents,
    classes,
    fetchClasses,
    invalidateCache,
    getCacheStatus,
  }), [
    teachers, fetchTeachers,
    students, fetchStudents,
    classes, fetchClasses,
    invalidateCache, getCacheStatus,
  ])

  return (
    <GlobalDataContext.Provider value={value}>
      {children}
    </GlobalDataContext.Provider>
  )
}

// ============================================
// Hook
// ============================================

/**
 * 获取全局数据上下文
 */
export function useGlobalData() {
  const context = useContext(GlobalDataContext)
  if (!context) {
    throw new Error('useGlobalData must be used within GlobalDataProvider')
  }
  return context
}

/**
 * 获取教师数据（全局单例）
 */
export function useGlobalTeachers() {
  const { teachers, fetchTeachers, invalidateCache } = useGlobalData()
  
  // 触发加载
  useEffect(() => {
    if (!teachers.loaded && !teachers.loading) {
      fetchTeachers()
    }
  }, [teachers.loaded, teachers.loading, fetchTeachers])

  return {
    teachers: teachers.data,
    loading: teachers.loading,
    error: teachers.error,
    refetch: () => {
      invalidateCache('teachers')
      fetchTeachers(true)
    },
  }
}

/**
 * 获取学生数据（全局单例）
 */
export function useGlobalStudents() {
  const { students, fetchStudents, invalidateCache } = useGlobalData()
  
  useEffect(() => {
    if (!students.loaded && !students.loading) {
      fetchStudents()
    }
  }, [students.loaded, students.loading, fetchStudents])

  return {
    students: students.data,
    loading: students.loading,
    error: students.error,
    refetch: () => {
      invalidateCache('students')
      fetchStudents(true)
    },
  }
}

/**
 * 获取班级数据（全局单例）
 */
export function useGlobalClasses() {
  const { classes, fetchClasses, invalidateCache } = useGlobalData()
  
  useEffect(() => {
    if (!classes.loaded && !classes.loading) {
      fetchClasses()
    }
  }, [classes.loaded, classes.loading, fetchClasses])

  return {
    classes: classes.data,
    loading: classes.loading,
    error: classes.error,
    refetch: () => {
      invalidateCache('classes')
      fetchClasses(true)
    },
  }
}

export default GlobalDataProvider
