import { RoleConfig, ModuleType, Permission } from '@/types';

// 角色配置映射
// 权限说明：
// - 普通教师：只能访问教师空间（课表、通知、请假调课）
// - 班主任：教师空间 + 德育管理（班主任工作系统）
// - 年段长：教师空间 + 教务系统（调课管理专属功能）
// - 教务员：教务系统
// - 德育员：德育系统
// - 总务员：总务后勤
// - 校长/书记/副校长：全部权限
export const roleConfigs: Record<string, RoleConfig> = {
  // === 学校领导层 ===
  principal: {
    id: 'principal',
    name: '校长',
    description: '学校最高管理者，拥有全校数据总览和决策权限',
    modules: ['general', 'academic', 'moral', 'teacher', 'homepage'],
    permissions: ['view', 'edit', 'approve', 'manage', 'admin'],
    avatar: '👨‍💼',
  },
  secretary: {
    id: 'secretary',
    name: '书记',
    description: '党委书记，负责学校党务和德育工作',
    modules: ['general', 'academic', 'moral', 'teacher', 'homepage'],
    permissions: ['view', 'edit', 'approve', 'manage', 'admin'],
    avatar: '👨‍💼',
  },
  vice_principal: {
    id: 'vice_principal',
    name: '分管副校长',
    description: '分管特定领域的副校长',
    modules: ['general', 'academic', 'moral', 'teacher', 'homepage'],
    permissions: ['view', 'edit', 'approve', 'manage'],
    avatar: '👨‍💼',
  },
  
  // === 部门负责人 ===
  academic_director: {
    id: 'academic_director',
    name: '教务主任',
    description: '教务处负责人，管理教学相关事务',
    modules: ['academic', 'teacher', 'homepage'],
    permissions: ['view', 'edit', 'approve', 'manage'],
    avatar: '👩‍💼',
  },
  moral_director: {
    id: 'moral_director',
    name: '德育主任',
    description: '德育处负责人，管理德育相关事务',
    modules: ['moral', 'teacher', 'homepage'],
    permissions: ['view', 'edit', 'approve', 'manage'],
    avatar: '👩‍💼',
  },
  general_director: {
    id: 'general_director',
    name: '总务主任',
    description: '总务处负责人，管理后勤相关事务',
    modules: ['general'],
    permissions: ['view', 'edit', 'approve', 'manage'],
    avatar: '👩‍💼',
  },
  
  // === 普通职员 ===
  academic_staff: {
    id: 'academic_staff',
    name: '教务员',
    description: '教务处工作人员',
    modules: ['academic'],
    permissions: ['view', 'edit'],
    avatar: '👩‍💼',
  },
  moral_staff: {
    id: 'moral_staff',
    name: '德育员',
    description: '德育处工作人员',
    modules: ['moral'],
    permissions: ['view', 'edit'],
    avatar: '👩‍💼',
  },
  
  // === 教师群体 ===
  head_teacher: {
    id: 'head_teacher',
    name: '班主任',
    description: '班级管理教师，拥有班主任工作系统权限',
    modules: ['teacher'],
    permissions: ['view', 'edit'],
    avatar: '👩‍🏫',
  },
  grade_leader: {
    id: 'grade_leader',
    name: '年段长',
    description: '年级段负责人，负责本年级调课安排、教师请假协调、年级事务管理',
    modules: ['teacher', 'academic'],
    permissions: ['view', 'edit', 'approve'],
    avatar: '👨‍🏫',
    // 年段长特有权限
    specialPermissions: {
      manageCourseAdjustment: true,      // 调课管理
      receiveLeaveNotification: true,    // 接收请假通知
      assignSubstituteTeacher: true,     // 指派代课教师
      viewGradeSchedule: true,           // 查看年级课表
    },
    // 管理的年级
    managedGrades: [],                    // 如 [1, 2] 表示管理一、二年级
  },
  teacher: {
    id: 'teacher',
    name: '教师',
    description: '普通教师，可访问教师空间（课表、通知、请假调课）',
    modules: ['teacher'],
    permissions: ['view', 'edit'],
    avatar: '👨‍🏫',
  },
  
  // === 其他人员 ===
  staff: {
    id: 'staff',
    name: '后勤人员',
    description: '学校后勤工作人员',
    modules: ['general'],
    permissions: ['view', 'edit'],
    avatar: '👷',
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

// 判断是否是班主任
export function isHeadTeacher(role: string): boolean {
  return role === 'head_teacher' || 
         role === 'principal' || 
         role === 'secretary' || 
         role === 'vice_principal' ||
         role === 'moral_director';
}

// 判断是否可以访问教务系统（仅教务处及校领导）
export function canAccessAcademic(role: string): boolean {
  const academicRoles = ['principal', 'secretary', 'vice_principal', 'academic_director', 'academic_staff'];
  return academicRoles.includes(role);
}

// 判断是否可以访问德育系统
export function canAccessMoral(role: string): boolean {
  const moralRoles = ['principal', 'secretary', 'vice_principal', 'moral_director', 'moral_staff'];
  return moralRoles.includes(role);
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
    description: '课表查看、学校通知、请假调课、班主任工作台',
    color: '#9B59B6',
    icon: 'Users',
  },
  homepage: {
    name: '主页管理',
    description: '学校主页内容编辑、新闻发布、荣誉展示',
    color: '#E65100',
    icon: 'Edit',
  },
};
