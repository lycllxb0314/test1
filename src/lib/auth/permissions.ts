/**
 * 角色权限配置
 * 
 * 统一身份角色来自教务系统：
 * - 主要角色（UserRole）：决定登录身份和基础权限
 * - 兼任职务（AdministrativeRole）：只增加权限，不作为登录身份
 * - 群组权限（GroupMembership）：用户归入部门后继承部门权限
 * 
 * 系统会自动合并主要角色、兼任职务和群组的权限
 */

import { UserRole, ModuleType, Permission, AdministrativeRole, RoleConfig, UserGroupMembership, GROUP_CONFIGS } from '@/types';

/**
 * 主要角色权限映射
 * 定义每个主要角色对各模块的基础权限
 */
export const ROLE_PERMISSIONS: Record<UserRole, {
  name: string;
  modules: Partial<Record<ModuleType, Permission[]>>;
  description: string;
}> = {
  // === 学校领导层 ===
  principal: {
    name: '校长',
    description: '学校最高管理者，拥有所有模块的完全权限',
    modules: {
      general: ['admin'],
      academic: ['admin'],
      moral: ['admin'],
      teacher: ['admin'],
      parent: ['admin'],
    },
  },
  secretary: {
    name: '书记',
    description: '负责党务和德育工作，拥有德育模块的完全权限',
    modules: {
      moral: ['admin'],
      teacher: ['view', 'edit'],
      parent: ['view'],
    },
  },
  academic_vice_principal: {
    name: '教学副校长',
    description: '分管教务工作的副校长，负责教学质量管理',
    modules: {
      academic: ['manage'],
      teacher: ['manage'],
      parent: ['view'],
    },
  },
  moral_vice_principal: {
    name: '德育副校长',
    description: '分管德育工作的副校长，负责学生德育和家校沟通',
    modules: {
      moral: ['manage'],
      teacher: ['manage'],
      parent: ['manage'],
    },
  },
  general_vice_principal: {
    name: '总务副校长',
    description: '分管总务工作的副校长，负责后勤保障',
    modules: {
      general: ['manage'],
      teacher: ['manage'],
      parent: ['view'],
    },
  },

  // === 教师群体 ===
  head_teacher: {
    name: '班主任',
    description: '班级管理者，管理本班学生和家长，享有教师空间全部权限',
    modules: {
      teacher: ['admin'],
      parent: ['view'],
      moral: ['view', 'edit'], // 可以管理班级德育
    },
  },
  subject_teacher: {
    name: '科任教师',
    description: '语文、数学、英语等主科教师，享有教师空间全部权限',
    modules: {
      teacher: ['admin'],
      parent: ['view'],
    },
  },
  skill_teacher: {
    name: '技能课教师',
    description: '音乐、美术、体育、科学等技能课教师，查看个人信息和课表',
    modules: {
      teacher: ['view'],
    },
  },

  // === 家长 ===
  parent: {
    name: '家长',
    description: '家长用户，查看子女信息、成绩和通知',
    modules: {
      parent: ['admin'],
    },
  },
};

/**
 * 兼任职务权限映射
 * 兼任职务只增加权限，不作为登录身份
 */
export const ADMINISTRATIVE_ROLE_PERMISSIONS: Record<AdministrativeRole, {
  name: string;
  additionalModules: Partial<Record<ModuleType, Permission[]>>;
  description: string;
}> = {
  academic_director: {
    name: '教务主任',
    description: '教务部门负责人，管理教务相关所有事务',
    additionalModules: {
      academic: ['admin'],
    },
  },
  moral_director: {
    name: '德育主任',
    description: '德育部门负责人，管理德育相关所有事务',
    additionalModules: {
      moral: ['admin'],
      parent: ['manage'],
    },
  },
  general_director: {
    name: '总务主任',
    description: '总务部门负责人，管理后勤相关所有事务',
    additionalModules: {
      general: ['admin'],
    },
  },
  grade_leader: {
    name: '年段长',
    description: '年级管理者，管理本年级教师和学生',
    additionalModules: {
      teacher: ['manage'],
      academic: ['view', 'edit'], // 可以管理调课
    },
  },
  research_group_leader: {
    name: '教研组组长',
    description: '教研组负责人，负责教研活动组织与管理',
    additionalModules: {
      academic: ['view', 'edit'], // 可以管理教研活动
    },
  },
  research_group_deputy_leader: {
    name: '教研组副组长',
    description: '教研组副负责人，协助组长开展教研活动',
    additionalModules: {
      academic: ['view', 'edit'],
    },
  },
  young_pioneer_counselor: {
    name: '少先队大队辅导员',
    description: '负责少先队活动组织与管理',
    additionalModules: {
      moral: ['view', 'edit'], // 可以管理少先队活动
    },
  },
};

/**
 * 合并主要角色、兼任职务和群组的权限
 * 
 * @param primaryRole 主要角色
 * @param additionalRoles 兼任职务
 * @param groups 所属群组
 * @returns 合并后的权限映射
 */
export function getMergedPermissions(
  primaryRole: UserRole,
  additionalRoles: AdministrativeRole[] = [],
  groups: UserGroupMembership[] = []
): Partial<Record<ModuleType, Permission[]>> {
  // 获取主要角色权限
  const primaryPermissions = ROLE_PERMISSIONS[primaryRole]?.modules || {};
  
  // 合并兼任职务权限
  const mergedPermissions = { ...primaryPermissions };
  
  for (const adminRole of additionalRoles) {
    const additionalPermissions = ADMINISTRATIVE_ROLE_PERMISSIONS[adminRole]?.additionalModules || {};
    
    for (const [module, permissions] of Object.entries(additionalPermissions)) {
      const moduleKey = module as ModuleType;
      const existingPermissions = mergedPermissions[moduleKey] || [];
      
      // 合并权限（去重，取最高权限）
      const mergedModulePermissions = [...new Set([...existingPermissions, ...(permissions || [])])];
      
      // 权限级别排序：admin > manage > edit > view
      if (mergedModulePermissions.includes('admin')) {
        mergedPermissions[moduleKey] = ['admin'];
      } else if (mergedModulePermissions.includes('manage')) {
        mergedPermissions[moduleKey] = ['manage'];
      } else {
        mergedPermissions[moduleKey] = mergedModulePermissions as Permission[];
      }
    }
  }
  
  // 合并群组权限
  for (const group of groups) {
    const groupConfig = GROUP_CONFIGS[group.groupType];
    if (!groupConfig) continue;
    
    const groupPermissions = groupConfig.modulePermissions;
    
    for (const [module, permissions] of Object.entries(groupPermissions)) {
      if (!permissions || permissions.length === 0) continue;
      
      const moduleKey = module as ModuleType;
      const existingPermissions = mergedPermissions[moduleKey] || [];
      
      // 合并权限（去重，取最高权限）
      const mergedModulePermissions = [...new Set([...existingPermissions, ...permissions])];
      
      // 权限级别排序：admin > manage > edit > view
      if (mergedModulePermissions.includes('admin')) {
        mergedPermissions[moduleKey] = ['admin'];
      } else if (mergedModulePermissions.includes('manage')) {
        mergedPermissions[moduleKey] = ['manage'];
      } else {
        mergedPermissions[moduleKey] = mergedModulePermissions as Permission[];
      }
    }
  }
  
  return mergedPermissions;
}

/**
 * 获取角色的所有可访问模块
 */
export function getRoleModules(role: UserRole): ModuleType[] {
  const roleConfig = ROLE_PERMISSIONS[role];
  if (!roleConfig) return [];
  return Object.keys(roleConfig.modules) as ModuleType[];
}

/**
 * 检查角色是否有指定模块的访问权限
 */
export function canAccessModule(
  role: UserRole,
  module: ModuleType,
  additionalRoles?: AdministrativeRole[],
  groups?: UserGroupMembership[]
): boolean {
  const permissions = getMergedPermissions(role, additionalRoles, groups);
  return module in permissions;
}

/**
 * 获取角色在指定模块的权限列表
 */
export function getModulePermissions(role: UserRole, module: ModuleType): Permission[] {
  const roleConfig = ROLE_PERMISSIONS[role];
  if (!roleConfig) return [];
  return roleConfig.modules[module] || [];
}

/**
 * 检查角色在指定模块是否有指定权限
 */
export function hasPermission(role: UserRole, module: ModuleType, permission: Permission): boolean {
  const permissions = getModulePermissions(role, module);
  
  // admin 权限包含所有权限
  if (permissions.includes('admin')) return true;
  
  // manage 权限包含 view, edit, approve
  if (permission === 'view' || permission === 'edit' || permission === 'approve') {
    if (permissions.includes('manage')) return true;
  }
  
  // approve 权限包含 view, edit
  if (permission === 'view' || permission === 'edit') {
    if (permissions.includes('approve')) return true;
  }
  
  // edit 权限包含 view
  if (permission === 'view') {
    if (permissions.includes('edit')) return true;
  }
  
  return permissions.includes(permission);
}

/**
 * 检查是否为管理员角色（学校领导层）
 */
export function isAdminRole(role: UserRole, additionalRoles?: AdministrativeRole[]): boolean {
  // 学校领导层
  if (['principal', 'secretary', 'academic_vice_principal', 'moral_vice_principal', 'general_vice_principal'].includes(role)) {
    return true;
  }
  // 兼任主任职务
  if (additionalRoles && (
    additionalRoles.includes('academic_director') ||
    additionalRoles.includes('moral_director') ||
    additionalRoles.includes('general_director')
  )) {
    return true;
  }
  return false;
}

/**
 * 检查是否为教师角色
 */
export function isTeacherRole(role: UserRole): boolean {
  return ['head_teacher', 'subject_teacher', 'skill_teacher'].includes(role);
}

/**
 * 检查是否为部门负责人（兼任职务）
 */
export function isDirectorRole(additionalRoles?: AdministrativeRole[]): boolean {
  if (!additionalRoles) return false;
  return (
    additionalRoles.includes('academic_director') ||
    additionalRoles.includes('moral_director') ||
    additionalRoles.includes('general_director')
  );
}

/**
 * 获取角色的完整配置信息
 */
export function getRoleConfig(role: UserRole): RoleConfig | null {
  const roleData = ROLE_PERMISSIONS[role];
  if (!roleData) return null;
  
  // 将权限映射转换为数组
  const permissions: { module: ModuleType; permissions: Permission[] }[] = [];
  for (const [module, perms] of Object.entries(roleData.modules)) {
    permissions.push({
      module: module as ModuleType,
      permissions: perms || [],
    });
  }
  
  return {
    id: role,
    name: roleData.name,
    description: roleData.description,
    modules: getRoleModules(role),
    permissions: permissions.flatMap(p => p.permissions) as Permission[],
    avatar: `/avatars/${role}.png`,
  };
}

/**
 * 获取所有角色配置
 */
export function getAllRoleConfigs(): RoleConfig[] {
  return Object.keys(ROLE_PERMISSIONS).map(role => getRoleConfig(role as UserRole)!);
}

/**
 * 模块名称映射
 */
export const MODULE_NAMES: Record<ModuleType, string> = {
  general: '总务后勤',
  academic: '教务教研',
  moral: '德育管理',
  teacher: '教师空间',
  parent: '家长端',
  health: '体育健康',
  mental: '心理健康',
};

/**
 * 权限名称映射
 */
export const PERMISSION_NAMES: Record<Permission, string> = {
  view: '查看',
  edit: '编辑',
  approve: '审批',
  manage: '管理',
  admin: '完全控制',
};

/**
 * 路由到模块的映射
 * 用于路由保护
 */
export const ROUTE_MODULE_MAP: Record<string, ModuleType> = {
  '/general': 'general',
  '/academic': 'academic',
  '/moral': 'moral',
  '/teacher': 'teacher',
  '/parent': 'parent',
};

/**
 * 根据路径获取所需模块权限
 */
export function getModuleForPath(path: string): ModuleType | null {
  for (const [prefix, module] of Object.entries(ROUTE_MODULE_MAP)) {
    if (path.startsWith(prefix)) {
      return module;
    }
  }
  return null;
}
