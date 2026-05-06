import { RoleConfig, AdministrativeRoleConfig, ModuleType, Permission, UserRole, AdministrativeRole } from '@/types';

/**
 * 角色配置映射
 * 
 * 统一身份角色来自教务系统：
 * - 主要角色（UserRole）：决定登录身份和基础权限
 * - 兼任职务（AdministrativeRole）：只增加权限，不作为登录身份
 * 
 * 权限说明：
 * - 校长/书记/副校长：全校管理权限
 * - 班主任：教师空间全部权限 + 班级管理
 * - 科任教师：教师空间全部权限
 * - 技能课教师：仅查看教师空间
 * - 家长：家长端全部权限
 */

/**
 * 主要角色配置
 */
export const roleConfigs: Record<UserRole, RoleConfig> = {
  // === 学校领导层 ===
  principal: {
    id: 'principal',
    name: '校长',
    description: '学校最高管理者，拥有全校数据总览和决策权限',
    modules: ['general', 'academic', 'moral', 'health', 'mental', 'teacher'],
    permissions: ['view', 'edit', 'approve', 'manage', 'admin'],
    avatar: '👨‍💼',
  },
  secretary: {
    id: 'secretary',
    name: '书记',
    description: '党委书记，负责学校党务和德育工作',
    modules: ['general', 'moral', 'health', 'mental', 'teacher'],
    permissions: ['view', 'edit', 'approve', 'manage', 'admin'],
    avatar: '👨‍💼',
  },
  academic_vice_principal: {
    id: 'academic_vice_principal',
    name: '教学副校长',
    description: '分管教务工作的副校长，负责教学质量管理',
    modules: ['academic', 'health', 'mental', 'teacher'],
    permissions: ['view', 'edit', 'approve', 'manage'],
    avatar: '👨‍💼',
  },
  moral_vice_principal: {
    id: 'moral_vice_principal',
    name: '德育副校长',
    description: '分管德育工作的副校长，负责学生德育和家校沟通',
    modules: ['moral', 'health', 'mental', 'teacher'],
    permissions: ['view', 'edit', 'approve', 'manage'],
    avatar: '👨‍💼',
  },
  general_vice_principal: {
    id: 'general_vice_principal',
    name: '总务副校长',
    description: '分管总务工作的副校长，负责后勤保障',
    modules: ['general', 'health', 'mental', 'teacher'],
    permissions: ['view', 'edit', 'approve', 'manage'],
    avatar: '👨‍💼',
  },

  // === 教师群体 ===
  head_teacher: {
    id: 'head_teacher',
    name: '班主任',
    description: '班级管理教师，拥有班主任工作系统权限',
    modules: ['teacher'],
    permissions: ['view', 'edit', 'manage', 'admin'],
    avatar: '👩‍🏫',
  },
  subject_teacher: {
    id: 'subject_teacher',
    name: '科任教师',
    description: '语文、数学、英语等主科教师，享有教师空间全部权限',
    modules: ['teacher'],
    permissions: ['view', 'edit', 'manage', 'admin'],
    avatar: '👨‍🏫',
  },
  skill_teacher: {
    id: 'skill_teacher',
    name: '技能课教师',
    description: '音乐、美术、体育、科学等技能课教师',
    modules: ['teacher'],
    permissions: ['view'],
    avatar: '👨‍🏫',
  },

  // === 家长 ===
  parent: {
    id: 'parent',
    name: '家长',
    description: '学生家长，可查看子女信息、添加习惯养成记录、查看成绩',
    modules: ['parent'],
    permissions: ['view', 'edit', 'admin'],
    avatar: '👨‍👩‍👧',
  },
};

/**
 * 兼任职务配置
 */
export const administrativeRoleConfigs: Record<AdministrativeRole, AdministrativeRoleConfig> = {
  academic_director: {
    id: 'academic_director',
    name: '教务主任',
    description: '教务处负责人，管理教学相关事务',
    modules: ['academic'],
    permissions: ['view', 'edit', 'approve', 'manage', 'admin'],
    avatar: '👩‍💼',
  },
  moral_director: {
    id: 'moral_director',
    name: '德育主任',
    description: '德育处负责人，管理德育相关事务',
    modules: ['moral', 'health', 'mental'],
    permissions: ['view', 'edit', 'approve', 'manage', 'admin'],
    avatar: '👩‍💼',
  },
  general_director: {
    id: 'general_director',
    name: '总务主任',
    description: '总务处负责人，管理后勤相关事务',
    modules: ['general'],
    permissions: ['view', 'edit', 'approve', 'manage', 'admin'],
    avatar: '👩‍💼',
  },
  grade_leader: {
    id: 'grade_leader',
    name: '年段长',
    description: '年级段负责人，负责本年级调课安排、教师请假协调',
    modules: ['teacher'],
    permissions: ['view', 'edit', 'approve'],
    avatar: '👨‍🏫',
    specialPermissions: {
      manageCourseAdjustment: true,
      receiveLeaveNotification: true,
      assignSubstituteTeacher: true,
      viewGradeSchedule: true,
    },
  },
  research_group_leader: {
    id: 'research_group_leader',
    name: '教研组组长',
    description: '教研组负责人，通常由班主任或科任教师兼任',
    modules: ['academic'],
    permissions: ['view', 'edit', 'manage'],
    avatar: '👨‍🏫',
  },
  research_group_deputy_leader: {
    id: 'research_group_deputy_leader',
    name: '教研组副组长',
    description: '教研组副负责人，通常由班主任或科任教师兼任',
    modules: ['academic'],
    permissions: ['view', 'edit'],
    avatar: '👨‍🏫',
  },
  young_pioneer_counselor: {
    id: 'young_pioneer_counselor',
    name: '少先队大队辅导员',
    description: '负责少先队活动组织与管理',
    modules: ['moral'],
    permissions: ['view', 'edit', 'manage'],
    avatar: '👨‍🏫',
  },
};

/**
 * 检查用户是否有权限访问模块
 */
export function hasModuleAccess(role: UserRole, module: ModuleType): boolean {
  const config = roleConfigs[role];
  if (!config) return false;
  return config.modules.includes(module);
}

/**
 * 检查用户是否有特定权限
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const config = roleConfigs[role];
  if (!config) return false;
  return config.permissions.includes(permission);
}

/**
 * 获取用户可访问的所有模块
 */
export function getAccessibleModules(role: UserRole): ModuleType[] {
  return roleConfigs[role]?.modules || [];
}

/**
 * 判断是否是班主任
 */
export function isHeadTeacher(role: UserRole): boolean {
  return role === 'head_teacher' || 
         role === 'principal' || 
         role === 'secretary' || 
         role === 'academic_vice_principal' ||
         role === 'moral_vice_principal' ||
         role === 'general_vice_principal';
}

/**
 * 判断是否是教师角色（包括班主任、科任教师、技能课教师）
 */
export function isTeacher(role: UserRole): boolean {
  return ['head_teacher', 'subject_teacher', 'skill_teacher'].includes(role);
}

/** 副校长角色列表 */
export const VICE_PRINCIPAL_ROLES: UserRole[] = [
  'academic_vice_principal',
  'moral_vice_principal', 
  'general_vice_principal'
];

/** 领导层角色列表 */
export const LEADER_ROLES: UserRole[] = [
  'principal',
  'secretary',
  ...VICE_PRINCIPAL_ROLES
];

/**
 * 根据部门获取对应的分管副校长角色
 */
export function getVicePrincipalByDepartment(department: string): UserRole | null {
  if (department === '教务处') return 'academic_vice_principal';
  if (department === '德育处') return 'moral_vice_principal';
  if (department === '总务处') return 'general_vice_principal';
  return null;
}

/**
 * 判断是否可以访问教务系统（仅教务处及校领导）
 */
export function canAccessAcademic(role: UserRole, additionalRoles?: AdministrativeRole[]): boolean {
  // 主要角色权限
  const hasDirectAccess = ['principal', 'secretary', 'academic_vice_principal'].includes(role);
  if (hasDirectAccess) return true;
  
  // 兼任职务权限
  if (additionalRoles) {
    if (additionalRoles.includes('academic_director') || 
        additionalRoles.includes('grade_leader') ||
        additionalRoles.includes('research_group_leader') ||
        additionalRoles.includes('research_group_deputy_leader')) {
      return true;
    }
  }
  
  return false;
}

/**
 * 判断是否可以访问德育系统
 */
export function canAccessMoral(role: UserRole, additionalRoles?: AdministrativeRole[]): boolean {
  // 主要角色权限
  const hasDirectAccess = ['principal', 'secretary', 'moral_vice_principal', 'head_teacher'].includes(role);
  if (hasDirectAccess) return true;
  
  // 兼任职务权限
  if (additionalRoles) {
    if (additionalRoles.includes('moral_director') || 
        additionalRoles.includes('young_pioneer_counselor')) {
      return true;
    }
  }
  
  return false;
}

/**
 * 判断是否可以访问总务系统
 */
export function canAccessGeneral(role: UserRole, additionalRoles?: AdministrativeRole[]): boolean {
  // 主要角色权限
  const hasDirectAccess = ['principal', 'secretary', 'general_vice_principal'].includes(role);
  if (hasDirectAccess) return true;
  
  // 兼任职务权限
  if (additionalRoles?.includes('general_director')) {
    return true;
  }
  
  return false;
}

/**
 * 模块名称映射
 */
export const moduleNames: Record<ModuleType, string> = {
  general: '总务系统',
  academic: '教务系统',
  moral: '德育系统',
  health: '体育健康',
  mental: '心理健康',
  teacher: '教师空间',
  parent: '家长端',
};
