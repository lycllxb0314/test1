/**
 * 智慧校园系统 - 统一类型定义
 * 
 * 模块化重构：所有类型按模块拆分，统一从此文件导出
 * 保持向后兼容性，原有导入路径无需修改
 * 
 * @module types
 */

// ==================== 用户与角色 ====================
export {
  // 角色类型
  type UserRole,
  type AdministrativeRole,
  type ModuleType,
  type Permission,
  
  // 角色配置
  type RoleConfig,
  type AdministrativeRoleConfig,
  
  // 用户信息
  type User,
  type UserGroupMembership,
  
  // 群组
  type GroupType,
  type GroupConfig,
  type GroupInfo,
  type GroupMember,
  
  // 常量
  USER_ROLE_LABELS,
  ADMINISTRATIVE_ROLE_LABELS,
  GROUP_CONFIGS,
} from './user';

// ==================== 教师 ====================
export {
  // 基本信息
  type Teacher,
  type TeacherProfile,
  
  // 成长记录
  type TeacherRecord,
  type TeacherHonor,
  type TeacherTraining,
  type TeacherAchievement,
  
  // 班级教师关系
  type ClassTeacherPosition,
  type ClassTeacherStatus,
  type ClassTeacher,
  type CreateClassTeacherRequest,
  type UpdateClassTeacherRequest,
  
  // 工作量
  type TeacherWorkload,
} from './teacher';

// ==================== 学生 ====================
export {
  // 基本信息
  type StudentStatus,
  type Parent,
  type Student,
  type StudentFullProfile,
  
  // 学业记录
  type StudentAcademicRecord,
  type StudentHonor,
  type StudentGrowthRecord,
  type StudentMoralRecord,
  
  // 习惯养成
  type HabitCategory,
  type HabitAssessment,
} from './student';

// ==================== 班级 ====================
export {
  // 基本信息
  type ClassStatus,
  type Class,
  type ClassInfo,
  type ClassContainer,
  
  // 关联信息
  type TeacherBasicInfo,
  type StudentBasicInfo,
  type ParentBasicInfo,
  
  // 筛选与统计
  type ClassFilters,
  type ClassStatistics,
  
  // 教师候选人
  type TeacherCandidate,
} from './class';

// ==================== 工作流 ====================
export {
  // 状态与类型
  type WorkflowStatus,
  type WorkflowType,
  type NodeType,
  type RejectAction,
  type ConditionOperator,
  
  // 配置
  type ConditionRule,
  type ConditionBranch,
  type WorkflowNode,
  type WorkflowConfig,
  type WorkflowFormField,
  
  // 实例
  type ApprovalNode,
  type WorkflowInstance,
  type ApprovalRecord,
} from './workflow';

// ==================== 消息 ====================
export {
  // 类型
  type MessageEvent,
  type MessagePriority,
  type MessageStatus,
  type MessageRecipient,
  type MessageEventConfig,
  
  // 消息
  type UserMessage,
  type SendMessageRequest,
  type MessageQueryParams,
  type MessageStatistics,
  
  // 常量
  MESSAGE_EVENT_CONFIGS,
  
  // 辅助函数
  getMessageEventLabel,
  getMessagePriorityLabel,
  getMessagePriorityColor,
  getMessageStatusLabel,
  getMessageStatusColor,
} from './messages';

// ==================== 其他业务类型 ====================
// 以下类型暂时保留在 index.ts 中，后续可继续拆分

import type { UserRole, AdministrativeRole } from './user';
import type { WorkflowStatus, WorkflowType, ConditionOperator } from './workflow';

// 请假申请
export interface LeaveRequest {
  id: string;
  type: '事假' | '病假' | '年假' | '调休' | '其他';
  applicantId: string;
  applicantName: string;
  applicantRole: UserRole;
  startDate: string;
  endDate: string;
  duration: number;
  reason: string;
  status: WorkflowStatus;
  approvalFlow: import('./workflow').ApprovalNode[];
  currentStep: number;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

// 维修申请
export interface RepairRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  item: string;
  location: string;
  description: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  images?: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  assigneeId?: string;
  assigneeName?: string;
  estimatedCost?: number;
  actualCost?: number;
  completedAt?: string;
  createdAt: string;
}

// 采购申请
export interface PurchaseRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  items: PurchaseItem[];
  totalAmount: number;
  reason: string;
  status: WorkflowStatus;
  approvalFlow: import('./workflow').ApprovalNode[];
  currentStep: number;
  createdAt: string;
}

export interface PurchaseItem {
  name: string;
  specification?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  remark?: string;
}

// 通知公告
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: '通知' | '公告' | '新闻' | '活动';
  publisherId: string;
  publisherName: string;
  targetRoles?: UserRole[];
  targetDepartments?: string[];
  isTop: boolean;
  isImportant: boolean;
  attachments?: string[];
  publishAt: string;
  createdAt: string;
}

// 德育评价
export interface MoralAssessment {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  type: '表扬' | '批评';
  category: string;
  content: string;
  score: number;
  recorderId: string;
  recorderName: string;
  occurredAt: string;
  createdAt: string;
}

// 德育活动
export interface MoralActivity {
  id: string;
  title: string;
  type: '主题班会' | '升旗仪式' | '志愿服务' | '社会实践' | '节日活动' | '其他';
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  organizerId: string;
  organizerName: string;
  participantType: 'class' | 'grade' | 'school';
  participantIds: string[];
  participantCount: number;
  status: 'planning' | 'ongoing' | 'completed' | 'cancelled';
  images?: string[];
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

// 预警学生
export interface WarningStudent {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  grade: number;
  type: 'behavior' | 'psychological' | 'academic' | 'attendance';
  typeLabel: '行为预警' | '心理预警' | '学业预警' | '出勤预警';
  level: '轻度' | '中度' | '重度';
  status: 'active' | 'resolved';
  description: string;
  triggers: string[];
  interventions: WarningIntervention[];
  reporterId: string;
  reporterName: string;
  reportedAt: string;
  resolvedAt?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarningIntervention {
  id: string;
  warningId: string;
  type: '谈话' | '家访' | '心理辅导' | '学业帮扶' | '其他';
  content: string;
  participantIds: string[];
  participantNames: string[];
  result: string;
  createdAt: string;
}

// 资产信息
export interface Asset {
  id: string;
  assetNo: string;
  name: string;
  category: string;
  specification?: string;
  quantity: number;
  unit: string;
  value: number;
  purchaseDate: string;
  warrantyExpiry?: string;
  location: string;
  department: string;
  custodianId?: string;
  custodianName?: string;
  status: '在用' | '闲置' | '维修中' | '报废';
  images?: string[];
  createdAt: string;
}

// 菜单配置
export interface MenuItem {
  id: string;
  name: string;
  path: string;
  icon: string;
  badge?: string | number;
  children?: MenuItem[];
  module?: import('./user').ModuleType;
  permission?: import('./user').Permission;
}

// 统计数据
export interface Statistics {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  maleCount: number;
  femaleCount: number;
  attendanceRate: number;
  moralScoreAvg: number;
  activityCount: number;
}

// 工作台卡片
export interface DashboardCard {
  id: string;
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
  module?: import('./user').ModuleType;
}

// 课程安排
export interface CourseSchedule {
  id: string;
  classId: string;
  className: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  dayOfWeek: number;
  period: number;
  startTime: string;
  endTime: string;
  classroom?: string;
}

// 成绩记录
export interface GradeRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  examId: string;
  examName: string;
  subject: string;
  score: number;
  rank?: number;
  classRank?: number;
  gradeRank?: number;
  createdAt: string;
}

// 考试信息
export interface Exam {
  id: string;
  name: string;
  type: '期中考试' | '期末考试' | '单元测试' | '模拟考试' | '其他';
  startDate: string;
  endDate: string;
  subjects: string[];
  grades: number[];
  status: 'planning' | 'ongoing' | 'grading' | 'completed';
  createdAt: string;
}
