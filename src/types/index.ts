/**
 * 类型定义统一导出
 * 
 * 采用模块化拆分，按领域组织类型定义
 * 
 * @module types
 */

// ==================== 用户与角色 ====================
export type {
  UserRole,
  AdministrativeRole,
  ModuleType,
  Permission,
  RoleConfig,
  AdministrativeRoleConfig,
  UserGroupMembership,
  User,
  GroupType,
  GroupConfig,
  GroupInfo,
  GroupMember,
} from './user';

export {
  USER_ROLE_LABELS,
  ADMINISTRATIVE_ROLE_LABELS,
  GROUP_CONFIGS,
} from './user';

// ==================== 教师管理 ====================
export type {
  Teacher,
  TeacherProfile,
  TeacherRecord,
  TeacherHonor,
  TeacherTraining,
  TeacherAchievement,
  ClassTeacherPosition,
  ClassTeacherStatus,
  ClassTeacher,
  CreateClassTeacherRequest,
  UpdateClassTeacherRequest,
  TeacherWorkload,
  TeacherMonthlyWorkloadSummary,
  WorkloadQueryParams,
} from './teacher';

// ==================== 学生管理 ====================
export type {
  StudentStatus,
  Student,
  StudentFullProfile,
  Parent,
  StudentAcademicRecord,
  StudentHonor,
  StudentGrowthRecord,
  StudentMoralRecord,
  StudentFilters,
  HabitCategory,
  HabitAssessment,
} from './student';

export { 
  habitCategoryNames, 
  habitCategoryIcons, 
  habitCategoryColors 
} from './student';

// ==================== 班级管理 ====================
export type {
  ClassStatus,
  Class,
  ClassInfo,
  ClassContainer,
  TeacherBasicInfo,
  StudentBasicInfo,
  ParentBasicInfo,
  ClassFilters,
  ClassStatistics,
  TeacherCandidate,
} from './class';

// ==================== 课程与课表 ====================
export type {
  CourseType,
  Course,
  TimeSlot,
  Weekday,
  WeekDay,
  ScheduleItem,
  ClassSchedule,
  BaseScheduleSlot,
  ActualScheduleSlot,
  CourseAdjustmentStatus,
  CourseAdjustment,
  CreateCourseAdjustmentRequest,
  TeachingPlan,
  TeachingUnitPlan,
} from './course';

export { WEEKDAY_NAMES } from './course';

// ==================== 考勤管理 ====================
export type {
  AttendanceStatus,
  StudentAttendance,
  ClassDailyAttendance,
  StudentAttendanceStatistics,
  TeacherAttendance,
  TeacherAttendanceStatistics,
  AttendanceTimeConfig,
  AttendanceFilters,
} from './attendance';

export { ATTENDANCE_STATUS_LABELS } from './attendance';

// ==================== 成绩管理 ====================
export type {
  GradeLevel,
  StudentGrade,
  CreateGradeRequest,
  ClassGradeStatistics,
  ScoreDistribution,
  StudentSemesterGrades,
  StudentCourseGrade,
  ExamType,
  Exam,
  ExamCourse,
  GradeFilters,
} from './grade';

export { GRADE_LEVEL_LABELS } from './grade';

// ==================== 请假管理 ====================
export type {
  LeaveType,
  LeaveStatus,
  LeaveApplicantType,
  LeaveApplication,
  CreateLeaveRequest,
  LeaveApprovalStep,
  LeaveApprovalAction,
  LeaveStatistics,
  DepartmentLeaveStatistics,
  LeaveFilters,
} from './leave';

export { LEAVE_TYPE_LABELS } from './leave';

// ==================== 审批管理 ====================
export type {
  ApprovalType,
  ApprovalStatus,
  ApprovalStepStatus,
  ApprovalStep,
  ApprovalStepType,
  ApprovalFlowConfig,
  ApprovalFlowStepConfig,
  Approval,
  ApprovalInstance,
  ApprovalNode,
  ApprovalNodeRecord,
  ApprovalAttachment,
  CreateApprovalRequest,
  SubmitApprovalRequest,
  ApprovalActionRequest,
  ApprovalStatistics,
  ApprovalFilters,
} from './approval';

export { APPROVAL_TYPE_LABELS, APPROVAL_STATUS_LABELS } from './approval';

// ==================== 消息管理 ====================
export type {
  MessageType,
  MessageReadStatus,
  MessagePriority,
  Message,
  MessageDetail,
  MessageAttachment,
  MessageTemplate,
  CreateMessageRequest,
  MessageStatistics,
  Conversation,
  ConversationParticipant,
  ConversationMessage,
  MessageFilters,
} from './message';

export { MESSAGE_TYPE_LABELS } from './message';

// ==================== 总务管理 ====================
export type {
  AssetType,
  AssetStatus,
  Asset,
  RoomType,
  RoomStatus,
  Room,
  BookingStatus,
  BookingPurpose,
  RoomBooking,
  BookingApprovalNode,
  RepairStatus,
  RepairRequest,
  PurchaseStatus,
  PurchaseRequest,
  PurchaseItem,
  VenueType,
  Venue,
  VenueReservation,
  SafetyCheckType,
  SafetyCheck,
  SafetyIssue,
  AssetFilters,
  RepairFilters,
  PurchaseFilters,
  VenueFilters,
} from './general';

// ==================== 门禁管理 ====================
export type {
  AccessDeviceType,
  AccessDeviceStatus,
  AccessDevice,
  AccessRule,
  PersonType,
  AccessPerson,
  AccessCredential,
  AccessPermission,
  AccessRecord,
  Visitor,
  VisitorStatistics,
} from './access';

// ==================== 财务管理 ====================
export type {
  ExpenseCategory,
  ExpenseStatus,
  ExpenseItem,
  ExpenseReimbursement,
  ExpenseCategoryConfig,
  ExpenseStatistics,
  ExpenseFilters,
} from './finance';

// ==================== 公告管理 ====================
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: '通知' | '公告' | '新闻' | '活动';
  publisherId: string;
  publisherName: string;
  targetRoles?: string[];
  targetDepartments?: string[];
  isTop: boolean;
  isImportant: boolean;
  attachments?: string[];
  publishAt: string;
  createdAt: string;
}

/** 公告类型 */
export type AnnouncementType = '通知' | '公告' | '新闻' | '活动';

/** 新闻类别 */
export type NewsCategory = '学校新闻' | '教务新闻' | '德育新闻' | '总务新闻' | '其他';

/** 媒体级别 */
export type MediaLevel = '校级' | '区级' | '市级' | '省级' | '国家级';

// ==================== 请假申请（兼容旧类型） ====================
export interface LeaveRequest {
  id: string;
  type: '事假' | '病假' | '年假' | '调休' | '其他';
  applicantId: string;
  applicantName: string;
  applicantRole: string;
  startDate: string;
  endDate: string;
  duration: number;
  reason: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvalFlow: ApprovalNode[];
  currentStep: number;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

// ==================== 审批记录（兼容旧类型） ====================
export interface ApprovalRecord {
  id: string;
  workflowId: string;
  workflowType: string;
  nodeId: string;
  nodeName: string;
  approverId: string;
  approverName: string;
  approverRole: string;
  action: 'approve' | 'reject' | 'withdraw' | 'transfer' | 'return';
  comment?: string;
  returnToNodeId?: string;
  createdAt: string;
}

// ==================== 通用类型 ====================

/** API 响应格式 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** 分页参数 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

/** 排序参数 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** 日期范围 */
export interface DateRange {
  startDate: string;
  endDate: string;
}

/** 学期格式 */
export type Semester = `${number}-${number}${'-1' | '-2'}`;

/** 当前学期 */
export const CURRENT_SEMESTER: Semester = '2024-2025-2';

/** 学期列表 */
export const SEMESTERS: Semester[] = [
  '2024-2025-2',
  '2024-2025-1',
  '2023-2024-2',
  '2023-2024-1',
];

/** 年级列表 */
export const GRADES = [1, 2, 3, 4, 5, 6] as const;
export type Grade = typeof GRADES[number];

/** 年级名称映射 */
export const GRADE_NAMES: Record<Grade, string> = {
  1: '一年级',
  2: '二年级',
  3: '三年级',
  4: '四年级',
  5: '五年级',
  6: '六年级',
};
