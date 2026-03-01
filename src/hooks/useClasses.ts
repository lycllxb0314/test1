/**
 * 班级数据管理 Hook
 * 
 * ==================== 架构定位 ====================
 * 班级是系统的第一核心、聚合根。
 * 学校所有业务（年段、班主任、德育、通知、考勤、评比）都以班级为最小单位。
 * 学生、家长、教师的业务最终都落在班级上。
 * 
 * ==================== 职责边界 ====================
 * 1. 作为聚合根，聚合学生、家长、教师信息
 * 2. 提供完整的班级管理功能（创建、更新、删除）
 * 3. 支持班主任管理、科任分配
 * 4. 支持按年级、状态筛选
 * 5. 提供班级统计数据
 * 
 * ==================== 关联关系 ====================
 * - 聚合学生：useStudents 的数据按班级聚合到此处
 * - 聚合家长：从学生数据中提取家长信息
 * - 关联教师：班主任、科任教师信息
 * - 不直接调用其他 Hook，而是通过 API 获取数据后自行聚合
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Parent } from '@/types';

// ==================== 类型定义 ====================

/** 班级状态 */
export type ClassStatus = 'active' | 'inactive' | 'graduated';

/** 班级筛选参数 */
export interface ClassFilters {
  search?: string;
  grade?: number | 'all';
  status?: ClassStatus | 'all';
  headTeacherId?: string;
}

/** 教师基本信息（班级聚合用） */
export interface TeacherBasicInfo {
  id: string;
  name: string;
  gender?: string;
  phone?: string;
  subject?: string;
  title?: string;
  avatar?: string;
}

/** 学生基本信息（班级聚合用） */
export interface StudentBasicInfo {
  id: string;
  studentNo: string;
  name: string;
  gender: 'male' | 'female';
  birthDate?: string;
  status: '在校' | '请假' | '休学' | '毕业' | '转学';
  avatar?: string;
  
  // 家长信息
  parents: Parent[];
}

/** 家长基本信息（班级聚合展示用） */
export interface ParentBasicInfo {
  id: string;
  name: string;
  relation: string;
  relationName: string;
  phone?: string;
  isPrimary: boolean;
  wechat?: string;
  avatar?: string;
  
  // 关联学生
  studentId: string;
  studentName: string;
  
  // 班级信息
  classId: string;
  className: string;
  grade: number;
}

/** 教师候选人（用于智能推荐） */
export interface TeacherCandidate {
  id: string;
  name: string;
  subject: string;
  subjects: string[];
  primaryRole: string;
  department?: string;
  title?: string;
  
  // 可任教年级
  teachableGrades: number[];
  
  // 是否匹配当前班级
  isRecommended: boolean;
  matchReason?: string;
  
  // 当前班级分配
  currentClassId?: string;
  currentClassName?: string;
  isHeadTeacher: boolean;
}

/** 班级容器 - 核心聚合根 */
export interface ClassContainer {
  id: string;
  name: string;
  grade: number;
  gradeName: string;
  classNumber: number;
  
  // === 班主任（完整信息） ===
  headTeacherId: string;
  headTeacherName: string;
  headTeacher?: TeacherBasicInfo;
  
  // === 科任/副班主任 ===
  subTeacherId?: string;
  subTeacherName?: string;
  subTeacher?: TeacherBasicInfo;
  
  // === 学生列表（聚合） ===
  students: StudentBasicInfo[];
  studentCount: number;
  maleStudentCount: number;
  femaleStudentCount: number;
  
  // === 家长列表（从学生聚合） ===
  parents: ParentBasicInfo[];
  parentCount: number;
  
  // === 教室信息 ===
  classroomId?: string;
  classroomName?: string;
  building?: string;
  floor?: number;
  
  // === 状态 ===
  status: ClassStatus;
  
  // === 班级特色 ===
  motto?: string;           // 班训
  features?: string[];      // 班级特色
  
  // === 时间戳 ===
  createdAt?: string;
  updatedAt?: string;
}

/** 班级统计信息 */
export interface ClassStatistics {
  totalClasses: number;
  activeClasses: number;
  inactiveClasses: number;
  totalStudents: number;
  totalParents: number;
  classesWithSubTeacher: number;
  classesWithoutSubTeacher: number;
  gradeDistribution: Record<number, number>;
  avgStudentsPerClass: number;
  avgParentsPerClass: number;
}

/** 分页信息 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Hook 返回类型 */
export interface UseClassesReturn {
  // === 数据 ===
  classes: ClassContainer[];
  loading: boolean;
  error: string | null;
  
  // === 统计 ===
  statistics: ClassStatistics;
  pagination: PaginationInfo;
  
  // === 筛选 ===
  filters: ClassFilters;
  setFilters: (filters: ClassFilters) => void;
  
  // === 查询方法 ===
  fetchClasses: () => Promise<void>;
  refetch: () => Promise<void>;
  getClassById: (id: string) => ClassContainer | undefined;
  getClassesByGrade: (grade: number) => ClassContainer[];
  getClassesByHeadTeacher: (teacherId: string) => ClassContainer[];
  
  // === 学生/家长聚合查询 ===
  getStudentsByClass: (classId: string) => StudentBasicInfo[];
  getParentsByClass: (classId: string) => ParentBasicInfo[];
  getPrimaryParentsByClass: (classId: string) => ParentBasicInfo[];
  
  // === 班级管理 ===
  createClass: (data: Partial<ClassContainer>) => Promise<boolean>;
  updateClass: (id: string, data: Partial<ClassContainer>) => Promise<boolean>;
  deleteClass: (id: string) => Promise<boolean>;
  
  // === 教师管理 ===
  updateHeadTeacher: (classId: string, teacherId: string) => Promise<boolean>;
  assignSubTeacher: (classId: string, teacherId: string) => Promise<boolean>;
  removeSubTeacher: (classId: string) => Promise<boolean>;
  
  // === 科任智能推荐 ===
  getRecommendedSubTeachers: (classId: string, candidates: TeacherCandidate[]) => TeacherCandidate[];
}

// 年级名称映射
const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

// ==================== Hook 实现 ====================

export function useClasses(initialFilters?: ClassFilters): UseClassesReturn {
  const [classes, setClasses] = useState<ClassContainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ClassFilters>(initialFilters || {});
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 500, // 默认获取全部
    total: 0,
    totalPages: 0,
  });
  
  // 统计数据
  const statistics = useMemo<ClassStatistics>(() => {
    const gradeDistribution: Record<number, number> = {};
    
    classes.forEach(c => {
      gradeDistribution[c.grade] = (gradeDistribution[c.grade] || 0) + 1;
    });
    
    const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);
    const totalParents = classes.reduce((sum, c) => sum + c.parentCount, 0);
    
    return {
      totalClasses: classes.length,
      activeClasses: classes.filter(c => c.status === 'active').length,
      inactiveClasses: classes.filter(c => c.status !== 'active').length,
      totalStudents,
      totalParents,
      classesWithSubTeacher: classes.filter(c => c.subTeacherId).length,
      classesWithoutSubTeacher: classes.filter(c => !c.subTeacherId).length,
      gradeDistribution,
      avgStudentsPerClass: classes.length > 0 ? Math.round(totalStudents / classes.length) : 0,
      avgParentsPerClass: classes.length > 0 ? Math.round(totalParents / classes.length) : 0,
    };
  }, [classes]);
  
  // 获取班级列表（含学生和家长）
  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 并行获取班级、学生、教师数据
      const [classesRes, studentsRes, teachersRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/students?pageSize=2000'),
        fetch('/api/teachers?pageSize=500'),
      ]);
      
      const classesData = await classesRes.json();
      const studentsData = await studentsRes.json();
      const teachersData = await teachersRes.json();
      
      if (!classesData.success) {
        throw new Error('获取班级数据失败');
      }
      
      // 构建学生映射（按班级分组）
      const studentsByClass: Record<string, unknown[]> = {};
      (studentsData.data || []).forEach((student: Record<string, unknown>) => {
        const classId = student.class_id as string;
        if (!studentsByClass[classId]) {
          studentsByClass[classId] = [];
        }
        studentsByClass[classId].push(student);
      });
      
      // 构建教师映射
      const teachersMap: Record<string, Record<string, unknown>> = {};
      (teachersData.data || []).forEach((teacher: Record<string, unknown>) => {
        teachersMap[teacher.id as string] = teacher;
      });
      
      // 构建班级容器
      const classContainers: ClassContainer[] = (classesData.data || []).map(
        (cls: Record<string, unknown>) => {
          const classStudents = (studentsByClass[cls.id as string] || []) as Record<string, unknown>[];
          
          // 转换学生信息
          const students: StudentBasicInfo[] = classStudents.map((s) => ({
            id: s.id as string,
            studentNo: s.student_no as string || '',
            name: s.name as string,
            gender: (s.gender as 'male' | 'female') || 'male',
            birthDate: s.birth_date as string,
            status: (s.status as StudentBasicInfo['status']) || '在校',
            avatar: s.avatar as string,
            parents: (s.parents as Parent[]) || [],
          }));
          
          // 聚合家长信息
          const parents: ParentBasicInfo[] = [];
          students.forEach(student => {
            if (student.parents && student.parents.length > 0) {
              student.parents.forEach(parent => {
                // 兼容新旧字段
                const relation = parent.relation || 'other';
                const relationName = parent.relationName || parent.relationship || '家长';
                parents.push({
                  id: parent.id,
                  name: parent.name,
                  relation: relation,
                  relationName: relationName,
                  phone: parent.phone,
                  isPrimary: parent.isPrimary || false,
                  wechat: parent.wechat,
                  avatar: parent.avatar,
                  studentId: student.id,
                  studentName: student.name,
                  classId: cls.id as string,
                  className: cls.name as string,
                  grade: cls.grade as number,
                });
              });
            }
          });
          
          // 获取班主任详情
          const headTeacherId = cls.head_teacher_id as string || '';
          const headTeacher = headTeacherId ? teachersMap[headTeacherId] : null;
          
          // 获取科任详情
          const subTeacherId = cls.sub_teacher_id as string;
          const subTeacher = subTeacherId ? teachersMap[subTeacherId] : null;
          
          return {
            id: cls.id as string,
            name: cls.name as string,
            grade: cls.grade as number,
            gradeName: GRADE_NAMES[cls.grade as number] || `${cls.grade}年级`,
            classNumber: cls.class_number as number || 1,
            
            // 班主任
            headTeacherId,
            headTeacherName: (headTeacher?.name as string) || cls.head_teacher_name as string || '',
            headTeacher: headTeacher ? {
              id: headTeacher.id as string,
              name: headTeacher.name as string,
              gender: headTeacher.gender as string,
              phone: headTeacher.phone as string,
              subject: headTeacher.subject as string,
              title: headTeacher.title as string,
              avatar: headTeacher.avatar as string,
            } : undefined,
            
            // 科任
            subTeacherId,
            subTeacherName: (subTeacher?.name as string) || cls.sub_teacher_name as string,
            subTeacher: subTeacher ? {
              id: subTeacher.id as string,
              name: subTeacher.name as string,
              gender: subTeacher.gender as string,
              phone: subTeacher.phone as string,
              subject: subTeacher.subject as string,
              title: subTeacher.title as string,
              avatar: subTeacher.avatar as string,
            } : undefined,
            
            // 学生
            students,
            studentCount: students.length,
            maleStudentCount: students.filter(s => s.gender === 'male').length,
            femaleStudentCount: students.filter(s => s.gender === 'female').length,
            
            // 家长
            parents,
            parentCount: parents.length,
            
            // 教室
            classroomId: cls.classroom_id as string,
            classroomName: cls.classroom_name as string,
            building: cls.building as string,
            floor: cls.floor as number,
            
            // 班级特色
            motto: cls.motto as string,
            features: cls.features as string[],
            
            // 状态
            status: (cls.status as ClassContainer['status']) || 'active',
            
            // 时间戳
            createdAt: cls.created_at as string,
            updatedAt: cls.updated_at as string,
          };
        }
      );
      
      setClasses(classContainers);
      
      // 更新分页信息
      if (classesData.pagination) {
        setPagination(prev => ({
          ...prev,
          total: classesData.pagination.total,
          totalPages: classesData.pagination.totalPages,
        }));
      }
    } catch (err) {
      console.error('获取班级数据失败:', err);
      setError(err instanceof Error ? err.message : '获取班级数据失败');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 根据ID获取班级
  const getClassById = useCallback((id: string) => 
    classes.find(c => c.id === id),
  [classes]);
  
  // 根据年级获取班级
  const getClassesByGrade = useCallback((grade: number) => 
    classes.filter(c => c.grade === grade),
  [classes]);
  
  // 根据班主任获取班级
  const getClassesByHeadTeacher = useCallback((teacherId: string) => 
    classes.filter(c => c.headTeacherId === teacherId),
  [classes]);
  
  // 获取班级学生列表
  const getStudentsByClass = useCallback((classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.students || [];
  }, [classes]);
  
  // 获取班级家长列表
  const getParentsByClass = useCallback((classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.parents || [];
  }, [classes]);
  
  // 获取班级主要家长列表
  const getPrimaryParentsByClass = useCallback((classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.parents.filter(p => p.isPrimary) || [];
  }, [classes]);
  
  // 创建班级
  const createClass = useCallback(async (data: Partial<ClassContainer>): Promise<boolean> => {
    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchClasses();
        return true;
      }
      return false;
    } catch (err) {
      console.error('创建班级失败:', err);
      return false;
    }
  }, [fetchClasses]);
  
  // 更新班级
  const updateClass = useCallback(async (id: string, data: Partial<ClassContainer>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/classes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 更新本地状态
        setClasses(prev => prev.map(c => {
          if (c.id === id) {
            return { ...c, ...data };
          }
          return c;
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('更新班级失败:', err);
      return false;
    }
  }, []);
  
  // 删除班级
  const deleteClass = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/classes/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setClasses(prev => prev.filter(c => c.id !== id));
        return true;
      }
      return false;
    } catch (err) {
      console.error('删除班级失败:', err);
      return false;
    }
  }, []);
  
  // 更新班主任
  const updateHeadTeacher = useCallback(async (classId: string, teacherId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headTeacherId: teacherId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setClasses(prev => prev.map(c => {
          if (c.id === classId) {
            return {
              ...c,
              headTeacherId: teacherId,
              headTeacherName: data.data?.head_teacher_name || data.headTeacherName,
            };
          }
          return c;
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('更新班主任失败:', err);
      return false;
    }
  }, []);
  
  // 分配科任教师
  const assignSubTeacher = useCallback(async (classId: string, teacherId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subTeacherId: teacherId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setClasses(prev => prev.map(c => {
          if (c.id === classId) {
            return {
              ...c,
              subTeacherId: teacherId,
              subTeacherName: data.data?.sub_teacher_name || data.subTeacherName,
            };
          }
          return c;
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('分配科任失败:', err);
      return false;
    }
  }, []);
  
  // 移除科任教师
  const removeSubTeacher = useCallback(async (classId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subTeacherId: null }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setClasses(prev => prev.map(c => {
          if (c.id === classId) {
            return {
              ...c,
              subTeacherId: undefined,
              subTeacherName: undefined,
              subTeacher: undefined,
            };
          }
          return c;
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('移除科任失败:', err);
      return false;
    }
  }, []);
  
  /**
   * 科任智能推荐算法
   * 
   * 筛选条件：
   * 1. 教师的主要角色是班主任或科任教师（语文/数学教师）
   * 2. 教师的可任教年级包含该班级的年级
   * 3. 不是该班的班主任
   * 
   * 推荐优先级：
   * 1. 可任教年级精确匹配（推荐）
   * 2. 未设置可任教年级（兼容旧数据）
   * 3. 可任教年级包含该年级
   */
  const getRecommendedSubTeachers = useCallback((
    classId: string,
    candidates: TeacherCandidate[]
  ): TeacherCandidate[] => {
    const targetClass = classes.find(c => c.id === classId);
    if (!targetClass) return [];
    
    const targetGrade = targetClass.grade;
    const headTeacherId = targetClass.headTeacherId;
    
    // 筛选符合条件的教师
    const filtered = candidates.filter(teacher => {
      // 排除该班班主任
      if (teacher.id === headTeacherId) return false;
      
      // 主要角色必须是班主任或科任教师
      if (teacher.primaryRole !== 'head_teacher' && teacher.primaryRole !== 'subject_teacher') {
        return false;
      }
      
      // 检查可任教年级
      if (teacher.teachableGrades && teacher.teachableGrades.length > 0) {
        return teacher.teachableGrades.includes(targetGrade);
      }
      
      // 未设置可任教年级的教师也显示（兼容旧数据）
      return true;
    });
    
    // 按推荐优先级排序
    return filtered.map(teacher => {
      let isRecommended = false;
      let matchReason = '';
      
      if (teacher.teachableGrades && teacher.teachableGrades.includes(targetGrade)) {
        isRecommended = true;
        matchReason = `可任教${GRADE_NAMES[targetGrade]}`;
      } else {
        matchReason = '未设置任教年级';
      }
      
      return {
        ...teacher,
        isRecommended,
        matchReason,
      };
    }).sort((a, b) => {
      // 推荐的排在前面
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      // 同为推荐或非推荐，按姓名排序
      return a.name.localeCompare(b.name);
    });
  }, [classes]);
  
  // 初始化加载
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);
  
  return {
    // 数据
    classes,
    loading,
    error,
    statistics,
    pagination,
    
    // 筛选
    filters,
    setFilters,
    
    // 查询方法
    fetchClasses,
    refetch: fetchClasses,
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
    
    // 教师管理
    updateHeadTeacher,
    assignSubTeacher,
    removeSubTeacher,
    
    // 科任智能推荐
    getRecommendedSubTeachers,
  };
}

export default useClasses;
