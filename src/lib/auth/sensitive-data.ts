/**
 * 敏感数据访问权限检查模块
 * 
 * 用于判断用户是否有权限查看学生的敏感数据（手机号、身份证、家庭住址等）
 * 
 * 权限规则：
 * 1. 领导层/部门负责人：全校所有学生，完整显示
 * 2. 年段长：本年级所有学生，完整显示
 * 3. 班主任：本班学生，完整显示
 * 4. 科任：任教班级学生，完整显示
 * 5. 普通教师：无权限
 * 6. 家长：仅自己孩子，完整显示
 */

import { UserRole } from '@/types';
import { 
  getMockClassTeachersByTeacherId,
  getMockTeacherClassRelation 
} from '@/lib/mock/class-teachers.mock';
import { getMockStudent } from '@/lib/mock/students.mock';

// ============================================
// 类型定义
// ============================================

/**
 * 敏感数据类型
 */
export type SensitiveDataType = 
  | 'phone'           // 手机号
  | 'idCard'          // 身份证号
  | 'address'         // 家庭住址
  | 'bankAccount'     // 银行账号
  | 'all';            // 所有敏感数据

/**
 * 权限检查结果
 */
export interface PermissionCheckResult {
  /** 是否有权限 */
  allowed: boolean;
  /** 权限来源/原因 */
  reason?: string;
  /** 权限级别 */
  level: 'full' | 'partial' | 'none';
  /** 可见范围描述 */
  scope?: string;
}

/**
 * 用户上下文（简化版，用于权限检查）
 */
export interface UserContext {
  id: string;
  role: UserRole;
  name?: string;
  /** 年段长管理的年级 */
  managedGrades?: number[];
}

// ============================================
// 角色权限常量
// ============================================

/**
 * 拥有全校访问权限的角色
 */
const GLOBAL_ACCESS_ROLES: UserRole[] = [
  'principal',          // 校长
  'secretary',          // 书记
  'vice_principal',     // 副校长
  'academic_director',  // 教务主任
  'moral_director',     // 德育主任
];

/**
 * 有条件访问权限的角色（需要进一步判断关系）
 */
const CONDITIONAL_ACCESS_ROLES: UserRole[] = [
  'grade_leader',       // 年段长
  'head_teacher',       // 班主任
  'subject_teacher',    // 科任教师
  'skill_teacher',      // 技能课教师
  'research_group_leader',       // 教研组组长
  'research_group_deputy_leader', // 教研组副组长
  'parent',             // 家长
];

// ============================================
// 权限检查函数
// ============================================

/**
 * 检查用户是否可以查看学生的敏感数据
 * 
 * @param user 用户上下文
 * @param studentId 学生ID
 * @param dataType 敏感数据类型（默认 'all'）
 * @returns 权限检查结果
 */
export async function canViewStudentSensitiveData(
  user: UserContext,
  studentId: string,
  dataType: SensitiveDataType = 'all'
): Promise<PermissionCheckResult> {
  
  // 1. 领导层和部门负责人：全局权限
  if (GLOBAL_ACCESS_ROLES.includes(user.role)) {
    return {
      allowed: true,
      reason: `${getRoleDisplayName(user.role)}拥有全校访问权限`,
      level: 'full',
      scope: '全校所有学生',
    };
  }
  
  // 2. 获取学生信息
  const student = getMockStudent(studentId);
  if (!student) {
    return {
      allowed: false,
      reason: '学生不存在',
      level: 'none',
    };
  }
  
  // 3. 年段长：检查是否管理该学生所在年级
  if (user.role === 'grade_leader') {
    if (user.managedGrades?.includes(student.grade || 0)) {
      return {
        allowed: true,
        reason: '年段长管理该年级',
        level: 'full',
        scope: `本年级（${student.grade}年级）学生`,
      };
    }
    return {
      allowed: false,
      reason: '非本年级学生',
      level: 'none',
    };
  }
  
  // 4. 班主任/科任教师/技能课教师：检查班级教师关系
  if (user.role === 'head_teacher' || user.role === 'subject_teacher' || user.role === 'skill_teacher') {
    // 检查是否是该学生的班主任或科任
    const relation = getMockTeacherClassRelation(student.classId, user.id);
    
    if (relation) {
      if (relation.position === 'head_teacher') {
        return {
          allowed: true,
          reason: '班主任权限',
          level: 'full',
          scope: `本班（${student.className}）学生`,
        };
      } else {
        return {
          allowed: true,
          reason: '科任权限',
          level: 'full',
          scope: `任教班级（${student.className}）学生`,
        };
      }
    }
    
    return {
      allowed: false,
      reason: '非本班/任教班级学生',
      level: 'none',
    };
  }
  
  // 5. 家长：检查是否是自己孩子
  if (user.role === 'parent') {
    const isParent = student.parents?.some(p => p.id === user.id);
    if (isParent) {
      return {
        allowed: true,
        reason: '家长权限',
        level: 'full',
        scope: '仅自己孩子',
      };
    }
    return {
      allowed: false,
      reason: '非本人孩子',
      level: 'none',
    };
  }
  
  // 6. 其他角色：无权限
  return {
    allowed: false,
    reason: '无访问权限',
    level: 'none',
  };
}

/**
 * 批量检查用户对多个学生的权限
 * 
 * @param user 用户上下文
 * @param studentIds 学生ID列表
 * @returns 有权限的学生ID列表
 */
export async function filterStudentsByPermission(
  user: UserContext,
  studentIds: string[]
): Promise<string[]> {
  
  // 领导层/部门负责人：全部可见
  if (GLOBAL_ACCESS_ROLES.includes(user.role)) {
    return studentIds;
  }
  
  const allowedIds: string[] = [];
  
  for (const studentId of studentIds) {
    const result = await canViewStudentSensitiveData(user, studentId);
    if (result.allowed) {
      allowedIds.push(studentId);
    }
  }
  
  return allowedIds;
}

/**
 * 获取用户可访问的所有班级ID
 * 
 * @param user 用户上下文
 * @returns 可访问的班级ID列表
 */
export function getUserAccessibleClassIds(user: UserContext): string[] {
  
  // 领导层/部门负责人：全校所有班级
  if (GLOBAL_ACCESS_ROLES.includes(user.role)) {
    // 返回空数组表示全部可访问
    return [];
  }
  
  // 班主任/科任教师/技能课教师：返回任教班级
  if (user.role === 'head_teacher' || user.role === 'subject_teacher' || user.role === 'skill_teacher') {
    return getMockClassTeachersByTeacherId(user.id).map(ct => ct.classId);
  }
  
  // 年段长：返回管理的年级的所有班级
  if (user.role === 'grade_leader' && user.managedGrades) {
    // 需要根据年级查询班级，这里简化处理
    return [];
  }
  
  return [];
}

/**
 * 判断用户是否有全局访问权限
 * 
 * @param role 用户角色
 * @returns 是否有全局权限
 */
export function hasGlobalAccess(role: UserRole): boolean {
  return GLOBAL_ACCESS_ROLES.includes(role);
}

/**
 * 获取角色显示名称
 */
function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    principal: '校长',
    secretary: '书记',
    vice_principal: '副校长',
    academic_director: '教务主任',
    moral_director: '德育主任',
    general_director: '总务主任',
    academic_staff: '教务员',
    moral_staff: '德育员',
    head_teacher: '班主任',
    grade_leader: '年段长',
    subject_teacher: '科任教师',
    skill_teacher: '技能课教师',
    research_group_leader: '教研组组长',
    research_group_deputy_leader: '教研组副组长',
    staff: '后勤人员',
    student: '学生',
    parent: '家长',
  };
  return roleNames[role] || role;
}

// ============================================
// 数据过滤辅助函数
// ============================================

/**
 * 学生敏感字段
 */
export const STUDENT_SENSITIVE_FIELDS = [
  'phone',
  'idCard', 
  'homeAddress',
  'emergencyPhone',
  'bankAccount',
] as const;

/**
 * 家长敏感字段
 */
export const PARENT_SENSITIVE_FIELDS = [
  'phone',
  'idCard',
  'workUnit',
  'address',
] as const;

/**
 * 根据权限过滤学生数据中的敏感字段
 * 
 * @param student 学生数据
 * @param hasPermission 是否有权限查看敏感数据
 * @returns 过滤后的学生数据
 */
export function filterStudentSensitiveFields<T extends Record<string, unknown>>(
  student: T,
  hasPermission: boolean
): T {
  if (hasPermission) {
    return student; // 有权限，返回完整数据
  }
  
  // 无权限，移除敏感字段
  const filtered = { ...student } as Record<string, unknown>;
  
  for (const field of STUDENT_SENSITIVE_FIELDS) {
    if (field in filtered) {
      delete filtered[field];
    }
  }
  
  // 处理家长信息
  if (Array.isArray(filtered.parents)) {
    filtered.parents = filtered.parents.map((parent: Record<string, unknown>) => {
      const filteredParent = { ...parent };
      for (const field of PARENT_SENSITIVE_FIELDS) {
        if (field in filteredParent) {
          delete filteredParent[field];
        }
      }
      return filteredParent;
    });
  }
  
  return filtered as T;
}
