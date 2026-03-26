/**
 * 全局数据 Hooks（兼容层）
 * 
 * 与现有 hooks 接口兼容，但使用全局数据源
 * 解决多组件重复请求问题
 * 
 * @module hooks/useGlobalData
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useGlobalData } from '@/providers/GlobalDataProvider'
import { PAGINATION } from '@/lib/pagination-config'

// ============================================
// 角色常量（从 useTeachers 复用）
// ============================================

/** 教师主要角色类型 */
export type TeacherRole = 
  | 'principal'
  | 'secretary'
  | 'academic_vice_principal'
  | 'moral_vice_principal'
  | 'general_vice_principal'
  | 'head_teacher'
  | 'subject_teacher'
  | 'skill_teacher'
  | 'subject_head'

/** 行政职务类型 */
export type AdministrativeRole = 
  | 'academic_director'
  | 'moral_director'
  | 'general_director'
  | 'grade_leader'
  | 'research_group_leader'
  | 'research_group_deputy_leader'
  | 'young_pioneer_counselor'

/** 角色标签映射 */
export const TEACHER_ROLE_LABELS: Record<TeacherRole, string> = {
  principal: '校长',
  secretary: '书记',
  academic_vice_principal: '教学副校长',
  moral_vice_principal: '德育副校长',
  general_vice_principal: '总务副校长',
  head_teacher: '班主任',
  subject_teacher: '科任教师',
  skill_teacher: '技能课教师',
  subject_head: '学科组长',
}

/** 行政职务标签映射 */
export const ADMINISTRATIVE_ROLE_LABELS: Record<AdministrativeRole, string> = {
  academic_director: '教务主任',
  moral_director: '德育主任',
  general_director: '总务主任',
  grade_leader: '年段长',
  research_group_leader: '教研组组长',
  research_group_deputy_leader: '教研组副组长',
  young_pioneer_counselor: '少先队大队辅导员',
}

/** 角色颜色映射 */
export const TEACHER_ROLE_COLORS: Record<TeacherRole, { bg: string; text: string }> = {
  principal: { bg: 'bg-red-100', text: 'text-red-700' },
  secretary: { bg: 'bg-red-100', text: 'text-red-700' },
  academic_vice_principal: { bg: 'bg-rose-100', text: 'text-rose-700' },
  moral_vice_principal: { bg: 'bg-rose-100', text: 'text-rose-700' },
  general_vice_principal: { bg: 'bg-rose-100', text: 'text-rose-700' },
  head_teacher: { bg: 'bg-amber-100', text: 'text-amber-700' },
  subject_teacher: { bg: 'bg-blue-100', text: 'text-blue-700' },
  skill_teacher: { bg: 'bg-green-100', text: 'text-green-700' },
  subject_head: { bg: 'bg-teal-100', text: 'text-teal-700' },
}

/** 行政职务颜色映射 */
export const ADMINISTRATIVE_ROLE_COLORS: Record<AdministrativeRole, { bg: string; text: string }> = {
  academic_director: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  moral_director: { bg: 'bg-pink-100', text: 'text-pink-700' },
  general_director: { bg: 'bg-slate-100', text: 'text-slate-700' },
  grade_leader: { bg: 'bg-purple-100', text: 'text-purple-700' },
  research_group_leader: { bg: 'bg-orange-100', text: 'text-orange-700' },
  research_group_deputy_leader: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  young_pioneer_counselor: { bg: 'bg-rose-100', text: 'text-rose-700' },
}

// ============================================
// 类型定义（从现有 hooks 复用）
// ============================================

export type StudentStatus = '在校' | '请假' | '休学' | '毕业' | '转学'

export interface StudentFilters {
  search?: string
  grade?: number | 'all'
  classId?: string | 'all'
  status?: StudentStatus | 'all'
  familyType?: string | 'all'
}

export interface TeacherFilters {
  search?: string
  role?: string | 'all'
  department?: string | 'all'
  status?: string | 'all'
}

export interface ClassFilters {
  search?: string
  grade?: number | 'all'
  status?: string | 'all'
}

interface Parent {
  id?: string
  name: string
  relationship: string
  phone: string
  isPrimary?: boolean
  [key: string]: unknown
}

export interface StudentInfo {
  id: string
  studentNo: string
  name: string
  gender: 'male' | 'female'
  birthDate?: string
  avatar?: string
  grade: number
  gradeName: string
  classId: string
  className: string
  enrollmentDate?: string
  studentType?: string
  idCard?: string
  ethnicity?: string
  nativePlace?: string
  politicalStatus?: string
  phone?: string
  address?: string
  homeAddress?: string
  familyType?: string
  parents: Parent[]
  emergencyContact?: string
  emergencyPhone?: string
  headTeacherId?: string
  headTeacherName?: string
  status: StudentStatus | string
  habitStars?: number
  createdAt?: string
  updatedAt?: string
}

export interface TeacherInfo {
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
  avatar?: string
  birthDate?: string
  idCard?: string
  ethnicity?: string
  politicalStatus?: string
  nativePlace?: string
  emergencyContact?: string
  emergencyPhone?: string
  address?: string
  employeeId?: string
  titleDate?: string
  education?: string
  school?: string
  major?: string
  graduationDate?: string
  joinDate?: string
  teachYears?: number
  subTeacherClasses?: Array<{ classId: string; className: string }>
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface ClassInfo {
  id: string
  name: string
  grade: number
  gradeName: string
  headTeacherId?: string
  headTeacherName?: string
  studentCount: number
  classroom?: string
  status?: string
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

interface FrontendPaginationControl {
  page: number
  pageSize: number
  total: number
  totalPages: number
  pageSizeOptions: readonly number[]
  goToPage: (page: number) => void
  prevPage: () => void
  nextPage: () => void
  setPageSize: (size: number) => void
}

// ============================================
// 全局教师数据 Hook（兼容 useTeachers）
// ============================================

export function useGlobalTeachers(initialFilters?: TeacherFilters) {
  const { teachers: globalTeachers, fetchTeachers, invalidateCache } = useGlobalData()
  const [filters, setFilters] = useState<TeacherFilters>(initialFilters || {})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState<number>(PAGINATION.DEFAULT_DISPLAY_PAGE_SIZE)

  // 触发加载
  useEffect(() => {
    if (!globalTeachers.loaded && !globalTeachers.loading) {
      fetchTeachers()
    }
  }, [globalTeachers.loaded, globalTeachers.loading, fetchTeachers])

  // 筛选后的数据
  const filteredTeachers = useMemo(() => {
    let result = globalTeachers.data

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.department?.toLowerCase().includes(searchLower) ||
        t.phone?.includes(filters.search!)
      )
    }

    if (filters.role && filters.role !== 'all') {
      result = result.filter(t => t.primaryRole === filters.role)
    }

    if (filters.department && filters.department !== 'all') {
      result = result.filter(t => t.department === filters.department)
    }

    if (filters.status && filters.status !== 'all') {
      result = result.filter(t => t.status === filters.status)
    }

    return result
  }, [globalTeachers.data, filters])

  // 分页
  const total = filteredTeachers.length
  const totalPages = Math.ceil(total / pageSize)

  const teachers = useMemo(() => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return filteredTeachers.slice(start, end)
  }, [filteredTeachers, page, pageSize])

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages || 1)))
  }, [totalPages])

  const pagination: FrontendPaginationControl = useMemo(() => ({
    page,
    pageSize,
    total,
    totalPages,
    pageSizeOptions: PAGINATION.PAGE_SIZE_OPTIONS,
    goToPage,
    prevPage: () => setPage(p => Math.max(1, p - 1)),
    nextPage: () => setPage(p => Math.min(totalPages, p + 1)),
    setPageSize: (size) => { setPageSizeState(size); setPage(1) },
  }), [page, pageSize, total, totalPages, goToPage])

  // 统计数据
  const statistics = useMemo(() => {
    const byDepartment: Record<string, number> = {}
    const byTitle: Record<string, number> = {}

    globalTeachers.data.forEach(t => {
      byDepartment[t.department] = (byDepartment[t.department] || 0) + 1
      byTitle[t.title] = (byTitle[t.title] || 0) + 1
    })

    return {
      total: globalTeachers.data.length,
      leaders: globalTeachers.data.filter(t => 
        ['principal', 'secretary', 'academic_vice_principal', 'moral_vice_principal', 'general_vice_principal'].includes(t.primaryRole)
      ).length,
      headTeachers: globalTeachers.data.filter(t => t.primaryRole === 'head_teacher').length,
      subjectTeachers: globalTeachers.data.filter(t => t.primaryRole === 'subject_teacher').length,
      skillTeachers: globalTeachers.data.filter(t => t.primaryRole === 'skill_teacher').length,
      gradeLeaders: globalTeachers.data.filter(t => t.additionalRoles?.includes('grade_leader')).length,
      researchGroupLeaders: globalTeachers.data.filter(t => 
        t.additionalRoles?.includes('research_group_leader') || t.additionalRoles?.includes('research_group_deputy_leader')
      ).length,
      youngPioneerCounselors: globalTeachers.data.filter(t => t.additionalRoles?.includes('young_pioneer_counselor')).length,
      departments: new Set(globalTeachers.data.map(t => t.department)).size,
      byDepartment,
      byTitle,
    }
  }, [globalTeachers.data])

  // 工具方法
  const getTeacherById = useCallback((id: string) => 
    globalTeachers.data.find(t => t.id === id),
  [globalTeachers.data])

  const getTeachersByRole = useCallback((role: string) => 
    globalTeachers.data.filter(t => t.primaryRole === role),
  [globalTeachers.data])

  const getTeachersByDepartment = useCallback((department: string) => 
    globalTeachers.data.filter(t => t.department === department),
  [globalTeachers.data])

  const getHeadTeacherByClass = useCallback((classId: string) => 
    globalTeachers.data.find(t => t.headTeacherClassId === classId),
  [globalTeachers.data])

  const getTeachersByGrade = useCallback((grade: number) => 
    globalTeachers.data.filter(t => t.teachableGrades?.includes(grade)),
  [globalTeachers.data])

  // 更新教师角色（调用API）
  const updateTeacherRole = useCallback(async (config: {
    teacherId: string
    primaryRole: TeacherRole
    additionalRoles: AdministrativeRole[]
    primarySubject: string
    secondarySubjects: string[]
    totalWeeklyHours: number
    teachableGrades: number[]
  }): Promise<boolean> => {
    try {
      const response = await fetch(`/api/teachers/${config.teacherId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: config.primaryRole,
          additional_roles: config.additionalRoles,
          primary_subject: config.primarySubject,
          secondary_subjects: config.secondarySubjects,
          total_weekly_hours: config.totalWeeklyHours,
          teachable_grades: config.teachableGrades,
          is_head_teacher: config.primaryRole === 'head_teacher',
        }),
      })
      
      if (response.ok) {
        // 刷新数据
        invalidateCache('teachers')
        fetchTeachers(true)
        return true
      }
      return false
    } catch (err) {
      console.error('更新教师角色失败:', err)
      return false
    }
  }, [invalidateCache, fetchTeachers])

  // 获取角色标签
  const getRoleLabel = useCallback((role: TeacherRole | AdministrativeRole): string => {
    return TEACHER_ROLE_LABELS[role as TeacherRole] || 
           ADMINISTRATIVE_ROLE_LABELS[role as AdministrativeRole] || 
           role
  }, [])

  // 获取角色颜色
  const getRoleColor = useCallback((role: TeacherRole | AdministrativeRole): { bg: string; text: string } => {
    return TEACHER_ROLE_COLORS[role as TeacherRole] || 
           ADMINISTRATIVE_ROLE_COLORS[role as AdministrativeRole] || 
           { bg: 'bg-gray-100', text: 'text-gray-700' }
  }, [])

  return {
    teachers,
    allTeachers: filteredTeachers,
    loading: globalTeachers.loading,
    error: globalTeachers.error,
    statistics,
    pagination,
    filters,
    setFilters: (newFilters: TeacherFilters) => {
      setFilters(newFilters)
      setPage(1)
    },
    fetchTeachers: () => fetchTeachers(true),
    refetch: () => { invalidateCache('teachers'); fetchTeachers(true) },
    getTeacherById,
    getTeachersByRole,
    getTeachersByDepartment,
    getHeadTeacherByClass,
    getTeachersByGrade,
    updateTeacherRole,
    getRoleLabel,
    getRoleColor,
  }
}

// ============================================
// 全局学生数据 Hook（兼容 useStudents）
// ============================================

export function useGlobalStudents(initialFilters?: StudentFilters) {
  const { students: globalStudents, fetchStudents, invalidateCache } = useGlobalData()
  const [filters, setFilters] = useState<StudentFilters>(initialFilters || {})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState<number>(PAGINATION.DEFAULT_DISPLAY_PAGE_SIZE)

  // 触发加载
  useEffect(() => {
    if (!globalStudents.loaded && !globalStudents.loading) {
      fetchStudents()
    }
  }, [globalStudents.loaded, globalStudents.loading, fetchStudents])

  // 筛选后的数据
  const filteredStudents = useMemo(() => {
    let result = globalStudents.data

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(s => 
        s.name.toLowerCase().includes(searchLower) ||
        s.studentNo?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.grade && filters.grade !== 'all') {
      result = result.filter(s => s.grade === filters.grade)
    }

    if (filters.classId && filters.classId !== 'all') {
      result = result.filter(s => s.classId === filters.classId)
    }

    if (filters.status && filters.status !== 'all') {
      result = result.filter(s => s.status === filters.status)
    }

    return result
  }, [globalStudents.data, filters])

  // 分页
  const total = filteredStudents.length
  const totalPages = Math.ceil(total / pageSize)

  const students = useMemo(() => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return filteredStudents.slice(start, end)
  }, [filteredStudents, page, pageSize])

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages || 1)))
  }, [totalPages])

  const pagination: FrontendPaginationControl = useMemo(() => ({
    page,
    pageSize,
    total,
    totalPages,
    pageSizeOptions: PAGINATION.PAGE_SIZE_OPTIONS,
    goToPage,
    prevPage: () => setPage(p => Math.max(1, p - 1)),
    nextPage: () => setPage(p => Math.min(totalPages, p + 1)),
    setPageSize: (size) => { setPageSizeState(size); setPage(1) },
  }), [page, pageSize, total, totalPages, goToPage])

  // 统计数据
  const statistics = useMemo(() => {
    const gradeDistribution: Record<number, number> = {}
    const statusDistribution: Record<string, number> = {}

    globalStudents.data.forEach(s => {
      gradeDistribution[s.grade] = (gradeDistribution[s.grade] || 0) + 1
      statusDistribution[s.status] = (statusDistribution[s.status] || 0) + 1
    })

    return {
      total: globalStudents.data.length,
      maleCount: globalStudents.data.filter(s => s.gender === 'male').length,
      femaleCount: globalStudents.data.filter(s => s.gender === 'female').length,
      classCount: new Set(globalStudents.data.map(s => s.classId)).size,
      gradeDistribution,
      statusDistribution,
    }
  }, [globalStudents.data])

  // 工具方法
  const getStudentById = useCallback((id: string) => 
    globalStudents.data.find(s => s.id === id),
  [globalStudents.data])

  const getStudentsByClass = useCallback((classId: string) => 
    globalStudents.data.filter(s => s.classId === classId),
  [globalStudents.data])

  const getStudentsByGrade = useCallback((grade: number) => 
    globalStudents.data.filter(s => s.grade === grade),
  [globalStudents.data])

  const getStudentsByStatus = useCallback((status: StudentStatus) => 
    globalStudents.data.filter(s => s.status === status),
  [globalStudents.data])

  const getParentsByStudent = useCallback((studentId: string): Parent[] => {
    const student = globalStudents.data.find(s => s.id === studentId)
    return student?.parents || []
  }, [globalStudents.data])

  const getPrimaryParent = useCallback((studentId: string): Parent | undefined => {
    const student = globalStudents.data.find(s => s.id === studentId)
    if (!student?.parents || student.parents.length === 0) return undefined
    return student.parents.find(p => p.isPrimary) || student.parents[0]
  }, [globalStudents.data])

  // 创建学生（调用API）
  const createStudent = useCallback(async (data: Partial<StudentInfo> & { classId: string }): Promise<boolean> => {
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      if (result.success) {
        invalidateCache('students')
        fetchStudents(true)
        return true
      }
      return false
    } catch (err) {
      console.error('创建学生失败:', err)
      return false
    }
  }, [invalidateCache, fetchStudents])

  // 更新学生（调用API）
  const updateStudent = useCallback(async (id: string, data: Partial<StudentInfo>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      if (result.success) {
        invalidateCache('students')
        fetchStudents(true)
        return true
      }
      return false
    } catch (err) {
      console.error('更新学生失败:', err)
      return false
    }
  }, [invalidateCache, fetchStudents])

  // 删除学生（调用API）
  const deleteStudent = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (result.success) {
        invalidateCache('students')
        fetchStudents(true)
        return true
      }
      return false
    } catch (err) {
      console.error('删除学生失败:', err)
      return false
    }
  }, [invalidateCache, fetchStudents])

  return {
    students,
    allStudents: filteredStudents,
    loading: globalStudents.loading,
    error: globalStudents.error,
    statistics,
    pagination,
    filters,
    setFilters: (newFilters: StudentFilters) => {
      setFilters(newFilters)
      setPage(1)
    },
    fetchStudents: () => fetchStudents(true),
    refetch: () => { invalidateCache('students'); fetchStudents(true) },
    getStudentById,
    getStudentsByClass,
    getStudentsByGrade,
    getStudentsByStatus,
    getParentsByStudent,
    getPrimaryParent,
    createStudent,
    updateStudent,
    deleteStudent,
  }
}

// ============================================
// 全局班级数据 Hook（兼容 useClasses）
// ============================================

export function useGlobalClasses(initialFilters?: ClassFilters) {
  const { classes: globalClasses, fetchClasses, invalidateCache } = useGlobalData()
  const [filters, setFilters] = useState<ClassFilters>(initialFilters || {})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState<number>(PAGINATION.DEFAULT_DISPLAY_PAGE_SIZE)

  // 触发加载
  useEffect(() => {
    if (!globalClasses.loaded && !globalClasses.loading) {
      fetchClasses()
    }
  }, [globalClasses.loaded, globalClasses.loading, fetchClasses])

  // 筛选后的数据
  const filteredClasses = useMemo(() => {
    let result = globalClasses.data

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.headTeacherName?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.grade && filters.grade !== 'all') {
      result = result.filter(c => c.grade === filters.grade)
    }

    return result
  }, [globalClasses.data, filters])

  // 分页
  const total = filteredClasses.length
  const totalPages = Math.ceil(total / pageSize)

  const classes = useMemo(() => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return filteredClasses.slice(start, end)
  }, [filteredClasses, page, pageSize])

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages || 1)))
  }, [totalPages])

  const pagination: FrontendPaginationControl = useMemo(() => ({
    page,
    pageSize,
    total,
    totalPages,
    pageSizeOptions: PAGINATION.PAGE_SIZE_OPTIONS,
    goToPage,
    prevPage: () => setPage(p => Math.max(1, p - 1)),
    nextPage: () => setPage(p => Math.min(totalPages, p + 1)),
    setPageSize: (size) => { setPageSizeState(size); setPage(1) },
  }), [page, pageSize, total, totalPages, goToPage])

  // 统计数据
  const statistics = useMemo(() => {
    const gradeDistribution: Record<number, number> = {}

    globalClasses.data.forEach(c => {
      gradeDistribution[c.grade] = (gradeDistribution[c.grade] || 0) + 1
    })

    return {
      total: globalClasses.data.length,
      totalStudents: globalClasses.data.reduce((sum, c) => sum + (c.studentCount || 0), 0),
      gradeDistribution,
    }
  }, [globalClasses.data])

  // 工具方法
  const getClassById = useCallback((id: string) => 
    globalClasses.data.find(c => c.id === id),
  [globalClasses.data])

  const getClassesByGrade = useCallback((grade: number) => 
    globalClasses.data.filter(c => c.grade === grade),
  [globalClasses.data])

  // 分配副班主任（科任）
  const assignSubTeacher = useCallback(async (classId: string, teacherId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sub_teacher_id: teacherId || null }),
      })
      const result = await response.json()
      if (result.success) {
        invalidateCache('classes')
        fetchClasses(true)
        return true
      }
      return false
    } catch (err) {
      console.error('分配副班主任失败:', err)
      return false
    }
  }, [invalidateCache, fetchClasses])

  // 更新班主任
  const updateHeadTeacher = useCallback(async (classId: string, teacherId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ head_teacher_id: teacherId }),
      })
      const result = await response.json()
      if (result.success) {
        invalidateCache('classes')
        fetchClasses(true)
        // 同时刷新教师数据（因为班主任可能变化）
        invalidateCache('teachers')
        return true
      }
      return false
    } catch (err) {
      console.error('更新班主任失败:', err)
      return false
    }
  }, [invalidateCache, fetchClasses])

  // 获取推荐的副班主任
  const getRecommendedSubTeachers = useCallback((classId: string, _grade: number, _subject: string) => {
    // 简单实现：返回所有科任教师
    return globalClasses.data
      .filter(c => c.id !== classId)
      .slice(0, 5)
      .map(c => ({
        id: `rec-${c.id}`,
        name: c.headTeacherName || '推荐教师',
        subject: '语文',
        isRecommended: true,
      }))
  }, [globalClasses.data])

  return {
    classes,
    allClasses: filteredClasses,
    loading: globalClasses.loading,
    error: globalClasses.error,
    statistics,
    pagination,
    filters,
    setFilters: (newFilters: ClassFilters) => {
      setFilters(newFilters)
      setPage(1)
    },
    fetchClasses: () => fetchClasses(true),
    refetch: () => { invalidateCache('classes'); fetchClasses(true) },
    getClassById,
    getClassesByGrade,
    assignSubTeacher,
    updateHeadTeacher,
    getRecommendedSubTeachers,
  }
}
