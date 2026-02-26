import { RoleConfig, ModuleType, Permission } from '@/types';

// 角色配置映射
export const roleConfigs: Record<string, RoleConfig> = {
  principal: {
    id: 'principal',
    name: '校长',
    description: '学校最高管理者，拥有全校数据总览和决策权限',
    modules: ['general', 'academic', 'moral', 'teacher'],
    permissions: ['view', 'edit', 'approve', 'manage', 'admin'],
    avatar: '👨‍💼',
  },
  secretary: {
    id: 'secretary',
    name: '书记',
    description: '党委书记，负责学校党务和德育工作',
    modules: ['general', 'academic', 'moral', 'teacher'],
    permissions: ['view', 'edit', 'approve', 'manage', 'admin'],
    avatar: '👨‍💼',
  },
  vice_principal: {
    id: 'vice_principal',
    name: '分管副校长',
    description: '分管特定领域的副校长',
    modules: ['general', 'academic', 'moral', 'teacher'],
    permissions: ['view', 'edit', 'approve', 'manage'],
    avatar: '👨‍💼',
  },
  admin: {
    id: 'admin',
    name: '行政人员',
    description: '学校行政管理人员',
    modules: ['general', 'academic', 'moral'],
    permissions: ['view', 'edit', 'manage'],
    avatar: '👩‍💼',
  },
  head_teacher: {
    id: 'head_teacher',
    name: '班主任',
    description: '班级管理教师，可访问教师空间',
    modules: ['teacher', 'academic', 'moral'],
    permissions: ['view', 'edit'],
    avatar: '👩‍🏫',
  },
  teacher: {
    id: 'teacher',
    name: '教师',
    description: '普通教师，可访问教师空间',
    modules: ['teacher', 'academic'],
    permissions: ['view', 'edit'],
    avatar: '👨‍🏫',
  },
  student: {
    id: 'student',
    name: '学生',
    description: '在校学生',
    modules: [],
    permissions: ['view'],
    avatar: '👦',
  },
  parent: {
    id: 'parent',
    name: '家长',
    description: '学生家长',
    modules: [],
    permissions: ['view'],
    avatar: '👨‍👩‍👧',
  },
  staff: {
    id: 'staff',
    name: '后勤人员',
    description: '学校后勤工作人员',
    modules: ['general'],
    permissions: ['view', 'edit'],
    avatar: '👷',
  },
};

// 检查用户是否有权限访问模块
export function hasModuleAccess(role: string, module: ModuleType): boolean {
  const config = roleConfigs[role];
  if (!config) return false;
  return config.modules.includes(module);
}

// 检查用户是否有特定权限
export function hasPermission(role: string, permission: Permission): boolean {
  const config = roleConfigs[role];
  if (!config) return false;
  return config.permissions.includes(permission);
}

// 获取用户可访问的所有模块
export function getAccessibleModules(role: string): ModuleType[] {
  return roleConfigs[role]?.modules || [];
}

// 模块名称映射
export const moduleNames: Record<ModuleType, { name: string; description: string; color: string; icon: string }> = {
  general: {
    name: '总务后勤',
    description: '资产管理、报修维护、采购管理、财务管理、安全保障',
    color: '#E8734A',
    icon: 'Building2',
  },
  academic: {
    name: '教务教研',
    description: '课程安排、成绩管理、考试管理、教研活动、教师发展',
    color: '#5B9BD5',
    icon: 'GraduationCap',
  },
  moral: {
    name: '德育管理',
    description: '少先队管理、德育活动、学生评价、行为记录、成长档案',
    color: '#4CAF50',
    icon: 'Heart',
  },
  teacher: {
    name: '教师空间',
    description: '班主任工作台、班级管理、家校沟通、信息收集、日常管理',
    color: '#9B59B6',
    icon: 'Users',
  },
};
