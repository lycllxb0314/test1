/**
 * 类型定义统一导出
 * 
 * 采用模块化拆分，按领域组织类型定义
 * 
 * @module types
 */

// 导入需要的类型用于本地接口定义
import type {
  AnnouncementType,
  AnnouncementCategory,
  MediaLevel,
  ApprovalNode,
} from './approval';

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
  StudentType,
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
  ApprovalNodeType,
  ApprovalMode,
  ApproverLeaderRole,
  ApprovalAttachment,
  CreateApprovalRequest,
  SubmitApprovalRequest,
  ApprovalActionRequest,
  ApprovalStatistics,
  ApprovalFilters,
  PendingApprovalQuery,
  AnnouncementType,
  AnnouncementCategory,
  NewsCategory,
  InternalNoticeCategory,
  ParentNoticeCategory,
  MediaLevel,
} from './approval';

export { APPROVAL_TYPE_LABELS, APPROVAL_STATUS_LABELS, DEPARTMENTS } from './approval';

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
  AccessStatistics,
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
  summary?: string;
  content: string;
  type: AnnouncementType;
  category?: AnnouncementCategory;
  mediaLevel?: MediaLevel;
  authorId?: string;
  authorName?: string;
  publisherId: string;
  publisherName: string;
  department?: string;
  coverImage?: string;
  images?: string[];
  targetRoles?: string[];
  targetDepartments?: string[];
  isTop: boolean;
  isImportant: boolean;
  attachments?: string[];
  publishAt: string;
  createdAt: string;
}

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

// ==================== 工作流类型 ====================

/** 工作流配置 */
export interface WorkflowConfig {
  id: string;
  name: string;
  type: string;
  nodes: WorkflowNode[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 工作流节点 */
export interface WorkflowNode {
  id: string;
  name: string;
  type: 'start' | 'approval' | 'condition' | 'parallel' | 'end';
  approverRole?: string;
  approverIds?: string[];
  nextNodeId?: string;
  conditionConfig?: {
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';
    value: unknown;
    trueNodeId?: string;
    falseNodeId?: string;
  };
}

/** 工作流实例 */
export interface WorkflowInstance {
  id: string;
  workflowId: string;
  workflowName: string;
  businessId: string;
  businessType: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
  currentNodeId?: string;
  history: WorkflowHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

/** 工作流历史记录 */
export interface WorkflowHistoryItem {
  id: string;
  nodeId: string;
  nodeName: string;
  operatorId: string;
  operatorName: string;
  action: 'submit' | 'approve' | 'reject' | 'withdraw' | 'transfer';
  comment?: string;
  operatedAt: string;
}

// ==================== 德育习惯类型 ====================

/** 习惯目标 */
export interface HabitGoal {
  id: string;
  code?: string;
  title?: string;
  gradeLevel?: number;
  studentId: string;
  category: string;
  goal: string;
  month: string;
  achieved: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 学生月度目标 */
export interface StudentMonthlyGoal {
  id: string;
  studentId: string;
  month: string;
  goals: {
    id?: string;
    goalId?: string;
    category: string;
    goal: string;
    achieved: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
}

/** 习惯之星 */
export interface HabitStar {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  grade?: number;
  month: string;
  category: string;
  level: 'class' | 'grade' | 'school';
  reason?: string;
  achievementRate?: number;
  createdAt: string;
}

/** 学生习惯档案 */
export interface StudentHabitProfile {
  id: string;
  studentId: string;
  overallScore: number;
  level: '优秀' | '良好' | '合格' | '待提高';
  habitStarCount: number;
  monthlyStars: string[];
  categoryScores: {
    category: string;
    categoryName?: string;
    score: number;
    maxScore: number;
    rate: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  createdAt: string;
  updatedAt: string;
}

/** 习惯记录 */
export interface HabitRecord {
  id: string;
  studentId: string;
  category: string;
  type: 'praise' | 'improve';
  content: string;
  score: number;
  recorderId: string;
  recorderName: string;
  date: string;
  createdAt: string;
}

/** 习惯评价 */
export interface HabitEvaluation {
  id: string;
  studentId: string;
  semester: string;
  category: string;
  averageScore: number;
  level: '优秀' | '良好' | '合格' | '待提高';
  createdAt: string;
}

/** 习惯统计 */
export interface HabitStatistics {
  classId: string;
  className: string;
  totalStudents: number;
  averageScore: number;
  excellentCount: number;
  goodCount: number;
  passCount: number;
  needImproveCount: number;
  habitStarCount: number;
}

/** 习惯趋势 */
export interface HabitTrend {
  month: string;
  averageScore: number;
  praiseCount: number;
  improveCount: number;
}

/** 班级习惯统计 */
export interface ClassHabitStats {
  classId: string;
  className: string;
  totalStudents: number;
  averageScore: number;
  excellentCount: number;
  goodCount: number;
  passCount: number;
  needImproveCount: number;
  habitStarCount: number;
}

/** 学校习惯统计响应 */
export interface SchoolHabitStatsResponse {
  totalStudents: number;
  averageScore: number;
  excellentCount: number;
  goodCount: number;
  passCount: number;
  needImproveCount: number;
  totalHabitStars: number;
  classStats: ClassHabitStats[];
}

/** 习惯目标模板 */
export interface HabitGoalTemplate {
  id: string;
  category: string;
  goal: string;
  gradeRange: number[];
  isActive: boolean;
  createdAt: string;
}

/** 习惯之星规则 */
export interface HabitStarRule {
  id: string;
  category: string;
  level: 'class' | 'grade' | 'school';
  minScore: number;
  description: string;
  isActive: boolean;
  createdAt: string;
}

// ==================== 教研类型 ====================

/** 教研活动 */
export interface ResearchActivity {
  id: string;
  title: string;
  type: '集体备课' | '公开课' | '教研会议' | '课题研究' | '培训学习' | '其他';
  date: string;
  location: string;
  organizerId: string;
  organizerName: string;
  participants: string[];
  participantNames: string[];
  content: string;
  summary?: string;
  attachments?: string[];
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

/** 集体备课 */
export interface CollectivePreparation {
  id: string;
  subject: string;
  grade: number;
  topic: string;
  date: string;
  location: string;
  leaderId: string;
  leaderName: string;
  participants: string[];
  participantNames: string[];
  mainSpeaker?: string;
  mainSpeakerName?: string;
  content: string;
  summary?: string;
  attachments?: string[];
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

/** 听课记录 */
export interface LessonObservation {
  id: string;
  teacherId: string;
  teacherName: string;
  courseId: string;
  courseName: string;
  date: string;
  lesson: number;
  classroom: string;
  observerId: string;
  observerName: string;
  teachingContent: string;
  teachingProcess: string;
  highlight: string;
  suggestion: string;
  rating: number;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

/** 教师教研档案 */
export interface TeacherResearchProfile {
  id: string;
  teacherId: string;
  totalActivities: number;
  totalObservations: number;
  totalPreparations: number;
  recentActivities: ResearchActivity[];
  recentObservations: LessonObservation[];
  createdAt: string;
  updatedAt: string;
}

// ==================== 排课类型 ====================

/** 排课时间段 */
export interface ScheduleSlot {
  id: string;
  dayOfWeek: number;
  lesson: number;
  startTime: string;
  endTime: string;
  type: 'morning' | 'afternoon' | 'evening';
}

/** 调课申请 */
export interface ScheduleChange {
  id: string;
  teacherId: string;
  teacherName: string;
  originalDate: string;
  originalLesson: number;
  newDate: string;
  newLesson: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 德育活动类型 ====================

/** 德育活动 */
export interface MoralActivity {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  organizerId: string;
  organizerName: string;
  participants: string[];
  content: string;
  summary?: string;
  attachments?: string[];
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

/** 德育评价 */
export interface MoralEvaluation {
  id: string;
  studentId: string;
  studentName: string;
  semester: string;
  moralScore: number;
  behaviorScore: number;
  activityScore: number;
  totalScore: number;
  level: '优秀' | '良好' | '合格' | '待提高';
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

/** 预警学生 */
export interface WarningStudent {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  type: '学习预警' | '行为预警' | '心理预警' | '出勤预警';
  level: '轻度' | '中度' | '重度';
  reason: string;
  handlerId?: string;
  handlerName?: string;
  measures?: string;
  status: 'active' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

/** 德育统计 */
export interface MoralStatistics {
  totalActivities: number;
  totalParticipants: number;
  warningCount: number;
  resolvedCount: number;
  excellentCount: number;
  goodCount: number;
}

/** 学年 */
export type AcademicYear = string;

/** 年度综合数据 */
export interface YearlyComprehensiveData {
  year: string;
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  averageScore: number;
  excellentRate: number;
  passRate: number;
  moralScore: number;
  habitScore: number;
  attendanceRate: number;
  honors?: {
    total: number;
    summary?: string;
    byLevel: { [key: string]: number } | { level: string; count: number }[];
    byCategory?: { [key: string]: number } | { type: string; count: number }[];
    byType?: { type: string; count: number }[];
  };
  moral?: {
    praiseCount: number;
    improveCount: number;
    behaviorScore: number;
    avgBehaviorScore?: number;
    activityCount: number;
    totalActivityCount?: number;
    volunteerHours: number;
    totalVolunteerHours?: number;
    totalStarCount?: number;
  };
  academic?: {
    averageScore: number;
    avgScore?: number;
    rank?: number;
    excellentRate: number;
    passRate: number;
    improvement?: number;
    subjectScores: { subject: string; averageScore: number; passRate: number }[];
  };
}
