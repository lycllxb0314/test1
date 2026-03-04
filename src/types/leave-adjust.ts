/**
 * 请假调课类型定义
 * 
 * 核心业务流程：
 * 1. 教师提交请假申请（关联需要调课的课程）
 * 2. 选择审批人（校长室领导，支持会签/并签）
 * 3. 审批通过后通知年段长安排调课
 * 4. 年段长安排代课教师或调换时间
 * 5. 调课完成后更新到 course_adjustments 表
 * 6. 查询"本周课表"时合并基准课表和调课信息
 */

// ==================== 请假类型 ====================

/** 请假类型 */
export type LeaveType = '病假' | '事假' | '公假' | '婚假' | '产假' | '丧假';

/** 请假状态 */
export type LeaveStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';

/** 时长单位 */
export type DurationUnit = 'day' | 'lesson';

/** 附件 */
export interface Attachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

/** 受影响的课程时段 */
export interface AffectedSlot {
  slotId: string;           // 基准课表中的 slot_id
  weekDay: number;          // 星期几（1-5）
  periodIndex: number;      // 第几节（0-5）
  classId: string;
  className: string;
  subject: string;
  grade?: number;           // 年级（1-6）
  // 周次信息（请假期间的哪一周）
  weekStartDate?: string;   // 周一日期
}

/** 签批类型 */
export type SignType = 'countersign' | 'parallel';  // 会签/并签

/** 审批人选择 */
export interface ApproverSelection {
  role: string;             // 角色：principal/vice_principal 等
  employeeId: string;       // 审批人工号
  userName: string;         // 审批人姓名
  signType: SignType;       // 签批类型
  order?: number;           // 顺序（会签时使用）
}

/** 请假申请 */
export interface LeaveRequest {
  id: string;
  
  // 申请人信息
  applicantId: string;      // 工号
  applicantName: string;
  applicantType: 'teacher' | 'staff';
  applicantGrade?: number;
  
  // 请假信息
  type: LeaveType;
  startDate: string;        // ISO 日期
  endDate: string;
  startTime?: string;       // HH:mm
  endTime?: string;
  duration: number;         // 时长
  durationUnit: DurationUnit;
  reason: string;
  
  // 附件
  attachments: Attachment[];
  
  // 调课相关
  needAdjustment: boolean;
  affectedSlots: AffectedSlot[];
  
  // 审批相关
  workflowInstanceId?: number;
  status: LeaveStatus;
  currentStep: number;
  
  // 审批人选择
  approverSelection: ApproverSelection[];
  
  // 处理结果
  approvedBy?: string;      // 审批人工号
  approvedAt?: string;
  rejectReason?: string;
  
  // 调课处理结果
  adjustmentStatus?: 'pending' | 'processing' | 'completed' | 'cancelled';
  adjustedBy?: string;      // 年段长工号
  adjustedAt?: string;
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

// ==================== 调课类型 ====================

/** 调课类型 */
export type AdjustType = 'substitute' | 'swap' | 'cancel' | 'makeup';

/** 调课状态 */
export type AdjustStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

/** 调课记录 */
export interface CourseAdjustment {
  id: string;
  
  // 关联信息
  leaveRequestId?: string;
  workflowInstanceId?: string;
  
  // 请假教师信息（使用工号）
  applicantId: string;      // 工号
  applicantName: string;
  
  // 调课处理人（年段长，使用工号）
  adjusterId?: string;      // 工号
  adjusterName?: string;
  
  // 调课类型和状态
  adjustType: AdjustType;
  status: AdjustStatus;
  
  // 生效时间和位置
  effectiveWeek: string;    // 生效周周一日期
  effectiveWeekNumber?: number;
  effectiveYear?: string;
  
  // 课程位置
  classId: string;
  className: string;
  grade: number;
  weekDay: number;          // 1-5
  periodIndex: number;      // 0-5
  subject: string;
  
  // 原始课程信息
  originalSlot: {
    teacherId: string;
    teacherName: string;
    employeeId: string;
  };
  
  // 代课教师（使用工号）
  substituteEmployeeId?: string;
  substituteName?: string;
  
  // 调课结果
  adjustResult?: {
    type: AdjustType;
    substituteEmployeeId?: string;
    substituteName?: string;
    swapWithSlot?: {
      classId: string;
      weekDay: number;
      periodIndex: number;
    };
  };
  
  // 原因
  reason?: string;
  reasonType?: string;
  
  // 审批信息
  approvedBy?: string;      // 工号
  approvedByName?: string;
  approvedAt?: string;
  
  // 同步状态
  syncStatus?: {
    scheduleUpdated: boolean;
    workloadUpdated: boolean;
    notificationSent: boolean;
  };
  
  // 通知状态
  notifyStatus?: {
    applicantNotified: boolean;
    substituteNotified: boolean;
    classTeacherNotified: boolean;
  };
  
  // 时间戳
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
}

// ==================== 本周课表 ====================

/** 本周课表格子 */
export interface WeeklyScheduleSlot {
  // 基础信息
  slotId: string;
  classId: string;
  className: string;
  grade: number;
  weekDay: number;
  periodIndex: number;
  periodName?: string;
  subject: string;
  
  // 基准课表教师
  teacherId: string;
  teacherName: string;
  employeeId: string;
  
  // 调课信息
  isAdjusted: boolean;
  adjustmentType?: AdjustType;
  adjustmentId?: string;
  adjustmentReason?: string;
  
  // 实际任课教师（可能是代课教师）
  actualEmployeeId: string;
  actualTeacherName: string;
  
  // 调课详情
  leaveRequestId?: string;
  leaveType?: LeaveType;
  applicantId?: string;
  applicantName?: string;
}

/** 本周课表 */
export interface WeeklySchedule {
  weekStartDate: string;    // 周一日期
  weekEndDate: string;      // 周五日期
  weekNumber: number;       // 第几周
  scheduleMatrix: (WeeklyScheduleSlot | null)[][];
  adjustments: CourseAdjustment[];
}

// ==================== 工作量统计 ====================

/** 教师工作量统计 */
export interface TeacherWorkload {
  id: string;
  employeeId: string;
  teacherName: string;
  primarySubject?: string;
  
  // 统计周期
  academicYear: string;
  semester: string;
  weekNumber: number;
  weekStartDate: string;
  weekEndDate: string;
  
  // 工作量统计
  totalLessons: number;       // 总课时数（基准课表）
  actualLessons: number;      // 实际上课时数
  substituteLessons: number;  // 代课时数
  adjustedLessons: number;    // 被调课时数
  leaveDays: number;          // 请假天数
  
  // 详细数据
  dailyBreakdown?: {
    date: string;
    lessons: number;
    adjustments: number;
  }[];
  subjectBreakdown?: {
    subject: string;
    lessons: number;
  }[];
  
  createdAt: string;
  updatedAt: string;
}

// ==================== API 请求类型 ====================

/** 提交请假申请请求 */
export interface SubmitLeaveRequest {
  type: LeaveType;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  duration: number;
  durationUnit: DurationUnit;
  reason: string;
  attachments?: Attachment[];
  needAdjustment: boolean;
  affectedSlots?: AffectedSlot[];
  approverSelection: ApproverSelection[];
}

/** 年段长处理调课请求 */
export interface ProcessAdjustmentRequest {
  adjustmentId: string;
  action: 'substitute' | 'swap' | 'cancel';
  substituteEmployeeId?: string;
  substituteName?: string;
  swapWithSlot?: {
    classId: string;
    weekDay: number;
    periodIndex: number;
  };
  remark?: string;
}

/** 查询本周课表参数 */
export interface WeeklyScheduleParams {
  weekStartDate?: string;   // 周一日期，默认本周
  classId?: string;
  employeeId?: string;      // 教师工号
}
