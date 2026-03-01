/**
 * 学生数据管理 Hook
 * 
 * 统一管理学生数据的获取、筛选、统计等操作
 * 支持按年级、班级筛选，整合家长信息
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Parent } from '@/types';

// ==================== 类型定义 ====================

/** 学生完整信息 */
export interface StudentInfo {
  id: string;
  studentNo: string;
  name: string;
  gender: 'male' | 'female';
  birthDate?: string;
  
  // 学籍信息
  grade: number;
  gradeName: string;
  classId: string;
  className: string;
  enrollmentDate?: string;
  studentType?: string;
  
  // 身份信息
  idCard?: string;
  ethnicity?: string;
  nativePlace?: string;
  politicalStatus?: string;
  
  // 联系信息
  phone?: string;
  address?: string;
  homeAddress?: string;
  
  // 家庭信息
  familyType?: string;
  parents: Parent[];
  emergencyContact?: string;
  emergencyPhone?: string;
  
  // 班主任信息
  headTeacherId?: string;
  headTeacherName?: string;
  
  // 状态
  status: '在校' | '请假' | '休学' | '毕业' | '转学';
  avatar?: string;
  
  // 时间戳
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

/** 筛选参数 */
export interface StudentFilters {
  search?: string;
  grade?: number | 'all';
  classId?: string | 'all';
  status?: string | 'all';
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
  // 数据
  students: StudentInfo[];
  loading: boolean;
  error: string | null;
  
  // 统计
  statistics: StudentStatistics;
  pagination: PaginationInfo;
  
  // 筛选
  filters: StudentFilters;
  setFilters: (filters: StudentFilters) => void;
  
  // 操作方法
  fetchStudents: () => Promise<void>;
  refetch: () => Promise<void>;
  getStudentById: (id: string) => StudentInfo | undefined;
  getStudentsByClass: (classId: string) => StudentInfo[];
  getStudentsByGrade: (grade: number) => StudentInfo[];
  
  // 家长相关
  getParentsByStudent: (studentId: string) => Parent[];
  getPrimaryParent: (studentId: string) => Parent | undefined;
  
  // 创建/更新/删除
  createStudent: (student: Partial<StudentInfo>) => Promise<boolean>;
  updateStudent: (id: string, data: Partial<StudentInfo>) => Promise<boolean>;
  deleteStudent: (id: string) => Promise<boolean>;
  batchUpdateStudents: (ids: string[], data: Partial<StudentInfo>) => Promise<boolean>;
}

// 年级名称映射
const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

// ==================== Hook 实现 ====================

export function useStudents(initialFilters?: StudentFilters): UseStudentsReturn {
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StudentFilters>(initialFilters || {});
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 500, // 默认获取全部
    total: 0,
    totalPages: 0,
  });
  
  // 统计数据
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
      total: students.length,
      maleCount: students.filter(s => s.gender === 'male').length,
      femaleCount: students.filter(s => s.gender === 'female').length,
      classCount: new Set(students.map(s => s.classId)).size,
      gradeDistribution,
      statusDistribution,
      familyTypeDistribution,
    };
  }, [students]);
  
  // 获取学生列表
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 构建查询参数
      const params = new URLSearchParams();
      params.append('pageSize', pagination.pageSize.toString());
      
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
          grade: (s.grade as number) || 1,
          gradeName: GRADE_NAMES[s.grade as number] || '一年级',
          classId: s.class_id as string || '',
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
          avatar: s.avatar as string,
          createdAt: s.created_at as string,
          updatedAt: s.updated_at as string,
        }));
        
        setStudents(formattedStudents);
        
        // 更新分页信息
        if (result.pagination) {
          setPagination(prev => ({
            ...prev,
            total: result.pagination.total,
            totalPages: result.pagination.totalPages,
          }));
        }
      }
    } catch (err) {
      console.error('获取学生数据失败:', err);
      setError(err instanceof Error ? err.message : '获取学生数据失败');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.pageSize]);
  
  // 根据ID获取学生
  const getStudentById = useCallback((id: string) => 
    students.find(s => s.id === id),
  [students]);
  
  // 根据班级获取学生
  const getStudentsByClass = useCallback((classId: string) => 
    students.filter(s => s.classId === classId),
  [students]);
  
  // 根据年级获取学生
  const getStudentsByGrade = useCallback((grade: number) => 
    students.filter(s => s.grade === grade),
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
  
  // 创建学生
  const createStudent = useCallback(async (student: Partial<StudentInfo>): Promise<boolean> => {
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: student.name,
          gender: student.gender,
          birth_date: student.birthDate,
          class_id: student.classId,
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
      
      if (result.success) {
        // 添加到本地状态
        if (result.data) {
          const newStudent: StudentInfo = {
            id: result.data.id,
            studentNo: result.data.student_no || '',
            name: result.data.name,
            gender: result.data.gender || 'male',
            birthDate: result.data.birth_date,
            grade: result.data.grade || 1,
            gradeName: GRADE_NAMES[result.data.grade] || '一年级',
            classId: result.data.class_id || '',
            className: result.data.class_name || '',
            parents: result.data.parents || [],
            status: result.data.status || '在校',
          };
          setStudents(prev => [...prev, newStudent]);
        }
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
          class_id: data.classId,
          status: data.status,
          parents: data.parents,
          emergency_contact: data.emergencyContact,
          emergency_phone: data.emergencyPhone,
          home_address: data.homeAddress,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 更新本地状态
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
        // 更新本地状态
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
  
  // 初始化加载
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);
  
  return {
    students,
    loading,
    error,
    statistics,
    pagination,
    filters,
    setFilters,
    fetchStudents,
    refetch: fetchStudents,
    getStudentById,
    getStudentsByClass,
    getStudentsByGrade,
    getParentsByStudent,
    getPrimaryParent,
    createStudent,
    updateStudent,
    deleteStudent,
    batchUpdateStudents,
  };
}
