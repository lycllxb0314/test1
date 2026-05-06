/**
 * 用户与角色类型定义
 * 
 * @module types/user
 */

// ==================== 角色类型 ====================

/**
 * 用户角色枚举（用于登录身份）
 * 
 * 统一身份角色来自教务系统：
 * - 教师角色：从教务系统的教师主要角色获取
 * - 家长角色：从学生关联的家长信息获取
 * 
 * 兼任职务（AdministrativeRole）只增加权限，不作为登录身份
 */
export type UserRole = 
  // === 学校领导层（主要角色就是领导职务）===
  | 'principal'        // 校长
  | 'secretary'        // 书记
  | 'academic_vice_principal'   // 教学副校长（分管教务）
  | 'moral_vice_principal'      // 德育副校长（分管德育）
  | 'general_vice_principal'    // 总务副校长（分管总务）
  // === 教师群体 ===
  | 'head_teacher'     // 班主任（语文或数学老师）
  | 'subject_teacher'  // 科任教师（语文或数学老师，与班主任互补配对）
  | 'skill_teacher'    // 技能课教师（英语、音乐、美术、体育等）
  // === 家长 ===
  | 'parent';          // 家长

/** 行政职务类型（可兼任，只增加权限，不作为登录身份） */
export type AdministrativeRole = 
  | 'academic_director'         // 教务主任
  | 'moral_director'            // 德育主任
  | 'general_director'          // 总务主任
  | 'grade_leader'              // 年段长
  | 'research_group_leader'     // 教研组组长
  | 'research_group_deputy_leader' // 教研组副组长
  | 'young_pioneer_counselor';  // 少先队大队辅导员

// ==================== 模块与权限 ====================

/** 模块类型 */
export type ModuleType = 
  | 'general'      // 总务后勤
  | 'academic'     // 教务教研
  | 'moral'        // 德育管理
  | 'health'       // 学生体育健康管理
  | 'mental'       // 学生心理健康
  | 'teacher'      // 教师空间
  | 'parent';      // 家长端

/** 权限类型 */
export type Permission = 
  | 'view'         // 查看
  | 'edit'         // 编辑
  | 'approve'      // 审批
  | 'manage'       // 管理
  | 'admin';       // 超级管理

// ==================== 角色配置 ====================

/** 角色配置 */
export interface RoleConfig {
  id: UserRole;
  name: string;
  description: string;
  modules: ModuleType[];
  permissions: Permission[];
  avatar: string;
  // 年段长特有配置
  specialPermissions?: {
    manageCourseAdjustment?: boolean;      // 调课管理
    receiveLeaveNotification?: boolean;    // 接收请假通知
    assignSubstituteTeacher?: boolean;     // 指派代课教师
    viewGradeSchedule?: boolean;           // 查看年级课表
  };
  managedGrades?: number[];                // 管理的年级（年段长专用）
}

/** 兼任职务配置 */
export interface AdministrativeRoleConfig {
  id: AdministrativeRole;
  name: string;
  description: string;
  modules: ModuleType[];
  permissions: Permission[];
  avatar: string;
  specialPermissions?: RoleConfig['specialPermissions'];
}

// ==================== 用户信息 ====================

/** 用户群组信息（嵌入用户数据） */
export interface UserGroupMembership {
  groupId: string;
  groupType: GroupType;
  groupName: string;
  isAdmin: boolean;
  joinType: 'auto' | 'manual';
}

/** 用户信息 */
export interface User {
  id: string;
  name: string;
  role: UserRole;
  employeeId?: string;    // 工号
  avatar?: string;
  phone?: string;
  email?: string;
  department?: string;
  position?: string;
  classId?: string;       // 班主任/学生所属班级
  className?: string;
  subjects?: string[];    // 教师任教学科
  additionalRoles?: AdministrativeRole[];  // 兼任职务
  groups?: UserGroupMembership[];  // 所属群组
  subTeacherClasses?: Array<{ classId: string; className: string }>;  // 科任所在班级列表
  children?: {            // 家长关联的学生
    id: string;
    name: string;
    classId: string;
    className: string;
  }[];
}

// ==================== 群组 ====================

/** 群组类型（行政部门） */
export type GroupType = 
  | 'principal_office'    // 校长室
  | 'academic_office'     // 教务处
  | 'moral_office'        // 德育处
  | 'general_office'      // 总务处
  | 'clinic_office';      // 医务室

/** 群组配置 */
export interface GroupConfig {
  id: GroupType;
  name: string;
  description: string;
  modulePermissions: Partial<Record<ModuleType, Permission[]>>;
  autoIncludeRoles: UserRole[];
  directorRole?: AdministrativeRole;
}

/** 群组信息 */
export interface GroupInfo {
  id: string;
  type: GroupType;
  name: string;
  description?: string;
  directorId?: string;
  directorName?: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

/** 群组成员 */
export interface GroupMember {
  id: string;
  groupId: string;
  groupType: GroupType;
  groupName: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  employeeId?: string;
  isAdmin: boolean;
  joinType: 'auto' | 'manual';
  joinedAt: string;
}

// ==================== 导出常量 ====================

/** 角色名称映射 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  principal: '校长',
  secretary: '书记',
  academic_vice_principal: '教学副校长',
  moral_vice_principal: '德育副校长',
  general_vice_principal: '总务副校长',
  head_teacher: '班主任',
  subject_teacher: '科任教师',
  skill_teacher: '技能课教师',
  parent: '家长',
};

/** 行政职务名称映射 */
export const ADMINISTRATIVE_ROLE_LABELS: Record<AdministrativeRole, string> = {
  academic_director: '教务主任',
  moral_director: '德育主任',
  general_director: '总务主任',
  grade_leader: '年段长',
  research_group_leader: '教研组组长',
  research_group_deputy_leader: '教研组副组长',
  young_pioneer_counselor: '少先队大队辅导员',
};

/** 群组配置映射 */
export const GROUP_CONFIGS: Record<GroupType, GroupConfig> = {
  principal_office: {
    id: 'principal_office',
    name: '校长室',
    description: '学校最高行政管理部门',
    modulePermissions: {
      academic: ['view', 'edit', 'admin'],
      moral: ['view', 'edit', 'admin'],
      general: ['view', 'edit', 'admin'],
      health: ['view', 'edit', 'admin'],
      mental: ['view', 'edit', 'admin'],
      teacher: ['view', 'edit', 'admin'],
    },
    autoIncludeRoles: ['principal', 'secretary', 'academic_vice_principal', 'moral_vice_principal', 'general_vice_principal'],
    directorRole: undefined,
  },
  academic_office: {
    id: 'academic_office',
    name: '教务处',
    description: '负责教学管理、课程安排、教师培训等',
    modulePermissions: {
      academic: ['view', 'edit', 'admin'],
      health: ['view'],
    },
    autoIncludeRoles: [],
    directorRole: 'academic_director',
  },
  moral_office: {
    id: 'moral_office',
    name: '德育处',
    description: '负责学生德育、班级管理、少先队等',
    modulePermissions: {
      moral: ['view', 'edit', 'admin'],
      health: ['view', 'edit', 'admin'],
      mental: ['view', 'edit', 'admin'],
    },
    autoIncludeRoles: [],
    directorRole: 'moral_director',
  },
  general_office: {
    id: 'general_office',
    name: '总务处',
    description: '负责后勤保障、资产管理、安全保卫等',
    modulePermissions: {
      general: ['view', 'edit', 'admin'],
    },
    autoIncludeRoles: [],
    directorRole: 'general_director',
  },
  clinic_office: {
    id: 'clinic_office',
    name: '医务室',
    description: '负责学生体质健康监测、体检数据管理、健康档案维护',
    modulePermissions: {
      health: ['view', 'edit', 'admin'],
      mental: ['view', 'edit'],
    },
    autoIncludeRoles: [],
    directorRole: undefined,
  },
};
