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
 * 
 * ==================== 数据获取 ====================
 * - 使用统一分页配置 (src/lib/pagination-config.ts)
 * - 支持大数据量获取，确保获取所有班级数据
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PAGINATION } from '@/lib/pagination-config';
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
  subject?: string;        // 主教学科
  title?: string;
  avatar?: string;
  // 新增：更详细的教师信息
  primarySubject?: string;  // 主教学科（数据库字段）
  subjects?: string[];      // 可任教科目
  headTeacherClassId?: string;    // 班主任所在班级ID
  headTeacherClassName?: string;  // 班主任所在班级名称
  subTeacherClasses?: Array<{ classId: string; className: string }>; // 科任所在班级
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
  
  // 班主任信息（来自班级聚合根）
  headTeacherId?: string;
  headTeacherName?: string;
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
export interface UseClassesReturn {
  // === 数据 ===
  allClasses: ClassContainer[];     // 全部班级数据（用于统计等）
  classes: ClassContainer[];        // 当前页班级数据
  loading: boolean;
  error: string | null;
  
  // === 统计 ===
  statistics: ClassStatistics;
  pagination: FrontendPaginationControl;  // 前端分页控制
  
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
  const [allClasses, setAllClasses] = useState<ClassContainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ClassFilters>(initialFilters || {});
  
  // === 前端分页状态 ===
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState<number>(PAGINATION.DEFAULT_DISPLAY_PAGE_SIZE);
  const pageSizeOptions = PAGINATION.PAGE_SIZE_OPTIONS;
  
  // 统计数据（基于全部数据）
  const statistics = useMemo<ClassStatistics>(() => {
    const gradeDistribution: Record<number, number> = {};
    
    allClasses.forEach(c => {
      gradeDistribution[c.grade] = (gradeDistribution[c.grade] || 0) + 1;
    });
    
    const totalStudents = allClasses.reduce((sum, c) => sum + c.studentCount, 0);
    const totalParents = allClasses.reduce((sum, c) => sum + c.parentCount, 0);
    
    return {
      totalClasses: allClasses.length,
      activeClasses: allClasses.filter(c => c.status === 'active').length,
      inactiveClasses: allClasses.filter(c => c.status !== 'active').length,
      totalStudents,
      totalParents,
      classesWithSubTeacher: allClasses.filter(c => c.subTeacherId).length,
      classesWithoutSubTeacher: allClasses.filter(c => !c.subTeacherId).length,
      gradeDistribution,
      avgStudentsPerClass: allClasses.length > 0 ? Math.round(totalStudents / allClasses.length) : 0,
      avgParentsPerClass: allClasses.length > 0 ? Math.round(totalParents / allClasses.length) : 0,
    };
  }, [allClasses]);
  
  // 获取班级列表（含学生和家长）
  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 并行获取班级和教师数据（使用统一分页配置）
      const [classesRes, teachersRes] = await Promise.all([
        fetch(`/api/classes?pageSize=${PAGINATION.ENTITY_CONFIG.classes.fetchPageSize}`),
        fetch(`/api/teachers?pageSize=${PAGINATION.ENTITY_CONFIG.teachers.fetchPageSize}`),
      ]);
      
      // 检查响应状态
      if (!classesRes.ok) {
        throw new Error(`获取班级数据失败: ${classesRes.status}`);
      }
      if (!teachersRes.ok) {
        throw new Error(`获取教师数据失败: ${teachersRes.status}`);
      }
      
      const classesData = await classesRes.json();
      const teachersData = await teachersRes.json();
      
      if (!classesData.success) {
        throw new Error('获取班级数据失败');
      }
      
      // 分批获取学生数据（使用统一分页配置）
      const allStudents: Record<string, unknown>[] = [];
      let page = 1;
      const batchSize = PAGINATION.ENTITY_CONFIG.students.fetchPageSize;
      
      while (true) {
        const studentsRes = await fetch(`/api/students?page=${page}&pageSize=${batchSize}`);
        
        // 检查响应状态
        if (!studentsRes.ok) {
          console.error(`获取学生数据失败: ${studentsRes.status}`);
          break;
        }
        
        const studentsData = await studentsRes.json();
        
        if (!studentsData.success || !studentsData.data || studentsData.data.length === 0) {
          break;
        }
        
        allStudents.push(...studentsData.data);
        
        // 如果返回的数据少于 batchSize，说明已经获取完所有数据
        if (studentsData.data.length < batchSize) {
          break;
        }
        page++;
      }
      
      console.log(`获取学生数据完成: ${allStudents.length}人`);
      
      // 检查第一个学生的classId格式
      if (allStudents.length > 0) {
        const firstStudent = allStudents[0];
        console.log('第一个学生数据:', {
          id: firstStudent.id,
          name: firstStudent.name,
          classId: firstStudent.classId,
          class_id: firstStudent.class_id,
        });
      }
      
      // 构建学生映射（按班级分组）
      // API返回驼峰格式，兼容两种格式
      const studentsByClass: Record<string, unknown[]> = {};
      allStudents.forEach((student: Record<string, unknown>) => {
        const classId = (student.classId as string) || (student.class_id as string);
        if (!studentsByClass[classId]) {
          studentsByClass[classId] = [];
        }
        studentsByClass[classId].push(student);
      });
      
      console.log('班级映射统计:', Object.entries(studentsByClass).map(([id, students]) => ({
        classId: id,
        count: students.length
      })).slice(0, 5));
      
      // 构建教师映射（使用 employee_id 作为键，因为班级的 head_teacher_id 是工号格式）
      const teachersMap: Record<string, Record<string, unknown>> = {};
      const teachersByEmployeeId: Record<string, Record<string, unknown>> = {};
      (teachersData.data || []).forEach((teacher: Record<string, unknown>) => {
        // 使用 id 作为键（兼容旧逻辑）
        teachersMap[teacher.id as string] = teacher;
        // 使用 employee_id 作为键（用于匹配班级的班主任/科任工号）
        const employeeId = teacher.employeeId as string || teacher.employee_id as string;
        if (employeeId) {
          teachersByEmployeeId[employeeId] = teacher;
        }
      });
      
      // 构建班级容器
      const classContainers: ClassContainer[] = (classesData.data || []).map(
        (cls: Record<string, unknown>) => {
          const classStudents = (studentsByClass[cls.id as string] || []) as Record<string, unknown>[];
          
          // 转换学生信息（API返回驼峰格式，兼容两种格式）
          const students: StudentBasicInfo[] = classStudents.map((s) => ({
            id: s.id as string,
            studentNo: (s.studentNo as string) || (s.student_no as string) || '',
            name: s.name as string,
            gender: (s.gender as 'male' | 'female') || 'male',
            birthDate: (s.birthDate as string) || (s.birth_date as string),
            status: (s.status as StudentBasicInfo['status']) || '在校',
            avatar: s.avatar as string,
            parents: (s.parents as Parent[]) || [],
          }));
          
          // 先获取班主任详情（在聚合家长之前）
          // API 返回驼峰格式，兼容两种格式
          const headTeacherId = (cls.headTeacherId as string) || (cls.head_teacher_id as string) || '';
          // 使用工号查找教师（优先），兼容 UUID 格式
          const headTeacher = headTeacherId ? (teachersByEmployeeId[headTeacherId] || teachersMap[headTeacherId]) : null;
          const headTeacherName = (headTeacher?.name as string) || (cls.headTeacherName as string) || (cls.head_teacher_name as string) || '';
          
          // 获取科任详情
          const subTeacherId = (cls.subTeacherId as string) || (cls.sub_teacher_id as string);
          // 使用工号查找教师（优先），兼容 UUID 格式
          const subTeacher = subTeacherId ? (teachersByEmployeeId[subTeacherId] || teachersMap[subTeacherId]) : null;
          
          // 聚合家长信息（现在可以包含班主任信息了）
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
                  // 班主任信息
                  headTeacherId: headTeacherId,
                  headTeacherName: headTeacherName,
                });
              });
            }
          });
          
          return {
            id: cls.id as string,
            name: cls.name as string,
            grade: cls.grade as number,
            gradeName: GRADE_NAMES[cls.grade as number] || `${cls.grade}年级`,
            classNumber: (cls.classNumber as number) || (cls.class_number as number) || 1,
            
            // 班主任
            headTeacherId,
            headTeacherName,
            headTeacher: headTeacher ? {
              id: (headTeacher.employeeId as string) || (headTeacher.employee_id as string) || headTeacher.id as string, // 使用工号作为 ID
              name: headTeacher.name as string,
              gender: headTeacher.gender as string,
              phone: headTeacher.phone as string,
              subject: headTeacher.primary_subject as string,  // 修正：使用 primary_subject
              primarySubject: headTeacher.primary_subject as string,
              subjects: headTeacher.subjects as string[],
              title: headTeacher.title as string,
              avatar: headTeacher.avatar as string,
              headTeacherClassId: headTeacher.headTeacherClassId as string,
              headTeacherClassName: headTeacher.headTeacherClassName as string,
              subTeacherClasses: headTeacher.subTeacherClasses as Array<{ classId: string; className: string }>,
            } : undefined,
            
            // 科任
            subTeacherId,
            subTeacherName: (subTeacher?.name as string) || (cls.subTeacherName as string) || (cls.sub_teacher_name as string),
            subTeacher: subTeacher ? {
              id: (subTeacher.employeeId as string) || (subTeacher.employee_id as string) || subTeacher.id as string, // 使用工号作为 ID
              name: subTeacher.name as string,
              gender: subTeacher.gender as string,
              phone: subTeacher.phone as string,
              subject: subTeacher.primary_subject as string,  // 修正：使用 primary_subject
              primarySubject: subTeacher.primary_subject as string,
              subjects: subTeacher.subjects as string[],
              title: subTeacher.title as string,
              avatar: subTeacher.avatar as string,
              headTeacherClassId: subTeacher.headTeacherClassId as string,
              headTeacherClassName: subTeacher.headTeacherClassName as string,
              subTeacherClasses: subTeacher.subTeacherClasses as Array<{ classId: string; className: string }>,
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
            classroomId: (cls.classroomId as string) || (cls.classroom_id as string),
            classroomName: (cls.classroomName as string) || (cls.classroom_name as string),
            building: cls.building as string,
            floor: cls.floor as number,
            
            // 班级特色
            motto: cls.motto as string,
            features: cls.features as string[],
            
            // 状态
            status: (cls.status as ClassContainer['status']) || 'active',
            
            // 时间戳
            createdAt: (cls.createdAt as string) || (cls.created_at as string),
            updatedAt: (cls.updatedAt as string) || (cls.updated_at as string),
          };
        }
      );
      
      console.log(`班级聚合完成: ${classContainers.length}个班级`);
      console.log(`第一个班级学生数: ${classContainers[0]?.students?.length || 0}`);
      
      setAllClasses(classContainers);
    } catch (err) {
      console.error('获取班级数据失败:', err);
      setError(err instanceof Error ? err.message : '获取班级数据失败');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 筛选后的数据
  const filteredClasses = useMemo(() => {
    let result = allClasses;
    
    // 搜索筛选
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.headTeacherName.toLowerCase().includes(searchLower)
      );
    }
    
    // 年级筛选
    if (filters.grade && filters.grade !== 'all') {
      result = result.filter(c => c.grade === filters.grade);
    }
    
    // 状态筛选
    if (filters.status && filters.status !== 'all') {
      result = result.filter(c => c.status === filters.status);
    }
    
    // 班主任筛选
    if (filters.headTeacherId) {
      result = result.filter(c => c.headTeacherId === filters.headTeacherId);
    }
    
    return result;
  }, [allClasses, filters]);
  
  // === 前端分页计算 ===
  const total = filteredClasses.length;
  const totalPages = Math.ceil(total / pageSize);
  
  // 前端分页后的当前页数据
  const classes = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredClasses.slice(start, end);
  }, [filteredClasses, page, pageSize]);
  
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
  
  // 根据ID获取班级（从全部数据中查找）
  const getClassById = useCallback((id: string) => 
    allClasses.find(c => c.id === id),
  [allClasses]);
  
  // 根据年级获取班级（从全部数据中查找）
  const getClassesByGrade = useCallback((grade: number) => 
    allClasses.filter(c => c.grade === grade).sort((a, b) => a.classNumber - b.classNumber),
  [allClasses]);
  
  // 根据班主任获取班级（从全部数据中查找）
  const getClassesByHeadTeacher = useCallback((teacherId: string) => 
    allClasses.filter(c => c.headTeacherId === teacherId),
  [allClasses]);
  
  // 获取班级学生列表（从全部数据中查找）
  const getStudentsByClass = useCallback((classId: string) => {
    const cls = allClasses.find(c => c.id === classId);
    return cls?.students || [];
  }, [allClasses]);
  
  // 获取班级家长列表（从全部数据中查找）
  const getParentsByClass = useCallback((classId: string) => {
    const cls = allClasses.find(c => c.id === classId);
    return cls?.parents || [];
  }, [allClasses]);
  
  // 获取班级主要家长列表（从全部数据中查找）
  const getPrimaryParentsByClass = useCallback((classId: string) => {
    const cls = allClasses.find(c => c.id === classId);
    return cls?.parents.filter(p => p.isPrimary) || [];
  }, [allClasses]);
  
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
        setAllClasses(prev => prev.map(c => {
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
        setAllClasses(prev => prev.filter(c => c.id !== id));
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
        setAllClasses(prev => prev.map(c => {
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
        setAllClasses(prev => prev.map(c => {
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
        setAllClasses(prev => prev.map(c => {
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
    const targetClass = allClasses.find(c => c.id === classId);
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
  }, [allClasses]);
  
  // 初始化加载
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);
  
  return {
    // 数据
    allClasses,
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
