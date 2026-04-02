/**
 * 学生数据管理 Hook
 * 
 * ==================== 架构定位 ====================
 * 学生是完整实体，但从属班级。
 * 学生本身是完整实体（有个人信息、学籍信息、家庭信息、成长档案等），
 * 但必须归属班级，不能脱离班级独立存在。
 * 
 * ==================== 职责边界 ====================
 * 1. 学生必须归属班级，classId 是必填字段
 * 2. 提供完整的学生管理功能（创建、更新、删除）
 * 3. 提供学生完整档案（学业、荣誉、成长、习惯、德育）
 * 4. 包含家长信息，但不独立管理家长
 * 5. 提供班级关联查询方法
 * 
 * ==================== 关联关系 ====================
 * - 从属班级：必须通过 classId 关联班级
 * - 包含家长：家长信息嵌入学生数据中
 * - 不依赖其他 Hook，独立获取数据
 * 
 * ==================== 数据获取 ====================
 * - 使用统一分页配置 (src/lib/pagination-config.ts)
 * - 支持大数据量获取，确保获取所有学生数据
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PAGINATION } from '@/lib/pagination-config';
import { withAuth } from '@/lib/auth-client';
import type { 
  Parent, 
  StudentFullProfile, 
  StudentAcademicRecord, 
  StudentHonor, 
  StudentGrowthRecord,
  HabitCategory,
  HabitAssessment,
} from '@/types';

// ==================== 类型定义 ====================

/** 学生状态 */
export type StudentStatus = '在校' | '请假' | '休学' | '毕业' | '转学';

/** 学生筛选参数 */
export interface StudentFilters {
  search?: string;
  grade?: number | 'all';
  classId?: string | 'all';
  status?: StudentStatus | 'all';
  familyType?: string | 'all';
}

/** 学生完整信息 */
export interface StudentInfo {
  // === 基本信息 ===
  id: string;
  studentNo: string;
  name: string;
  gender: 'male' | 'female';
  birthDate?: string;
  avatar?: string;
  
  // === 学籍信息（班级归属 - 核心关联） ===
  grade: number;
  gradeName: string;
  classId: string;              // 必填：班级归属
  className: string;
  enrollmentDate?: string;
  studentType?: string;         // 学生类型（户籍、借读等）
  
  // === 身份信息 ===
  idCard?: string;
  ethnicity?: string;
  nativePlace?: string;
  politicalStatus?: string;
  
  // === 联系信息 ===
  phone?: string;
  address?: string;
  homeAddress?: string;
  
  // === 家庭信息 ===
  familyType?: string;
  parents: Parent[];            // 家长信息嵌入学生数据
  emergencyContact?: string;
  emergencyPhone?: string;
  
  // === 班主任信息（从班级关联获取） ===
  headTeacherId?: string;
  headTeacherName?: string;
  
  // === 状态 ===
  status: StudentStatus;
  
  // === 习惯养成 ===
  habitStars?: number;
  
  // === 时间戳 ===
  createdAt?: string;
  updatedAt?: string;
}

/** 学生统计信息 */
export interface StudentStatistics {
  total: number;
  maleCount: number;
  femaleCount: number;
  classCount: number;
  gradeDistribution: Record<number, number>;
  statusDistribution: Record<string, number>;
  familyTypeDistribution: Record<string, number>;
}

/** 分页信息 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** 前端分页控制 */
export interface FrontendPaginationControl {
  /** 当前页码 */
  page: number;
  /** 每页显示数量 */
  pageSize: number;
  /** 总数量 */
  total: number;
  /** 总页数 */
  totalPages: number;
  /** 每页数量选项 */
  pageSizeOptions: readonly number[];
  /** 跳转到指定页 */
  goToPage: (page: number) => void;
  /** 上一页 */
  prevPage: () => void;
  /** 下一页 */
  nextPage: () => void;
  /** 设置每页显示数量 */
  setPageSize: (size: number) => void;
}

/** Hook 返回类型 */
export interface UseStudentsReturn {
  // === 数据 ===
  /** 当前页数据（前端分页后） */
  students: StudentInfo[];
  /** 全部数据（后端获取的所有数据） */
  allStudents: StudentInfo[];
  loading: boolean;
  error: string | null;
  
  // === 统计 ===
  statistics: StudentStatistics;
  
  // === 前端分页（内部集成） ===
  pagination: FrontendPaginationControl;
  
  // === 筛选 ===
  filters: StudentFilters;
  setFilters: (filters: StudentFilters) => void;
  
  // === 查询方法 ===
  fetchStudents: () => Promise<void>;
  refetch: () => Promise<void>;
  getStudentById: (id: string) => StudentInfo | undefined;
  
  // === 班级关联查询（核心方法） ===
  getStudentsByClass: (classId: string) => StudentInfo[];
  getStudentsByGrade: (grade: number) => StudentInfo[];
  getStudentsByStatus: (status: StudentStatus) => StudentInfo[];
  
  // === 家长相关 ===
  getParentsByStudent: (studentId: string) => Parent[];
  getPrimaryParent: (studentId: string) => Parent | undefined;
  getParentsByClass: (classId: string) => Parent[];
  
  // === 学生管理 ===
  createStudent: (student: Partial<StudentInfo> & { classId: string }) => Promise<boolean>;
  updateStudent: (id: string, data: Partial<StudentInfo>) => Promise<boolean>;
  deleteStudent: (id: string) => Promise<boolean>;
  batchUpdateStudents: (ids: string[], data: Partial<StudentInfo>) => Promise<boolean>;
  
  // === 完整档案 ===
  profiles: Record<string, StudentFullProfile>;
  profileLoading: boolean;
  fetchStudentProfile: (id: string) => Promise<StudentFullProfile | null>;
  getStudentProfile: (id: string) => StudentFullProfile | undefined;
  
  // === 档案数据操作 ===
  addAcademicRecord: (studentId: string, record: Partial<StudentAcademicRecord>) => Promise<boolean>;
  addHonor: (studentId: string, honor: Partial<StudentHonor>) => Promise<boolean>;
  addGrowthRecord: (studentId: string, record: Partial<StudentGrowthRecord>) => Promise<boolean>;
  
  // === 习惯评价 ===
  addHabitAssessment: (studentId: string, assessment: {
    category: HabitCategory;
    type: 'praise' | 'improve';
    title: string;
    content?: string;
    score: number;
    scene?: string;
  }) => Promise<boolean>;
}

// 年级名称映射
const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

// ==================== Hook 实现 ====================

export function useStudents(initialFilters?: StudentFilters): UseStudentsReturn {
  // === 数据状态 ===
  const [allStudents, setAllStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // === 筛选状态 ===
  const [filters, setFilters] = useState<StudentFilters>(initialFilters || {});
  
  // === 前端分页状态 ===
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState<number>(PAGINATION.DEFAULT_DISPLAY_PAGE_SIZE);
  const pageSizeOptions = PAGINATION.PAGE_SIZE_OPTIONS;
  
  // 使用统一分页配置的 maxTotal 作为获取上限
  const fetchPageSize = PAGINATION.ENTITY_CONFIG.students.maxTotal;
  
  // 完整档案缓存
  const [profiles, setProfiles] = useState<Record<string, StudentFullProfile>>({});
  const [profileLoading, setProfileLoading] = useState(false);
  
  // API返回的统计数据
  const [apiStatistics, setApiStatistics] = useState<{
    total: number;
    maleCount: number;
    femaleCount: number;
    classCount: number;
  } | null>(null);
  
  // 引用
  const mountedRef = useRef(true);
  
  // 统计数据（优先使用API返回的全局统计，基于全部数据）
  const statistics = useMemo<StudentStatistics>(() => {
    const gradeDistribution: Record<number, number> = {};
    const statusDistribution: Record<string, number> = {};
    const familyTypeDistribution: Record<string, number> = {};
    
    allStudents.forEach(s => {
      // 年级分布
      gradeDistribution[s.grade] = (gradeDistribution[s.grade] || 0) + 1;
      
      // 状态分布
      statusDistribution[s.status] = (statusDistribution[s.status] || 0) + 1;
      
      // 家庭类型分布
      if (s.familyType) {
        familyTypeDistribution[s.familyType] = (familyTypeDistribution[s.familyType] || 0) + 1;
      }
    });
    
    return {
      total: apiStatistics?.total ?? allStudents.length, // 优先使用API返回的全局总数
      maleCount: apiStatistics?.maleCount ?? allStudents.filter(s => s.gender === 'male').length,
      femaleCount: apiStatistics?.femaleCount ?? allStudents.filter(s => s.gender === 'female').length,
      classCount: apiStatistics?.classCount ?? new Set(allStudents.map(s => s.classId)).size,
      gradeDistribution,
      statusDistribution,
      familyTypeDistribution,
    };
  }, [allStudents, apiStatistics]);
  
  // === 前端分页计算 ===
  // 使用 API 返回的全局总数进行统计显示，但分页基于实际获取的数据
  const total = apiStatistics?.total ?? allStudents.length;
  const totalPages = Math.ceil(total / pageSize);
  
  // 当前页数据
  const students = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return allStudents.slice(start, end);
  }, [allStudents, page, pageSize]);
  
  // 分页操作方法
  const goToPage = useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages || 1));
    setPage(validPage);
  }, [totalPages]);
  
  const prevPage = useCallback(() => {
    setPage(p => Math.max(1, p - 1));
  }, []);
  
  const nextPage = useCallback(() => {
    setPage(p => Math.min(totalPages, p + 1));
  }, [totalPages]);
  
  const handleSetPageSize = useCallback((newSize: number) => {
    setPageSizeState(newSize);
    setPage(1); // 重置到第一页
  }, []);
  
  // 分页控制对象
  const pagination: FrontendPaginationControl = useMemo(() => ({
    page,
    pageSize,
    total,
    totalPages,
    pageSizeOptions,
    goToPage,
    prevPage,
    nextPage,
    setPageSize: handleSetPageSize,
  }), [page, pageSize, total, totalPages, pageSizeOptions, goToPage, prevPage, nextPage, handleSetPageSize]);
  
  // 获取学生列表（全量获取，支持筛选）
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 构建查询参数 - 使用 maxTotal 作为 pageSize 获取全部数据
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('pageSize', fetchPageSize.toString());
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.grade && filters.grade !== 'all') {
        params.append('grade', filters.grade.toString());
      }
      if (filters.classId && filters.classId !== 'all') {
        params.append('classId', filters.classId);
      }
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      
      const response = await fetch(`/api/students?${params.toString()}`, withAuth());
      const result = await response.json();
      
      if (result.success && result.data) {
        // 转换数据格式（API返回驼峰格式，兼容两种格式）
        const formattedStudents: StudentInfo[] = result.data.map((s: Record<string, unknown>) => ({
          id: s.id as string,
          studentNo: (s.studentNo as string) || (s.student_no as string) || '',
          name: s.name as string,
          gender: (s.gender as StudentInfo['gender']) || 'male',
          birthDate: (s.birthDate as string) || (s.birth_date as string),
          avatar: s.avatar as string,
          grade: (s.grade as number) || 1,
          gradeName: GRADE_NAMES[s.grade as number] || '一年级',
          classId: (s.classId as string) || (s.class_id as string) || '',
          className: (s.className as string) || (s.class_name as string) || '',
          enrollmentDate: (s.enrollmentDate as string) || (s.enrollment_date as string),
          studentType: (s.studentType as string) || (s.student_type as string),
          idCard: (s.idCard as string) || (s.id_card as string),
          ethnicity: s.ethnicity as string,
          nativePlace: (s.nativePlace as string) || (s.native_place as string),
          politicalStatus: (s.politicalStatus as string) || (s.political_status as string),
          phone: s.phone as string,
          address: s.address as string,
          homeAddress: (s.homeAddress as string) || (s.home_address as string),
          familyType: (s.familyType as string) || (s.family_type as string),
          parents: (s.parents as Parent[]) || [],
          emergencyContact: (s.emergencyContact as string) || (s.emergency_contact as string),
          emergencyPhone: (s.emergencyPhone as string) || (s.emergency_phone as string),
          headTeacherId: (s.headTeacherId as string) || (s.head_teacher_id as string),
          headTeacherName: (s.headTeacherName as string) || (s.head_teacher_name as string),
          status: (s.status as StudentInfo['status']) || '在校',
          habitStars: (s.habitStars as number) || (s.habit_stars as number),
          createdAt: (s.createdAt as string) || (s.created_at as string),
          updatedAt: (s.updatedAt as string) || (s.updated_at as string),
        }));
        
        setAllStudents(formattedStudents);
        // 重置到第一页
        setPage(1);
        
        // 保存API返回的统计数据
        if (result.statistics) {
          setApiStatistics(result.statistics);
        }
      }
    } catch (err) {
      console.error('获取学生数据失败:', err);
      setError(err instanceof Error ? err.message : '获取学生数据失败');
    } finally {
      setLoading(false);
    }
  }, [filters, fetchPageSize]);
  
  // 根据ID获取学生（基于全部数据）
  const getStudentById = useCallback((id: string) => 
    allStudents.find(s => s.id === id),
  [allStudents]);
  
  // 根据班级获取学生（核心方法：班级归属查询，基于全部数据）
  const getStudentsByClass = useCallback((classId: string) => 
    allStudents.filter(s => s.classId === classId),
  [allStudents]);
  
  // 根据年级获取学生（基于全部数据）
  const getStudentsByGrade = useCallback((grade: number) => 
    allStudents.filter(s => s.grade === grade),
  [allStudents]);
  
  // 根据状态获取学生（基于全部数据）
  const getStudentsByStatus = useCallback((status: StudentStatus) => 
    allStudents.filter(s => s.status === status),
  [allStudents]);
  
  // 获取学生的家长列表（基于全部数据）
  const getParentsByStudent = useCallback((studentId: string): Parent[] => {
    const student = allStudents.find(s => s.id === studentId);
    return student?.parents || [];
  }, [allStudents]);
  
  // 获取学生的主要联系人（家长，基于全部数据）
  const getPrimaryParent = useCallback((studentId: string): Parent | undefined => {
    const student = allStudents.find(s => s.id === studentId);
    if (!student?.parents || student.parents.length === 0) return undefined;
    return student.parents.find(p => p.isPrimary) || student.parents[0];
  }, [allStudents]);
  
  // 获取班级所有家长（基于全部数据）
  const getParentsByClass = useCallback((classId: string): Parent[] => {
    const classStudents = students.filter(s => s.classId === classId);
    const parents: Parent[] = [];
    classStudents.forEach(s => {
      if (s.parents && s.parents.length > 0) {
        parents.push(...s.parents);
      }
    });
    return parents;
  }, [students]);
  
  // 创建学生（classId 必填）
  const createStudent = useCallback(async (
    student: Partial<StudentInfo> & { classId: string }
  ): Promise<boolean> => {
    // 验证班级归属
    if (!student.classId) {
      console.error('创建学生失败：必须指定班级');
      return false;
    }
    
    try {
      const response = await fetch('/api/students', withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: student.name,
          gender: student.gender,
          birth_date: student.birthDate,
          class_id: student.classId, // 必填
          student_type: student.studentType,
          ethnicity: student.ethnicity,
          native_place: student.nativePlace,
          political_status: student.politicalStatus,
          family_type: student.familyType,
          parents: student.parents,
          emergency_contact: student.emergencyContact,
          emergency_phone: student.emergencyPhone,
          home_address: student.homeAddress,
        }),
      }));
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const newStudent: StudentInfo = {
          id: result.data.id,
          studentNo: result.data.student_no || '',
          name: result.data.name,
          gender: result.data.gender || 'male',
          birthDate: result.data.birth_date,
          avatar: result.data.avatar,
          grade: result.data.grade || 1,
          gradeName: GRADE_NAMES[result.data.grade] || '一年级',
          classId: result.data.class_id,
          className: result.data.class_name,
          parents: result.data.parents || [],
          status: result.data.status || '在校',
        };
        setAllStudents(prev => [...prev, newStudent]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('创建学生失败:', err);
      return false;
    }
  }, []);
  
  // 更新学生
  const updateStudent = useCallback(async (id: string, data: Partial<StudentInfo>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/students/${id}`, withAuth({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          gender: data.gender,
          birth_date: data.birthDate,
          class_id: data.classId, // 更新班级归属
          status: data.status,
          parents: data.parents,
          emergency_contact: data.emergencyContact,
          emergency_phone: data.emergencyPhone,
          home_address: data.homeAddress,
        }),
      }));
      
      const result = await response.json();
      
      if (result.success) {
        setAllStudents(prev => prev.map(s => {
          if (s.id === id) {
            return { ...s, ...data };
          }
          return s;
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('更新学生失败:', err);
      return false;
    }
  }, []);
  
  // 删除学生
  const deleteStudent = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/students/${id}`, withAuth({
        method: 'DELETE',
      }));
      
      const result = await response.json();
      
      if (result.success) {
        setAllStudents(prev => prev.filter(s => s.id !== id));
        return true;
      }
      return false;
    } catch (err) {
      console.error('删除学生失败:', err);
      return false;
    }
  }, []);
  
  // 批量更新学生
  const batchUpdateStudents = useCallback(async (ids: string[], data: Partial<StudentInfo>): Promise<boolean> => {
    try {
      const response = await fetch('/api/students/batch-update', withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids,
          data: {
            class_id: data.classId,
            status: data.status,
          },
        }),
      }));
      
      const result = await response.json();
      
      if (result.success) {
        setAllStudents(prev => prev.map(s => {
          if (ids.includes(s.id)) {
            return { ...s, ...data };
          }
          return s;
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('批量更新学生失败:', err);
      return false;
    }
  }, []);
  
  // ==================== 完整档案相关 ====================
  
  // 获取学生完整档案
  const fetchStudentProfile = useCallback(async (id: string): Promise<StudentFullProfile | null> => {
    if (profiles[id]) {
      return profiles[id];
    }
    
    try {
      setProfileLoading(true);
      const response = await fetch(`/api/students/${id}/full-profile`, withAuth());
      const result = await response.json();
      
      if (result.success && result.data) {
        setProfiles(prev => ({
          ...prev,
          [id]: result.data,
        }));
        return result.data;
      }
      return null;
    } catch (err) {
      console.error('获取学生档案失败:', err);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, [profiles]);
  
  // 从缓存获取档案
  const getStudentProfile = useCallback((id: string): StudentFullProfile | undefined => {
    return profiles[id];
  }, [profiles]);
  
  // 添加学业记录
  const addAcademicRecord = useCallback(async (
    studentId: string, 
    record: Partial<StudentAcademicRecord>
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/students/${studentId}/academic-records`, withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      }));
      
      const result = await response.json();
      return result.success;
    } catch (err) {
      console.error('添加学业记录失败:', err);
      return false;
    }
  }, []);
  
  // 添加荣誉
  const addHonor = useCallback(async (
    studentId: string, 
    honor: Partial<StudentHonor>
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/students/${studentId}/honors`, withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(honor),
      }));
      
      const result = await response.json();
      return result.success;
    } catch (err) {
      console.error('添加荣誉失败:', err);
      return false;
    }
  }, []);
  
  // 添加成长记录
  const addGrowthRecord = useCallback(async (
    studentId: string, 
    record: Partial<StudentGrowthRecord>
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/students/${studentId}/growth-records`, withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      }));
      
      const result = await response.json();
      return result.success;
    } catch (err) {
      console.error('添加成长记录失败:', err);
      return false;
    }
  }, []);
  
  // 添加习惯评价
  const addHabitAssessment = useCallback(async (
    studentId: string, 
    assessment: {
      category: HabitCategory;
      type: 'praise' | 'improve';
      title: string;
      content?: string;
      score: number;
      scene?: string;
    }
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/students/${studentId}/habit-assessments`, withAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessment),
      }));
      
      const result = await response.json();
      return result.success;
    } catch (err) {
      console.error('添加习惯评价失败:', err);
      return false;
    }
  }, []);
  
  // 初始化加载
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);
  
  return {
    // 数据
    students,
    allStudents,
    loading,
    error,
    statistics,
    pagination,
    
    // 筛选
    filters,
    setFilters,
    
    // 查询方法
    fetchStudents,
    refetch: fetchStudents,
    getStudentById,
    
    // 班级关联查询
    getStudentsByClass,
    getStudentsByGrade,
    getStudentsByStatus,
    
    // 家长相关
    getParentsByStudent,
    getPrimaryParent,
    getParentsByClass,
    
    // 学生管理
    createStudent,
    updateStudent,
    deleteStudent,
    batchUpdateStudents,
    
    // 完整档案
    profiles,
    profileLoading,
    fetchStudentProfile,
    getStudentProfile,
    
    // 档案数据操作
    addAcademicRecord,
    addHonor,
    addGrowthRecord,
    
    // 习惯评价
    addHabitAssessment,
  };
}

// 导出别名
export { useStudents as useStudentData };

export default useStudents;
