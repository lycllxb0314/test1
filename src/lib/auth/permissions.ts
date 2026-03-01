/**
 * 角色权限配置
 * 定义每个角色对各模块的访问权限
 */

import { UserRole, ModuleType, Permission, RoleConfig } from '@/types';

/**
 * 角色权限映射
 * 定义每个角色可以访问的模块及对应权限
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
      homepage: ['admin'],
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
      homepage: ['admin'],
      moral: ['admin'],
      teacher: ['view', 'edit'],
      parent: ['view'],
    },
  },
  vice_principal: {
    name: '副校长',
    description: '分管副校长，根据分管领域拥有相应权限',
    modules: {
      homepage: ['manage'],
      general: ['manage'],
      academic: ['manage'],
      moral: ['manage'],
      teacher: ['manage'],
      parent: ['view'],
    },
  },

  // === 部门负责人 ===
  academic_director: {
    name: '教务主任',
    description: '教务部门负责人，管理教务相关所有事务',
    modules: {
      academic: ['admin'],
      teacher: ['manage'],
      homepage: ['edit'],
    },
  },
  moral_director: {
    name: '德育主任',
    description: '德育部门负责人，管理德育相关所有事务',
    modules: {
      moral: ['admin'],
      teacher: ['view', 'edit'],
      parent: ['manage'],
      homepage: ['edit'],
    },
  },
  general_director: {
    name: '总务主任',
    description: '总务部门负责人，管理后勤相关所有事务',
    modules: {
      general: ['admin'],
      homepage: ['edit'],
    },
  },

  // === 普通职员 ===
  academic_staff: {
    name: '教务员',
    description: '教务处工作人员，负责日常教务管理',
    modules: {
      academic: ['manage'],
    },
  },
  moral_staff: {
    name: '德育员',
    description: '德育处工作人员，负责日常德育管理',
    modules: {
      moral: ['manage'],
      parent: ['view'],
    },
  },

  // === 教师群体 ===
  head_teacher: {
    name: '班主任',
    description: '班级管理者，管理本班学生和家长',
    modules: {
      teacher: ['manage'],
      parent: ['view'],
    },
  },
  grade_leader: {
    name: '年段长',
    description: '年级管理者，管理本年级教师和学生',
    modules: {
      teacher: ['manage'],
      parent: ['view'],
      academic: ['view', 'edit'], // 可以管理调课
    },
  },
  subject_teacher: {
    name: '科任教师',
    description: '语文、数学、英语等主科教师，享有与班主任同等权限',
    modules: {
      teacher: ['manage'],
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
  research_group_leader: {
    name: '教研组组长',
    description: '教研组负责人，通常由班主任或科任教师兼任，负责教研活动组织与管理',
    modules: {
      teacher: ['manage'],
      parent: ['view'],
      academic: ['view', 'edit'], // 可以管理教研活动
    },
  },
  research_group_deputy_leader: {
    name: '教研组副组长',
    description: '教研组副负责人，通常由班主任或科任教师兼任，协助组长开展教研活动',
    modules: {
      teacher: ['manage'],
      parent: ['view'],
      academic: ['view', 'edit'], // 可以协助管理教研活动
    },
  },

  // === 其他人员 ===
  staff: {
    name: '后勤人员',
    description: '后勤工作人员',
    modules: {
      general: ['view', 'edit'],
    },
  },
  student: {
    name: '学生',
    description: '学生用户，查看个人信息和成绩',
    modules: {
      parent: ['view'], // 通过家长端查看
    },
  },
  parent: {
    name: '家长',
    description: '家长用户，查看子女信息和成绩',
    modules: {
      parent: ['view'],
    },
  },
};

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
export function canAccessModule(role: UserRole, module: ModuleType): boolean {
  const roleConfig = ROLE_PERMISSIONS[role];
  if (!roleConfig) return false;
  return module in roleConfig.modules;
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
 * 检查是否为管理员角色
 */
export function isAdminRole(role: UserRole): boolean {
  const adminRoles: UserRole[] = [
    'principal',
    'secretary',
    'vice_principal',
    'academic_director',
    'moral_director',
    'general_director',
  ];
  return adminRoles.includes(role);
}

/**
 * 检查是否为教师角色
 */
export function isTeacherRole(role: UserRole): boolean {
  const teacherRoles: UserRole[] = [
    'head_teacher',
    'grade_leader',
    'subject_teacher',
    'skill_teacher',
    'research_group_leader',
    'research_group_deputy_leader',
  ];
  return teacherRoles.includes(role);
}

/**
 * 检查是否为部门负责人
 */
export function isDirectorRole(role: UserRole): boolean {
  const directorRoles: UserRole[] = [
    'academic_director',
    'moral_director',
    'general_director',
  ];
  return directorRoles.includes(role);
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
  homepage: '主页管理',
  general: '总务后勤',
  academic: '教务教研',
  moral: '德育管理',
  teacher: '教师空间',
  parent: '家长端',
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
  '/homepage': 'homepage',
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
