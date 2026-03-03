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

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PAGINATION } from '@/lib/pagination-config';
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

/** Hook 返回类型 */
export interface UseStudentsReturn {
  // === 数据 ===
  students: StudentInfo[];
  loading: boolean;
  error: string | null;
  
  // === 统计 ===
  statistics: StudentStatistics;
  total: number; // 总数量（供前端分页使用）
  
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
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StudentFilters>(initialFilters || {});
  
  // 总数量（用于前端分页）
  const [total, setTotal] = useState(0);
  // 使用统一分页配置的 maxTotal 作为获取上限
  const fetchPageSize = PAGINATION.ENTITY_CONFIG.students.maxTotal;
  
  // 完整档案缓存
  const [profiles, setProfiles] = useState<Record<string, StudentFullProfile>>({});
  const [profileLoading, setProfileLoading] = useState(false);
  
  // API返回的统计数据
  const [apiStatistics, setApiStatistics] = useState<{
    maleCount: number;
    femaleCount: number;
    classCount: number;
  } | null>(null);
  
  // 统计数据（优先使用API返回的全局统计）
  const statistics = useMemo<StudentStatistics>(() => {
    const gradeDistribution: Record<number, number> = {};
    const statusDistribution: Record<string, number> = {};
    const familyTypeDistribution: Record<string, number> = {};
    
    students.forEach(s => {
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
      total: total, // 使用total作为全局总数
      maleCount: apiStatistics?.maleCount ?? students.filter(s => s.gender === 'male').length,
      femaleCount: apiStatistics?.femaleCount ?? students.filter(s => s.gender === 'female').length,
      classCount: apiStatistics?.classCount ?? new Set(students.map(s => s.classId)).size,
      gradeDistribution,
      statusDistribution,
      familyTypeDistribution,
    };
  }, [students, total, apiStatistics]);
  
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
      
      const response = await fetch(`/api/students?${params.toString()}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        // 转换数据格式
        const formattedStudents: StudentInfo[] = result.data.map((s: Record<string, unknown>) => ({
          id: s.id as string,
          studentNo: s.student_no as string || '',
          name: s.name as string,
          gender: (s.gender as StudentInfo['gender']) || 'male',
          birthDate: s.birth_date as string,
          avatar: s.avatar as string,
          grade: (s.grade as number) || 1,
          gradeName: GRADE_NAMES[s.grade as number] || '一年级',
          classId: s.class_id as string || '', // 必填：班级归属
          className: s.class_name as string || '',
          enrollmentDate: s.enrollment_date as string,
          studentType: s.student_type as string,
          idCard: s.id_card as string,
          ethnicity: s.ethnicity as string,
          nativePlace: s.native_place as string,
          politicalStatus: s.political_status as string,
          phone: s.phone as string,
          address: s.address as string,
          homeAddress: s.home_address as string,
          familyType: s.family_type as string,
          parents: (s.parents as Parent[]) || [],
          emergencyContact: s.emergency_contact as string,
          emergencyPhone: s.emergency_phone as string,
          headTeacherId: s.head_teacher_id as string,
          headTeacherName: s.head_teacher_name as string,
          status: (s.status as StudentInfo['status']) || '在校',
          habitStars: s.habit_stars as number,
          createdAt: s.created_at as string,
          updatedAt: s.updated_at as string,
        }));
        
        setStudents(formattedStudents);
        
        // 更新总数（用于前端分页）
        if (result.pagination) {
          setTotal(result.pagination.total);
        }
        
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
  
  // 根据ID获取学生
  const getStudentById = useCallback((id: string) => 
    students.find(s => s.id === id),
  [students]);
  
  // 根据班级获取学生（核心方法：班级归属查询）
  const getStudentsByClass = useCallback((classId: string) => 
    students.filter(s => s.classId === classId),
  [students]);
  
  // 根据年级获取学生
  const getStudentsByGrade = useCallback((grade: number) => 
    students.filter(s => s.grade === grade),
  [students]);
  
  // 根据状态获取学生
  const getStudentsByStatus = useCallback((status: StudentStatus) => 
    students.filter(s => s.status === status),
  [students]);
  
  // 获取学生的家长列表
  const getParentsByStudent = useCallback((studentId: string): Parent[] => {
    const student = students.find(s => s.id === studentId);
    return student?.parents || [];
  }, [students]);
  
  // 获取学生的主要联系人（家长）
  const getPrimaryParent = useCallback((studentId: string): Parent | undefined => {
    const student = students.find(s => s.id === studentId);
    if (!student?.parents || student.parents.length === 0) return undefined;
    return student.parents.find(p => p.isPrimary) || student.parents[0];
  }, [students]);
  
  // 获取班级所有家长
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
      const response = await fetch('/api/students', {
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
      });
      
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
        setStudents(prev => [...prev, newStudent]);
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
      const response = await fetch(`/api/students/${id}`, {
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
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStudents(prev => prev.map(s => {
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
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStudents(prev => prev.filter(s => s.id !== id));
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
      const response = await fetch('/api/students/batch-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids,
          data: {
            class_id: data.classId,
            status: data.status,
          },
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStudents(prev => prev.map(s => {
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
      const response = await fetch(`/api/students/${id}/full-profile`);
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
      const response = await fetch(`/api/students/${studentId}/academic-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      
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
      const response = await fetch(`/api/students/${studentId}/honors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(honor),
      });
      
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
      const response = await fetch(`/api/students/${studentId}/growth-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      
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
      const response = await fetch(`/api/students/${studentId}/habit-assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessment),
      });
      
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
    loading,
    error,
    statistics,
    total, // 总数量（供前端分页使用）
    
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
