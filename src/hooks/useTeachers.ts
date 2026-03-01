/**
 * 教师数据管理 Hook
 * 
 * 统一管理教师数据的获取、更新、角色配置等操作
 * 所有涉及教师数据的组件都应该使用此 hook，确保数据一致性
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// ==================== 类型定义 ====================

/** 教师角色类型（主要角色） */
export type TeacherRole = 
  | 'head_teacher'              // 班主任
  | 'grade_leader'              // 年段长
  | 'subject_teacher'           // 科任教师（语文、数学、英语等主科教师）
  | 'skill_teacher';            // 技能课教师（体育、音乐、美术等）

/** 行政职务类型（可兼任） */
export type AdministrativeRole = 
  | 'principal'                 // 校长
  | 'secretary'                 // 书记
  | 'vice_principal'            // 副校长
  | 'academic_director'         // 教务主任
  | 'moral_director'            // 德育主任
  | 'general_director'          // 总务主任
  | 'grade_leader'              // 年段长
  | 'research_group_leader'     // 教研组组长
  | 'research_group_deputy_leader' // 教研组副组长
  | 'young_pioneer_counselor';  // 少先队大队辅导员

/** 角色标签映射 */
export const TEACHER_ROLE_LABELS: Record<TeacherRole, string> = {
  head_teacher: '班主任',
  grade_leader: '年段长',
  subject_teacher: '科任教师',
  skill_teacher: '技能课教师',
};

/** 行政职务标签映射 */
export const ADMINISTRATIVE_ROLE_LABELS: Record<AdministrativeRole, string> = {
  principal: '校长',
  secretary: '书记',
  vice_principal: '副校长',
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
  head_teacher: { bg: 'bg-amber-100', text: 'text-amber-700' },
  grade_leader: { bg: 'bg-purple-100', text: 'text-purple-700' },
  subject_teacher: { bg: 'bg-blue-100', text: 'text-blue-700' },
  skill_teacher: { bg: 'bg-green-100', text: 'text-green-700' },
};

/** 行政职务颜色映射 */
export const ADMINISTRATIVE_ROLE_COLORS: Record<AdministrativeRole, { bg: string; text: string }> = {
  principal: { bg: 'bg-red-100', text: 'text-red-700' },
  secretary: { bg: 'bg-red-100', text: 'text-red-700' },
  vice_principal: { bg: 'bg-rose-100', text: 'text-rose-700' },
  academic_director: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  moral_director: { bg: 'bg-pink-100', text: 'text-pink-700' },
  general_director: { bg: 'bg-slate-100', text: 'text-slate-700' },
  grade_leader: { bg: 'bg-purple-100', text: 'text-purple-700' },
  research_group_leader: { bg: 'bg-orange-100', text: 'text-orange-700' },
  research_group_deputy_leader: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  young_pioneer_counselor: { bg: 'bg-rose-100', text: 'text-rose-700' },
};

/** 教师完整信息 */
export interface TeacherInfo {
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
  
  // 角色信息
  primaryRole: TeacherRole;     // 主要角色
  additionalRoles: AdministrativeRole[]; // 兼任职务（可多项）
  
  // 课时配置
  weeklyHours: number;          // 周课时量
  currentHours: number;         // 已安排课时
  teachableSubjects: string[];  // 可任教科目
  teachableGrades: number[];    // 可任教年级
  
  // 班级关系
  isHeadTeacher: boolean;       // 是否班主任
  headTeacherClassId?: string;  // 班主任班级ID
  headTeacherClassName?: string;// 班主任班级名称
  subTeacherClasses?: Array<{ classId: string; className: string }>; // 科任班级列表
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

/** Hook 返回类型 */
export interface UseTeachersReturn {
  // 数据
  teachers: TeacherInfo[];
  loading: boolean;
  error: string | null;
  
  // 统计
  statistics: {
    total: number;
    headTeachers: number;
    subjectTeachers: number;
    skillTeachers: number;
    gradeLeaders: number;
    researchGroupLeaders: number;
    youngPioneerCounselors: number;
    departments: number;
  };
  
  // 角色选项
  roleOptions: Array<{ value: TeacherRole; label: string }>;
  adminRoleOptions: Array<{ value: AdministrativeRole; label: string }>;
  
  // 操作方法
  fetchTeachers: () => Promise<void>;
  refetch: () => Promise<void>; // fetchTeachers 的别名
  getTeacherById: (id: string) => TeacherInfo | undefined;
  updateTeacherRole: (config: TeacherRoleConfig) => Promise<boolean>;
  batchUpdateRoles: (configs: TeacherRoleConfig[]) => Promise<boolean>;
  
  // 工具方法
  getRoleLabel: (role: TeacherRole | AdministrativeRole) => string;
  getRoleColor: (role: TeacherRole | AdministrativeRole) => { bg: string; text: string };
  getTeacherRolesDisplay: (teacher: TeacherInfo) => string[];
}

// ==================== Hook 实现 ====================

export function useTeachers(): UseTeachersReturn {
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
  const statistics = useMemo(() => ({
    total: teachers.length,
    headTeachers: teachers.filter(t => t.primaryRole === 'head_teacher').length,
    subjectTeachers: teachers.filter(t => t.primaryRole === 'subject_teacher').length,
    skillTeachers: teachers.filter(t => t.primaryRole === 'skill_teacher').length,
    gradeLeaders: teachers.filter(t => 
      t.primaryRole === 'grade_leader' || t.additionalRoles.includes('grade_leader')
    ).length,
    researchGroupLeaders: teachers.filter(t => 
      t.additionalRoles.includes('research_group_leader') || t.additionalRoles.includes('research_group_deputy_leader')
    ).length,
    youngPioneerCounselors: teachers.filter(t => 
      t.additionalRoles.includes('young_pioneer_counselor')
    ).length,
    departments: new Set(teachers.map(t => t.department)).size,
  }), [teachers]);
  
  // 获取教师列表
  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/teachers?pageSize=500');
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
          primaryRole: (t.role as TeacherRole) || 'subject_teacher',
          additionalRoles: (t.additional_roles as AdministrativeRole[]) || [],
          weeklyHours: (t.total_weekly_hours as number) || 13,
          currentHours: 0,
          teachableSubjects: [t.primary_subject, ...(t.secondary_subjects as string[] || [])].filter(Boolean),
          teachableGrades: (t.teachable_grades as number[]) || [1, 2, 3, 4, 5, 6],
          isHeadTeacher: t.isHeadTeacher as boolean || false,
          headTeacherClassId: t.headTeacherClassId as string,
          headTeacherClassName: t.headTeacherClassName as string,
          subTeacherClasses: t.subTeacherClasses as Array<{ classId: string; className: string }> || [],
        }));
        setTeachers(formattedTeachers);
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
    teachers,
    loading,
    error,
    statistics,
    roleOptions,
    adminRoleOptions,
    fetchTeachers,
    refetch: fetchTeachers, // 别名，方便使用
    getTeacherById,
    updateTeacherRole,
    batchUpdateRoles,
    getRoleLabel,
    getRoleColor,
    getTeacherRolesDisplay,
  };
}

// ==================== 导出子模块 ====================

export { useTeachers as useTeacherData };
