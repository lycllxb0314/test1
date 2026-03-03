/**
 * 教师数据管理 Hook
 * 
 * ==================== 架构定位 ====================
 * 教师是系统的第二核心、独立实体。
 * 教师有独立身份、账号、权限、个人业务，本身是完整独立实体。
 * 但教师会与班级关联：担任班主任、任课、跨班教学、管理年段。
 * 
 * ==================== 职责边界 ====================
 * 1. 教师独立存在，拥有完整的个人信息、角色、权限
 * 2. 与班级强相关：班主任、科任、跨班教学、年段管理
 * 3. 提供完整的教师管理功能（创建、更新、删除）
 * 4. 提供角色配置、课时配置功能
 * 5. 提供履历记录、荣誉、培训管理功能
 * 
 * ==================== 关联关系 ====================
 * - 独立实体，不依赖其他 Hook
 * - 可被班级 Hook 引用和关联
 * - 提供按班级关联查询方法
 * 
 * ==================== 数据获取 ====================
 * - 使用统一分页配置 (src/lib/pagination-config.ts)
 * - 支持大数据量获取，确保获取所有教师数据
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PAGINATION } from '@/lib/pagination-config';

// ==================== 类型定义 ====================

/** 教师主要角色类型 */
export type TeacherRole = 
  // === 领导层（主要角色就是领导职务）===
  | 'principal'                 // 校长
  | 'secretary'                 // 书记
  | 'vice_principal'            // 副校长
  // === 教师群体 ===
  | 'head_teacher'              // 班主任
  | 'subject_teacher'           // 科任教师（语文、数学、英语等主科教师）
  | 'skill_teacher'             // 技能课教师（体育、音乐、美术等）
  | 'subject_head';             // 学科组长（视为技能课教师）

/** 行政职务类型（可兼任） */
export type AdministrativeRole = 
  | 'academic_director'         // 教务主任
  | 'moral_director'            // 德育主任
  | 'general_director'          // 总务主任
  | 'grade_leader'              // 年段长
  | 'research_group_leader'     // 教研组组长
  | 'research_group_deputy_leader' // 教研组副组长
  | 'young_pioneer_counselor';  // 少先队大队辅导员

/** 角色标签映射 */
export const TEACHER_ROLE_LABELS: Record<TeacherRole, string> = {
  principal: '校长',
  secretary: '书记',
  vice_principal: '副校长',
  head_teacher: '班主任',
  subject_teacher: '科任教师',
  skill_teacher: '技能课教师',
  subject_head: '学科组长',
};

/** 行政职务标签映射 */
export const ADMINISTRATIVE_ROLE_LABELS: Record<AdministrativeRole, string> = {
  academic_director: '教务主任',
  moral_director: '德育主任',
  general_director: '总务主任',
  grade_leader: '年段长',
  research_group_leader: '教研组组长',
  research_group_deputy_leader: '教研组副组长',
  young_pioneer_counselor: '少先队大队辅导员',
};

/** 角色颜色映射 */
export const TEACHER_ROLE_COLORS: Record<TeacherRole, { bg: string; text: string }> = {
  principal: { bg: 'bg-red-100', text: 'text-red-700' },
  secretary: { bg: 'bg-red-100', text: 'text-red-700' },
  vice_principal: { bg: 'bg-rose-100', text: 'text-rose-700' },
  head_teacher: { bg: 'bg-amber-100', text: 'text-amber-700' },
  subject_teacher: { bg: 'bg-blue-100', text: 'text-blue-700' },
  skill_teacher: { bg: 'bg-green-100', text: 'text-green-700' },
  subject_head: { bg: 'bg-teal-100', text: 'text-teal-700' },
};

/** 行政职务颜色映射 */
export const ADMINISTRATIVE_ROLE_COLORS: Record<AdministrativeRole, { bg: string; text: string }> = {
  academic_director: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  moral_director: { bg: 'bg-pink-100', text: 'text-pink-700' },
  general_director: { bg: 'bg-slate-100', text: 'text-slate-700' },
  grade_leader: { bg: 'bg-purple-100', text: 'text-purple-700' },
  research_group_leader: { bg: 'bg-orange-100', text: 'text-orange-700' },
  research_group_deputy_leader: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  young_pioneer_counselor: { bg: 'bg-rose-100', text: 'text-rose-700' },
};

/** 教师筛选参数 */
export interface TeacherFilters {
  search?: string;
  role?: TeacherRole | 'all';
  department?: string | 'all';
  status?: string | 'all';
}

/** 班级关联信息 */
export interface ClassRelation {
  classId: string;
  className: string;
  grade: number;
  role: 'head_teacher' | 'sub_teacher' | 'subject_teacher';
}

/** 教师完整信息 */
export interface TeacherInfo {
  // === 基本信息 ===
  id: string;
  name: string;
  gender: string;
  subject: string;              // 主教学科
  title: string;                // 职称
  department: string;           // 教研组
  phone: string;
  email: string;
  status: string;
  teachYears: number;
  avatar?: string;
  
  // === 个人信息扩展 ===
  birthDate?: string;           // 出生日期
  idCard?: string;              // 身份证号
  ethnicity?: string;           // 民族
  politicalStatus?: string;     // 政治面貌
  nativePlace?: string;         // 籍贯
  
  // === 联系方式扩展 ===
  emergencyContact?: string;    // 紧急联系人
  emergencyPhone?: string;      // 紧急联系电话
  address?: string;             // 家庭住址
  
  // === 工作信息扩展 ===
  employeeId?: string;          // 工号
  titleDate?: string;           // 职称获得日期
  education?: string;           // 学历
  school?: string;              // 毕业院校
  major?: string;               // 专业
  graduationDate?: string;      // 毕业日期
  joinDate?: string;            // 入职日期
  
  // === 角色信息 ===
  primaryRole: TeacherRole;     // 主要角色
  additionalRoles: AdministrativeRole[]; // 兼任职务（可多项）
  
  // === 课时配置 ===
  weeklyHours: number;          // 周课时量
  currentHours: number;         // 已安排课时
  teachableSubjects: string[];  // 可任教科目
  teachableGrades: number[];    // 可任教年级
  
  // === 班级关系（独立实体，但与班级强相关） ===
  isHeadTeacher: boolean;       // 是否班主任
  headTeacherClassId?: string;  // 班主任班级ID
  headTeacherClassName?: string;// 班主任班级名称
  classRelations?: ClassRelation[]; // 所有班级关联
  subTeacherClasses?: Array<{ classId: string; className: string }>; // 科任班级列表
  
  // === 履历记录 ===
  records?: Array<{
    id: string;
    type: string;
    title: string;
    description?: string;
    date: string;
  }>;
  
  // === 荣誉 ===
  honors?: Array<{
    id: string;
    title: string;
    level: string;
    category?: string;
    issuer?: string;
    date: string;
    certificateNo?: string;
  }>;
  
  // === 培训 ===
  trainings?: Array<{
    id: string;
    name: string;
    type?: string;
    organizer?: string;
    startDate: string;
    endDate?: string;
    hours?: number;
    status?: string;
  }>;
  
  // === 成就 ===
  achievements?: Array<{
    id: string;
    type: string;
    title: string;
    level?: string;
    result?: string;
    date: string;
    description?: string;
  }>;
  
  // === 时间戳 ===
  createdAt?: string;
  updatedAt?: string;
}

/** 教师角色配置 */
export interface TeacherRoleConfig {
  teacherId: string;
  primaryRole: TeacherRole;
  additionalRoles: AdministrativeRole[];
  primarySubject: string;
  secondarySubjects: string[];
  totalWeeklyHours: number;
  teachableGrades: number[];
}

/** 教师统计信息 */
export interface TeacherStatistics {
  total: number;
  leaders: number;
  headTeachers: number;
  subjectTeachers: number;
  skillTeachers: number;
  gradeLeaders: number;
  researchGroupLeaders: number;
  youngPioneerCounselors: number;
  departments: number;
  byDepartment: Record<string, number>;
  byTitle: Record<string, number>;
}

/** 分页信息 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Hook 返回类型 */
export interface UseTeachersReturn {
  // === 数据 ===
  teachers: TeacherInfo[];
  loading: boolean;
  error: string | null;
  
  // === 统计 ===
  statistics: TeacherStatistics;
  pagination: PaginationInfo;
  
  // === 筛选 ===
  filters: TeacherFilters;
  setFilters: (filters: TeacherFilters) => void;
  
  // === 角色选项 ===
  roleOptions: Array<{ value: TeacherRole; label: string }>;
  adminRoleOptions: Array<{ value: AdministrativeRole; label: string }>;
  
  // === 查询方法 ===
  fetchTeachers: () => Promise<void>;
  refetch: () => Promise<void>;
  getTeacherById: (id: string) => TeacherInfo | undefined;
  getTeachersByRole: (role: TeacherRole) => TeacherInfo[];
  getTeachersByDepartment: (department: string) => TeacherInfo[];
  
  // === 班级关联查询 ===
  getHeadTeacherByClass: (classId: string) => TeacherInfo | undefined;
  getTeachersByGrade: (grade: number) => TeacherInfo[];
  getGradeLeader: (grade: number) => TeacherInfo | undefined;
  
  // === 教师管理 ===
  createTeacher: (data: Partial<TeacherInfo>) => Promise<boolean>;
  updateTeacher: (id: string, data: Partial<TeacherInfo>) => Promise<boolean>;
  deleteTeacher: (id: string) => Promise<boolean>;
  
  // === 角色配置 ===
  updateTeacherRole: (config: TeacherRoleConfig) => Promise<boolean>;
  batchUpdateRoles: (configs: TeacherRoleConfig[]) => Promise<boolean>;
  
  // === 工具方法 ===
  getRoleLabel: (role: TeacherRole | AdministrativeRole) => string;
  getRoleColor: (role: TeacherRole | AdministrativeRole) => { bg: string; text: string };
  getTeacherRolesDisplay: (teacher: TeacherInfo) => string[];
}

// ==================== Hook 实现 ====================

export function useTeachers(initialFilters?: TeacherFilters): UseTeachersReturn {
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TeacherFilters>(initialFilters || {});
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 500,
    total: 0,
    totalPages: 0,
  });
  
  // 角色选项
  const roleOptions = useMemo(() => 
    Object.entries(TEACHER_ROLE_LABELS).map(([value, label]) => ({
      value: value as TeacherRole,
      label,
    })),
  []);
  
  const adminRoleOptions = useMemo(() => 
    Object.entries(ADMINISTRATIVE_ROLE_LABELS).map(([value, label]) => ({
      value: value as AdministrativeRole,
      label,
    })),
  []);
  
  // 统计数据
  const statistics = useMemo<TeacherStatistics>(() => {
    const byDepartment: Record<string, number> = {};
    const byTitle: Record<string, number> = {};
    
    teachers.forEach(t => {
      byDepartment[t.department] = (byDepartment[t.department] || 0) + 1;
      byTitle[t.title] = (byTitle[t.title] || 0) + 1;
    });
    
    return {
      total: teachers.length,
      // 领导层
      leaders: teachers.filter(t => 
        t.primaryRole === 'principal' || t.primaryRole === 'secretary' || t.primaryRole === 'vice_principal'
      ).length,
      // 教师群体
      headTeachers: teachers.filter(t => t.primaryRole === 'head_teacher').length,
      subjectTeachers: teachers.filter(t => t.primaryRole === 'subject_teacher').length,
      skillTeachers: teachers.filter(t => t.primaryRole === 'skill_teacher').length,
      // 兼任职务统计
      gradeLeaders: teachers.filter(t => t.additionalRoles.includes('grade_leader')).length,
      researchGroupLeaders: teachers.filter(t => 
        t.additionalRoles.includes('research_group_leader') || t.additionalRoles.includes('research_group_deputy_leader')
      ).length,
      youngPioneerCounselors: teachers.filter(t => 
        t.additionalRoles.includes('young_pioneer_counselor')
      ).length,
      departments: new Set(teachers.map(t => t.department)).size,
      byDepartment,
      byTitle,
    };
  }, [teachers]);
  
  // 获取教师列表
  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/teachers?pageSize=${PAGINATION.ENTITY_CONFIG.teachers.fetchPageSize}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const formattedTeachers: TeacherInfo[] = result.data.map((t: Record<string, unknown>) => ({
          id: t.id as string,
          name: t.name as string,
          gender: t.gender === 'male' ? '男' : t.gender === 'female' ? '女' : '男',
          subject: (t.primary_subject as string) || (t.subjects as string[])?.[0] || '语文',
          title: (t.title as string) || '二级教师',
          department: (t.department as string) || `${(t.subjects as string[])?.[0] || '语文'}组`,
          phone: (t.phone as string) || '',
          email: (t.email as string) || '',
          status: (t.status as string) || 'active',
          teachYears: (t.teachYears as number) || 0,
          avatar: t.avatar as string,
          // 角色映射逻辑：
          // 1. 如果 role === 'subject_head'，视为 skill_teacher
          // 2. 如果 role 有值，直接使用
          // 3. 如果 role 为空，根据 primary_subject 判断：
          //    - 语文、数学 → subject_teacher（主科教师）
          //    - 其他科目 → skill_teacher（技能科教师）
          primaryRole: (() => {
            const role = t.role as TeacherRole | undefined;
            if (role === 'subject_head') return 'skill_teacher';
            if (role) return role;
            // role 为空时，根据主教学科判断
            const primarySubject = (t.primary_subject as string) || (t.subjects as string[])?.[0] || '';
            if (primarySubject === '语文' || primarySubject === '数学') {
              return 'subject_teacher';
            }
            return 'skill_teacher';
          })() as TeacherRole,
          additionalRoles: (t.additional_roles as AdministrativeRole[]) || [],
          weeklyHours: (t.total_weekly_hours as number) || 13,
          currentHours: (t.used_hours as number) || 0,  // 从 schedule_slots 统计的已排课时
          // teachable_subjects：数据库字段为空，从 primary_subject + secondary_subjects 构建
          teachableSubjects: (() => {
            const ts = t.teachable_subjects as string[] | undefined;
            if (ts && ts.length > 0) return ts;
            const primary = t.primary_subject as string;
            const secondary = (t.secondary_subjects as string[]) || [];
            return [primary, ...secondary].filter(Boolean) as string[];
          })(),
          teachableGrades: (t.teachable_grades as number[]) || [1, 2, 3, 4, 5, 6],
          isHeadTeacher: t.isHeadTeacher as boolean || false,
          headTeacherClassId: t.headTeacherClassId as string,
          headTeacherClassName: t.headTeacherClassName as string,
          birthDate: t.birth_date as string,
          idCard: t.id_card as string,
          ethnicity: t.ethnicity as string,
          politicalStatus: t.political_status as string,
          nativePlace: t.native_place as string,
          emergencyContact: t.emergency_contact as string,
          emergencyPhone: t.emergency_phone as string,
          address: t.address as string,
          employeeId: t.employee_id as string,
          education: t.education as string,
          school: t.school as string,
          major: t.major as string,
          joinDate: t.join_date as string,
          createdAt: t.created_at as string,
          updatedAt: t.updated_at as string,
        }));
        setTeachers(formattedTeachers);
        
        if (result.pagination) {
          setPagination(prev => ({
            ...prev,
            total: result.pagination.total,
            totalPages: result.pagination.totalPages,
          }));
        }
      }
    } catch (err) {
      console.error('获取教师数据失败:', err);
      setError('获取教师数据失败');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 根据ID获取教师
  const getTeacherById = useCallback((id: string) => 
    teachers.find(t => t.id === id),
  [teachers]);
  
  // 根据角色获取教师
  const getTeachersByRole = useCallback((role: TeacherRole) => 
    teachers.filter(t => t.primaryRole === role),
  [teachers]);
  
  // 根据部门获取教师
  const getTeachersByDepartment = useCallback((department: string) => 
    teachers.filter(t => t.department === department),
  [teachers]);
  
  // 根据班级获取班主任
  const getHeadTeacherByClass = useCallback((classId: string) => 
    teachers.find(t => t.headTeacherClassId === classId),
  [teachers]);
  
  // 根据年级获取教师（可任教该年级的教师）
  const getTeachersByGrade = useCallback((grade: number) => 
    teachers.filter(t => t.teachableGrades.includes(grade)),
  [teachers]);
  
  // 获取年段长
  const getGradeLeader = useCallback((grade: number) => 
    teachers.find(t => t.additionalRoles.includes('grade_leader')),
    // TODO: 实际应该根据年级段长配置来查找
  [teachers]);
  
  // 创建教师
  const createTeacher = useCallback(async (data: Partial<TeacherInfo>): Promise<boolean> => {
    try {
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchTeachers();
        return true;
      }
      return false;
    } catch (err) {
      console.error('创建教师失败:', err);
      return false;
    }
  }, [fetchTeachers]);
  
  // 更新教师
  const updateTeacher = useCallback(async (id: string, data: Partial<TeacherInfo>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/teachers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        // 更新本地状态
        setTeachers(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
        return true;
      }
      return false;
    } catch (err) {
      console.error('更新教师信息失败:', err);
      return false;
    }
  }, []);
  
  // 删除教师
  const deleteTeacher = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/teachers/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTeachers(prev => prev.filter(t => t.id !== id));
        return true;
      }
      return false;
    } catch (err) {
      console.error('删除教师失败:', err);
      return false;
    }
  }, []);
  
  // 更新教师角色
  const updateTeacherRole = useCallback(async (config: TeacherRoleConfig): Promise<boolean> => {
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
      });
      
      if (response.ok) {
        // 更新本地状态
        setTeachers(prev => prev.map(t => 
          t.id === config.teacherId 
            ? { 
                ...t, 
                primaryRole: config.primaryRole,
                additionalRoles: config.additionalRoles,
                subject: config.primarySubject,
                teachableSubjects: [config.primarySubject, ...config.secondarySubjects],
                weeklyHours: config.totalWeeklyHours,
                teachableGrades: config.teachableGrades,
                isHeadTeacher: config.primaryRole === 'head_teacher',
              }
            : t
        ));
        return true;
      }
      return false;
    } catch (err) {
      console.error('更新教师角色失败:', err);
      return false;
    }
  }, []);
  
  // 批量更新角色
  const batchUpdateRoles = useCallback(async (configs: TeacherRoleConfig[]): Promise<boolean> => {
    try {
      const results = await Promise.all(configs.map(config => updateTeacherRole(config)));
      return results.every(r => r);
    } catch (err) {
      console.error('批量更新角色失败:', err);
      return false;
    }
  }, [updateTeacherRole]);
  
  // 获取角色标签
  const getRoleLabel = useCallback((role: TeacherRole | AdministrativeRole): string => {
    if (role in TEACHER_ROLE_LABELS) {
      return TEACHER_ROLE_LABELS[role as TeacherRole];
    }
    if (role in ADMINISTRATIVE_ROLE_LABELS) {
      return ADMINISTRATIVE_ROLE_LABELS[role as AdministrativeRole];
    }
    return role;
  }, []);
  
  // 获取角色颜色
  const getRoleColor = useCallback((role: TeacherRole | AdministrativeRole): { bg: string; text: string } => {
    if (role in TEACHER_ROLE_COLORS) {
      return TEACHER_ROLE_COLORS[role as TeacherRole];
    }
    if (role in ADMINISTRATIVE_ROLE_COLORS) {
      return ADMINISTRATIVE_ROLE_COLORS[role as AdministrativeRole];
    }
    return { bg: 'bg-gray-100', text: 'text-gray-700' };
  }, []);
  
  // 获取教师角色显示列表
  const getTeacherRolesDisplay = useCallback((teacher: TeacherInfo): string[] => {
    const roles: string[] = [getRoleLabel(teacher.primaryRole)];
    teacher.additionalRoles.forEach(role => {
      roles.push(getRoleLabel(role) + '（兼）');
    });
    return roles;
  }, [getRoleLabel]);
  
  // 初始化加载
  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);
  
  return {
    // 数据
    teachers,
    loading,
    error,
    statistics,
    pagination,
    
    // 筛选
    filters,
    setFilters,
    
    // 角色选项
    roleOptions,
    adminRoleOptions,
    
    // 查询方法
    fetchTeachers,
    refetch: fetchTeachers,
    getTeacherById,
    getTeachersByRole,
    getTeachersByDepartment,
    
    // 班级关联查询
    getHeadTeacherByClass,
    getTeachersByGrade,
    getGradeLeader,
    
    // 教师管理
    createTeacher,
    updateTeacher,
    deleteTeacher,
    
    // 角色配置
    updateTeacherRole,
    batchUpdateRoles,
    
    // 工具方法
    getRoleLabel,
    getRoleColor,
    getTeacherRolesDisplay,
  };
}

// 导出别名
export { useTeachers as useTeacherData };

export default useTeachers;
