/**
 * 班级数据管理 Hook
 * 
 * 班级作为容器，包含：班主任、科任（副班主任）、学生、家长
 * 支持科任教师智能推荐（基于可任教年级）
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Parent } from '@/types';

// ==================== 类型定义 ====================

/** 班级容器 - 包含班主任、科任、学生、家长 */
export interface ClassContainer {
  id: string;
  name: string;
  grade: number;
  gradeName: string;
  classNumber: number;
  
  // 班主任
  headTeacherId: string;
  headTeacherName: string;
  
  // 科任（副班主任）
  subTeacherId?: string;
  subTeacherName?: string;
  
  // 学生列表
  students: StudentBasicInfo[];
  studentCount: number;
  
  // 家长列表（从学生数据聚合）
  parents: ParentInfo[];
  parentCount: number;
  
  // 教室
  classroomId?: string;
  classroomName?: string;
  building?: string;
  
  // 状态
  status: 'active' | 'inactive';
  
  // 时间戳
  createdAt?: string;
  updatedAt?: string;
}

/** 学生基本信息 */
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

/** 家长信息（聚合展示用） */
export interface ParentInfo {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
  wechat?: string;
  
  // 关联学生
  studentId: string;
  studentName: string;
  studentNo: string;
  
  // 班级信息
  classId: string;
  className: string;
  grade: number;
  studentStatus?: string;
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

/** Hook 返回类型 */
export interface UseClassesReturn {
  // 数据
  classes: ClassContainer[];
  loading: boolean;
  error: string | null;
  
  // 统计
  statistics: {
    totalClasses: number;
    totalStudents: number;
    totalParents: number;
    classesWithSubTeacher: number;
    classesWithoutSubTeacher: number;
    gradeDistribution: Record<number, number>;
  };
  
  // 操作方法
  fetchClasses: () => Promise<void>;
  refetch: () => Promise<void>;
  getClassById: (id: string) => ClassContainer | undefined;
  
  // 科任智能推荐
  getRecommendedSubTeachers: (classId: string, candidates: TeacherCandidate[]) => TeacherCandidate[];
  assignSubTeacher: (classId: string, teacherId: string) => Promise<boolean>;
  removeSubTeacher: (classId: string) => Promise<boolean>;
  
  // 更新班级班主任
  updateHeadTeacher: (classId: string, teacherId: string) => Promise<boolean>;
}

// 年级名称映射
const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

// ==================== Hook 实现 ====================

export function useClasses(): UseClassesReturn {
  const [classes, setClasses] = useState<ClassContainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 统计数据
  const statistics = useMemo(() => {
    const gradeDistribution: Record<number, number> = {};
    
    classes.forEach(c => {
      gradeDistribution[c.grade] = (gradeDistribution[c.grade] || 0) + 1;
    });
    
    return {
      totalClasses: classes.length,
      totalStudents: classes.reduce((sum, c) => sum + c.studentCount, 0),
      totalParents: classes.reduce((sum, c) => sum + c.parentCount, 0),
      classesWithSubTeacher: classes.filter(c => c.subTeacherId).length,
      classesWithoutSubTeacher: classes.filter(c => !c.subTeacherId).length,
      gradeDistribution,
    };
  }, [classes]);
  
  // 获取班级列表（含学生和家长）
  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 并行获取班级、学生数据
      const [classesRes, studentsRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/students?pageSize=1000'),
      ]);
      
      const classesData = await classesRes.json();
      const studentsData = await studentsRes.json();
      
      if (!classesData.success) {
        throw new Error('获取班级数据失败');
      }
      
      // 构建学生映射（按班级分组）
      const studentsByClass: Record<string, typeof studentsData.data> = {};
      (studentsData.data || []).forEach((student: Record<string, unknown>) => {
        const classId = student.class_id as string;
        if (!studentsByClass[classId]) {
          studentsByClass[classId] = [];
        }
        studentsByClass[classId].push(student);
      });
      
      // 构建班级容器
      const classContainers: ClassContainer[] = (classesData.data || []).map(
        (cls: Record<string, unknown>) => {
          const classStudents = studentsByClass[cls.id as string] || [];
          
          // 转换学生信息
          const students: StudentBasicInfo[] = classStudents.map((s: Record<string, unknown>) => ({
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
          const parents: ParentInfo[] = [];
          students.forEach(student => {
            if (student.parents && student.parents.length > 0) {
              student.parents.forEach(parent => {
                parents.push({
                  ...parent,
                  studentId: student.id,
                  studentName: student.name,
                  studentNo: student.studentNo,
                  classId: cls.id as string,
                  className: cls.name as string,
                  grade: cls.grade as number,
                  studentStatus: student.status,
                });
              });
            }
          });
          
          return {
            id: cls.id as string,
            name: cls.name as string,
            grade: cls.grade as number,
            gradeName: cls.gradeName as string || GRADE_NAMES[cls.grade as number],
            classNumber: cls.classNumber as number || 1,
            headTeacherId: cls.headTeacherId as string || '',
            headTeacherName: cls.headTeacherName as string || '',
            subTeacherId: cls.subTeacherId as string,
            subTeacherName: cls.subTeacherName as string,
            students,
            studentCount: students.length,
            parents,
            parentCount: parents.length,
            classroomId: cls.classroomId as string,
            classroomName: cls.classroomName as string,
            building: cls.building as string,
            status: (cls.status as ClassContainer['status']) || 'active',
            createdAt: cls.createdAt as string,
            updatedAt: cls.updatedAt as string,
          };
        }
      );
      
      setClasses(classContainers);
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
        // 更新本地状态
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
  
  // 初始化加载
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);
  
  return {
    classes,
    loading,
    error,
    statistics,
    fetchClasses,
    refetch: fetchClasses,
    getClassById,
    getRecommendedSubTeachers,
    assignSubTeacher,
    removeSubTeacher,
    updateHeadTeacher,
  };
}
