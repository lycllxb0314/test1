/**
 * 学生数据管理 Hook
 * 
 * 统一管理学生数据的获取、筛选、统计等操作
 * 支持按年级、班级筛选，整合家长信息
 * 支持获取学生完整档案（学业、荣誉、成长、习惯、德育、出勤）
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  
  // 习惯养成
  habitStars?: number;
  
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
  
  // 完整档案
  profiles: Record<string, StudentFullProfile>;
  profileLoading: boolean;
  fetchStudentProfile: (id: string) => Promise<StudentFullProfile | null>;
  getStudentProfile: (id: string) => StudentFullProfile | undefined;
  
  // 档案数据操作（学业、荣誉、成长等）
  addAcademicRecord: (studentId: string, record: Partial<StudentAcademicRecord>) => Promise<boolean>;
  addHonor: (studentId: string, honor: Partial<StudentHonor>) => Promise<boolean>;
  addGrowthRecord: (studentId: string, record: Partial<StudentGrowthRecord>) => Promise<boolean>;
  
  // 习惯评价
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
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 500, // 默认获取全部
    total: 0,
    totalPages: 0,
  });
  
  // 完整档案缓存
  const [profiles, setProfiles] = useState<Record<string, StudentFullProfile>>({});
  const [profileLoading, setProfileLoading] = useState(false);
  
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
  
  // ==================== 完整档案相关 ====================
  
  // 获取学生完整档案
  const fetchStudentProfile = useCallback(async (id: string): Promise<StudentFullProfile | null> => {
    // 优先从缓存获取
    if (profiles[id]) {
      return profiles[id];
    }
    
    try {
      setProfileLoading(true);
      const response = await fetch(`/api/students/${id}/full-profile`);
      const result = await response.json();
      
      if (result.success && result.data) {
        // 缓存档案数据
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
      const profile = profiles[studentId];
      if (!profile) return false;
      
      const newRecord: StudentAcademicRecord = {
        id: `ar${Date.now()}`,
        studentId,
        semester: record.semester || '',
        examType: record.examType || '单元测试',
        subject: record.subject || '',
        score: record.score,
        level: record.level,
        classRank: record.classRank,
        gradeRank: record.gradeRank,
        createdAt: new Date().toISOString(),
      };
      
      // 更新本地缓存
      setProfiles(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          academicRecords: [...(prev[studentId]?.academicRecords || []), newRecord],
        },
      }));
      
      return true;
    } catch (err) {
      console.error('添加学业记录失败:', err);
      return false;
    }
  }, [profiles]);
  
  // 添加荣誉
  const addHonor = useCallback(async (
    studentId: string, 
    honor: Partial<StudentHonor>
  ): Promise<boolean> => {
    try {
      const profile = profiles[studentId];
      if (!profile) return false;
      
      const newHonor: StudentHonor = {
        id: `h${Date.now()}`,
        studentId,
        title: honor.title || '',
        level: honor.level || '校级',
        category: honor.category || '综合',
        issuer: honor.issuer,
        date: honor.date || new Date().toISOString().slice(0, 7),
      };
      
      // 更新本地缓存
      setProfiles(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          honors: [...(prev[studentId]?.honors || []), newHonor],
        },
      }));
      
      return true;
    } catch (err) {
      console.error('添加荣誉失败:', err);
      return false;
    }
  }, [profiles]);
  
  // 添加成长记录
  const addGrowthRecord = useCallback(async (
    studentId: string, 
    record: Partial<StudentGrowthRecord>
  ): Promise<boolean> => {
    try {
      const profile = profiles[studentId];
      if (!profile) return false;
      
      const newRecord: StudentGrowthRecord = {
        id: `gr${Date.now()}`,
        studentId,
        type: record.type || '其他',
        title: record.title || '',
        description: record.description,
        date: record.date || new Date().toISOString().slice(0, 10),
        operator: record.operator,
        createdAt: new Date().toISOString(),
      };
      
      // 更新本地缓存
      setProfiles(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          growthRecords: [...(prev[studentId]?.growthRecords || []), newRecord],
        },
      }));
      
      return true;
    } catch (err) {
      console.error('添加成长记录失败:', err);
      return false;
    }
  }, [profiles]);
  
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
      const profile = profiles[studentId];
      if (!profile) return false;
      
      const student = students.find(s => s.id === studentId);
      const now = new Date().toISOString();
      
      const newAssessment = {
        id: `ha${Date.now()}`,
        studentId,
        studentName: student?.name || '',
        classId: student?.classId || '',
        className: student?.className || '',
        category: assessment.category,
        type: assessment.type,
        title: assessment.title,
        content: assessment.content || '',
        score: assessment.score,
        scene: (assessment.scene || 'campus') as 'campus' | 'classroom' | 'home' | 'activity' | 'other',
        recorderId: '',
        recorderName: '',
        recorderRole: 'teacher' as const,
        occurredAt: now.slice(0, 10),
        createdAt: now,
      };
      
      // 获取现有评价记录
      const existingAssessments = profile.habitProfile?.recentAssessments || [];
      
      // 更新本地缓存
      setProfiles(prev => {
        const existingProfile = prev[studentId];
        if (!existingProfile) return prev;
        
        return {
          ...prev,
          [studentId]: {
            ...existingProfile,
            habitProfile: {
              ...existingProfile.habitProfile,
              overallScore: existingProfile.habitProfile?.overallScore || 80,
              level: existingProfile.habitProfile?.level || '良好',
              habitStarCount: existingProfile.habitProfile?.habitStarCount || 0,
              monthlyStars: existingProfile.habitProfile?.monthlyStars || [],
              recentAssessments: [newAssessment, ...existingAssessments].slice(0, 20),
            },
          },
        };
      });
      
      return true;
    } catch (err) {
      console.error('添加习惯评价失败:', err);
      return false;
    }
  }, [profiles, students]);
  
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
    // 完整档案
    profiles,
    profileLoading,
    fetchStudentProfile,
    getStudentProfile,
    // 档案数据操作
    addAcademicRecord,
    addHonor,
    addGrowthRecord,
    addHabitAssessment,
  };
}
