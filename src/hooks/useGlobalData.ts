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
      total: globalStudents.total ?? globalStudents.data.length,
      maleCount: globalStudents.data.filter(s => s.gender === 'male').length,
      femaleCount: globalStudents.data.filter(s => s.gender === 'female').length,
      classCount: new Set(globalStudents.data.map(s => s.classId)).size,
      gradeDistribution,
      statusDistribution,
    }
  }, [globalStudents.data, globalStudents.total])

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
// 班级聚合相关类型（从 useClasses 复用）
// ============================================

/** 班级状态 */
export type ClassStatus = 'active' | 'inactive' | 'graduated'

/** 教师基本信息（班级聚合用） */
export interface TeacherBasicInfo {
  id: string
  name: string
  gender?: string
  phone?: string
  subject?: string
  title?: string
  avatar?: string
  primarySubject?: string
  subjects?: string[]
  headTeacherClassId?: string
  headTeacherClassName?: string
  subTeacherClasses?: Array<{ classId: string; className: string }>
}

/** 学生基本信息（班级聚合用） */
export interface StudentBasicInfo {
  id: string
  studentNo: string
  name: string
  gender: 'male' | 'female'
  birthDate?: string
  status: '在校' | '请假' | '休学' | '毕业' | '转学'
  avatar?: string
  parents: Parent[]
}

/** 家长基本信息（班级聚合展示用） */
export interface ParentBasicInfo {
  id?: string
  name: string
  relation: string
  relationName: string
  phone?: string
  isPrimary: boolean
  wechat?: string
  avatar?: string
  studentId: string
  studentName: string
  classId: string
  className: string
  grade: number
  headTeacherId?: string
  headTeacherName?: string
}

/** 教师候选人（用于智能推荐） */
export interface TeacherCandidate {
  id: string
  name: string
  subject: string
  subjects: string[]
  primaryRole: string
  department?: string
  title?: string
  teachableGrades: number[]
  isRecommended: boolean
  matchReason?: string
  currentClassId?: string
  currentClassName?: string
  isHeadTeacher: boolean
}

/** 班级容器 - 核心聚合根 */
export interface ClassContainer {
  id: string
  name: string
  grade: number
  gradeName: string
  classNumber: number
  headTeacherId: string
  headTeacherName: string
  headTeacher?: TeacherBasicInfo
  subTeacherId?: string
  subTeacherName?: string
  subTeacher?: TeacherBasicInfo
  students: StudentBasicInfo[]
  studentCount: number
  maleStudentCount: number
  femaleStudentCount: number
  parents: ParentBasicInfo[]
  parentCount: number
  classroomId?: string
  classroomName?: string
  building?: string
  floor?: number
  status: ClassStatus
  motto?: string
  features?: string[]
  createdAt?: string
  updatedAt?: string
}

/** 班级统计信息 */
export interface ClassStatistics {
  totalClasses: number
  activeClasses: number
  inactiveClasses: number
  totalStudents: number
  totalParents: number
  classesWithSubTeacher: number
  classesWithoutSubTeacher: number
  gradeDistribution: Record<number, number>
  avgStudentsPerClass: number
  avgParentsPerClass: number
}

// 年级名称映射
const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级']

// ============================================
// 全局班级数据 Hook（兼容 useClasses）
// ============================================

export function useGlobalClasses(initialFilters?: ClassFilters) {
  // 获取全局数据：classes、teachers、students
  const { 
    classes: globalClasses, 
    fetchClasses, 
    invalidateCache,
    teachers: globalTeachers,
    students: globalStudents,
    fetchTeachers,
    fetchStudents,
  } = useGlobalData()
  
  const [filters, setFilters] = useState<ClassFilters>(initialFilters || {})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState<number>(PAGINATION.DEFAULT_DISPLAY_PAGE_SIZE)

  // 触发加载 - 同时加载班级、教师、学生数据
  useEffect(() => {
    if (!globalClasses.loaded && !globalClasses.loading) {
      fetchClasses()
    }
    if (!globalTeachers.loaded && !globalTeachers.loading) {
      fetchTeachers()
    }
    if (!globalStudents.loaded && !globalStudents.loading) {
      fetchStudents()
    }
  }, [globalClasses.loaded, globalClasses.loading, fetchClasses, 
      globalTeachers.loaded, globalTeachers.loading, fetchTeachers,
      globalStudents.loaded, globalStudents.loading, fetchStudents])

  // ========== 核心聚合逻辑 ==========
  // 将全局的 classes、teachers、students 聚合成 ClassContainer
  const allClassesWithAggregation = useMemo(() => {
    // 如果数据未加载，返回空数组
    if (!globalClasses.loaded || globalClasses.data.length === 0) {
      return [] as ClassContainer[]
    }

    // 教师和学生数据可选，即使未加载也继续聚合（使用空数组）
    // 构建教师映射
    const teachersMap: Record<string, TeacherInfo> = {}
    if (globalTeachers.loaded) {
      globalTeachers.data.forEach(t => {
        teachersMap[t.id] = t
      })
    }

    // 构建学生映射（按班级分组）
    const studentsByClass: Record<string, StudentInfo[]> = {}
    if (globalStudents.loaded) {
      globalStudents.data.forEach(s => {
        if (!studentsByClass[s.classId]) {
        studentsByClass[s.classId] = []
        }
        studentsByClass[s.classId].push(s)
      })
    }

    // 聚合班级数据
    return globalClasses.data.map((cls): ClassContainer => {
      const classStudents = studentsByClass[cls.id] || []
      
      // 转换学生信息
      const students: StudentBasicInfo[] = classStudents.map(s => ({
        id: s.id,
        studentNo: s.studentNo,
        name: s.name,
        gender: s.gender,
        birthDate: s.birthDate,
        status: s.status as StudentBasicInfo['status'],
        avatar: s.avatar,
        parents: s.parents,
      }))

      // 获取班主任详情
      const headTeacherId = cls.headTeacherId || ''
      const headTeacher = headTeacherId ? teachersMap[headTeacherId] : undefined
      const headTeacherName = cls.headTeacherName || headTeacher?.name || ''

      // 获取科任详情
      const subTeacherId = cls.subTeacherId
      const subTeacher = subTeacherId ? teachersMap[subTeacherId] : undefined

      // 聚合家长信息
      const parents: ParentBasicInfo[] = []
      students.forEach(student => {
        if (student.parents && student.parents.length > 0) {
          student.parents.forEach(parent => {
            parents.push({
              id: parent.id,
              name: parent.name,
              relation: (parent.relation as string) || (parent.relationship as string) || 'other',
              relationName: (parent.relationship as string) || (parent.relationName as string) || '家长',
              phone: parent.phone,
              isPrimary: parent.isPrimary || false,
              wechat: parent.wechat as string | undefined,
              avatar: parent.avatar as string | undefined,
              studentId: student.id,
              studentName: student.name,
              classId: cls.id,
              className: cls.name,
              grade: cls.grade,
              headTeacherId,
              headTeacherName,
            })
          })
        }
      })

      return {
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        gradeName: cls.gradeName,
        classNumber: cls.classNumber || 1,
        headTeacherId,
        headTeacherName,
        headTeacher: headTeacher ? {
          id: headTeacher.id,
          name: headTeacher.name,
          gender: headTeacher.gender,
          phone: headTeacher.phone,
          primarySubject: headTeacher.subject,
          subjects: headTeacher.teachableSubjects,
          title: headTeacher.title,
          avatar: headTeacher.avatar,
          headTeacherClassId: headTeacher.headTeacherClassId,
          headTeacherClassName: headTeacher.headTeacherClassName,
          subTeacherClasses: headTeacher.subTeacherClasses,
        } : undefined,
        subTeacherId,
        subTeacherName: cls.subTeacherName || subTeacher?.name,
        subTeacher: subTeacher ? {
          id: subTeacher.id,
          name: subTeacher.name,
          gender: subTeacher.gender,
          phone: subTeacher.phone,
          primarySubject: subTeacher.subject,
          subjects: subTeacher.teachableSubjects,
          title: subTeacher.title,
          avatar: subTeacher.avatar,
          headTeacherClassId: subTeacher.headTeacherClassId,
          headTeacherClassName: subTeacher.headTeacherClassName,
          subTeacherClasses: subTeacher.subTeacherClasses,
        } : undefined,
        students,
        studentCount: students.length,
        maleStudentCount: students.filter(s => s.gender === 'male').length,
        femaleStudentCount: students.filter(s => s.gender === 'female').length,
        parents,
        parentCount: parents.length,
        classroomId: cls.classroomId,
        classroomName: cls.classroomName,
        building: cls.building,
        floor: cls.floor,
        status: (cls.status as ClassStatus) || 'active',
        motto: cls.motto,
        features: cls.features,
        createdAt: cls.createdAt,
        updatedAt: cls.updatedAt,
      }
    })
  }, [globalClasses, globalTeachers.loaded, globalTeachers.data, globalStudents.loaded, globalStudents.data])

  // ========== 筛选逻辑 ==========
  const filteredClasses = useMemo(() => {
    let result = allClassesWithAggregation

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.headTeacherName.toLowerCase().includes(searchLower)
      )
    }

    if (filters.grade && filters.grade !== 'all') {
      result = result.filter(c => c.grade === filters.grade)
    }

    if (filters.status && filters.status !== 'all') {
      result = result.filter(c => c.status === filters.status)
    }

    return result
  }, [allClassesWithAggregation, filters])

  // ========== 分页逻辑 ==========
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

  // ========== 统计数据 ==========
  const statistics = useMemo<ClassStatistics>(() => {
    const gradeDistribution: Record<number, number> = {}
    
    allClassesWithAggregation.forEach(c => {
      gradeDistribution[c.grade] = (gradeDistribution[c.grade] || 0) + 1
    })
    
    const totalStudents = allClassesWithAggregation.reduce((sum, c) => sum + c.studentCount, 0)
    const totalParents = allClassesWithAggregation.reduce((sum, c) => sum + c.parentCount, 0)
    
    return {
      totalClasses: allClassesWithAggregation.length,
      activeClasses: allClassesWithAggregation.filter(c => c.status === 'active').length,
      inactiveClasses: allClassesWithAggregation.filter(c => c.status !== 'active').length,
      totalStudents,
      totalParents,
      classesWithSubTeacher: allClassesWithAggregation.filter(c => c.subTeacherId).length,
      classesWithoutSubTeacher: allClassesWithAggregation.filter(c => !c.subTeacherId).length,
      gradeDistribution,
      avgStudentsPerClass: allClassesWithAggregation.length > 0 ? Math.round(totalStudents / allClassesWithAggregation.length) : 0,
      avgParentsPerClass: allClassesWithAggregation.length > 0 ? Math.round(totalParents / allClassesWithAggregation.length) : 0,
    }
  }, [allClassesWithAggregation])

  // ========== 工具方法 ==========
  const getClassById = useCallback((id: string) => 
    allClassesWithAggregation.find(c => c.id === id),
  [allClassesWithAggregation])

  const getClassesByGrade = useCallback((grade: number) => 
    allClassesWithAggregation.filter(c => c.grade === grade),
  [allClassesWithAggregation])

  const getClassesByHeadTeacher = useCallback((teacherId: string) => 
    allClassesWithAggregation.filter(c => c.headTeacherId === teacherId),
  [allClassesWithAggregation])

  const getStudentsByClass = useCallback((classId: string) => {
    const cls = allClassesWithAggregation.find(c => c.id === classId)
    return cls?.students || []
  }, [allClassesWithAggregation])

  const getParentsByClass = useCallback((classId: string) => {
    const cls = allClassesWithAggregation.find(c => c.id === classId)
    return cls?.parents || []
  }, [allClassesWithAggregation])

  const getPrimaryParentsByClass = useCallback((classId: string) => {
    const cls = allClassesWithAggregation.find(c => c.id === classId)
    return cls?.parents.filter(p => p.isPrimary) || []
  }, [allClassesWithAggregation])

  // ========== 班级管理方法 ==========
  const createClass = useCallback(async (data: Partial<ClassContainer>): Promise<boolean> => {
    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      if (result.success) {
        invalidateCache('classes')
        fetchClasses(true)
        return true
      }
      return false
    } catch (err) {
      console.error('创建班级失败:', err)
      return false
    }
  }, [invalidateCache, fetchClasses])

  const updateClass = useCallback(async (id: string, data: Partial<ClassContainer>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/classes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      if (result.success) {
        invalidateCache('classes')
        fetchClasses(true)
        return true
      }
      return false
    } catch (err) {
      console.error('更新班级失败:', err)
      return false
    }
  }, [invalidateCache, fetchClasses])

  const deleteClass = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/classes/${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (result.success) {
        invalidateCache('classes')
        fetchClasses(true)
        return true
      }
      return false
    } catch (err) {
      console.error('删除班级失败:', err)
      return false
    }
  }, [invalidateCache, fetchClasses])

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
        invalidateCache('teachers')
        fetchClasses(true)
        return true
      }
      return false
    } catch (err) {
      console.error('更新班主任失败:', err)
      return false
    }
  }, [invalidateCache, fetchClasses])

  const assignSubTeacher = useCallback(async (classId: string, teacherId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sub_teacher_id: teacherId }),
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

  const removeSubTeacher = useCallback(async (classId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sub_teacher_id: null }),
      })
      const result = await response.json()
      if (result.success) {
        invalidateCache('classes')
        fetchClasses(true)
        return true
      }
      return false
    } catch (err) {
      console.error('移除副班主任失败:', err)
      return false
    }
  }, [invalidateCache, fetchClasses])

  // ========== 科任智能推荐 ==========
  const getRecommendedSubTeachers = useCallback((
    classId: string,
    candidates: TeacherCandidate[]
  ): TeacherCandidate[] => {
    const targetClass = allClassesWithAggregation.find(c => c.id === classId)
    if (!targetClass) return []
    
    const targetGrade = targetClass.grade
    const headTeacherId = targetClass.headTeacherId
    
    // 筛选符合条件的教师
    const filtered = candidates.filter(teacher => {
      // 排除该班班主任
      if (teacher.id === headTeacherId) return false
      
      // 主要角色必须是班主任或科任教师
      if (teacher.primaryRole !== 'head_teacher' && teacher.primaryRole !== 'subject_teacher') {
        return false
      }
      
      // 检查可任教年级
      if (teacher.teachableGrades && teacher.teachableGrades.length > 0) {
        return teacher.teachableGrades.includes(targetGrade)
      }
      
      return true
    })
    
    // 按推荐优先级排序
    return filtered.map(teacher => {
      let isRecommended = false
      let matchReason = ''
      
      if (teacher.teachableGrades && teacher.teachableGrades.includes(targetGrade)) {
        isRecommended = true
        matchReason = `可任教${GRADE_NAMES[targetGrade]}`
      } else {
        matchReason = '未设置任教年级'
      }
      
      return {
        ...teacher,
        isRecommended,
        matchReason,
      }
    }).sort((a, b) => {
      if (a.isRecommended && !b.isRecommended) return -1
      if (!a.isRecommended && b.isRecommended) return 1
      return a.name.localeCompare(b.name)
    })
  }, [allClassesWithAggregation])

  // ========== 返回值 ==========
  return {
    // 数据
    allClasses: allClassesWithAggregation,
    classes,
    loading: globalClasses.loading || globalTeachers.loading || globalStudents.loading,
    error: globalClasses.error || globalTeachers.error || globalStudents.error,
    statistics,
    pagination,
    
    // 筛选
    filters,
    setFilters: (newFilters: ClassFilters) => {
      setFilters(newFilters)
      setPage(1)
    },
    
    // 查询方法
    fetchClasses: () => fetchClasses(true),
    refetch: () => { invalidateCache('classes'); fetchClasses(true) },
    getClassById,
    getClassesByGrade,
    getClassesByHeadTeacher,
    
    // 学生/家长聚合查询
    getStudentsByClass,
    getParentsByClass,
    getPrimaryParentsByClass,
    
    // 班级管理
    createClass,
    updateClass,
    deleteClass,
    updateHeadTeacher,
    assignSubTeacher,
    removeSubTeacher,
    
    // 科任智能推荐
    getRecommendedSubTeachers,
  }
}
