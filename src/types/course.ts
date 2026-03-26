/**
 * 课程与课表类型定义
 * 
 * @module types/course
 */

// ==================== 课程基本信息 ====================

/** 课程类型 */
export type CourseType = 
  | 'chinese'      // 语文
  | 'math'         // 数学
  | 'english'      // 英语
  | 'music'        // 音乐
  | 'art'          // 美术
  | 'pe'           // 体育
  | 'science'      // 科学
  | 'morality'     // 道德与法治
  | 'it'           // 信息技术
  | 'activity';    // 活动课

/** 课程信息 */
export interface Course {
  id: string;
  name: string;
  type: CourseType;
  code: string;
  description?: string;
  weeklyHours: number;
  isMain: boolean;
  color?: string;
}

// ==================== 课表 ====================

/** 课时时段 */
export interface TimeSlot {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  type: 'morning' | 'afternoon' | 'evening';
}

/** 星期 */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** 星期名称 */
export const WEEKDAY_NAMES: Record<Weekday, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
};

/** 课表项 */
export interface ScheduleItem {
  id: string;
  classId: string;
  className: string;
  grade: number;
  weekday: Weekday;
  timeSlot: number;
  courseId: string;
  courseName: string;
  courseType: CourseType;
  teacherId: string;
  teacherName: string;
  classroom?: string;
  note?: string;
  semester: string;
  status: 'normal' | 'adjusted' | 'substituted';
  createdAt: string;
  updatedAt: string;
}

/** 班级课表 */
export interface ClassSchedule {
  classId: string;
  className: string;
  grade: number;
  semester: string;
  items: ScheduleItem[];
  timeSlots: TimeSlot[];
}

/** 星期类型（兼容旧代码） */
export type WeekDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// ==================== 基准课表与实际课表 ====================

/** 基准课表课次 */
export interface BaseScheduleSlot {
  id: string;
  semester: string;
  classId: string;
  className: string;
  grade: number;
  
  // 时间信息
  weekNumber?: number;                  // 周次（基准课表通常不区分，实际课表必填）
  dayOfWeek: number;                    // 星期几 (1-7)
  periodIndex: number;                  // 第几节课
  startTime: string;
  endTime: string;
  
  // 课程信息
  subject: string;
  courseType?: 'normal' | 'activity' | 'self_study';
  
  // 教师信息
  teacherId: string;
  teacherName: string;
  
  // 场地信息
  classroomId?: string;
  classroomName?: string;
  
  // 状态
  status: 'normal' | 'leave' | 'substitute' | 'cancelled';
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
}

/** 实际课表课次 */
export interface ActualScheduleSlot extends BaseScheduleSlot {
  weekNumber: number;                   // 第几周
  date: string;                         // 具体日期
  
  // 变化信息
  isAdjusted: boolean;                  // 是否有调整
  originalTeacherId?: string;           // 原教师ID（代课时）
  originalTeacherName?: string;
  substituteReason?: string;            // 代课原因
  
  // 关联信息
  leaveRequestId?: string;              // 关联的请假申请
  substituteId?: string;                // 关联的代课记录
  adjustRecordId?: string;              // 关联的调课记录
}

// ==================== 调课 ====================

/** 调课状态 */
export type CourseAdjustmentStatus = 
  | 'pending'      // 待审批
  | 'approved'     // 已批准
  | 'rejected'     // 已拒绝
  | 'cancelled';   // 已取消

/** 调课申请 */
export interface CourseAdjustment {
  id: string;
  type: 'swap' | 'move' | 'cancel' | 'substitute';
  reason: string;
  applicantId: string;
  applicantName: string;
  
  // 原课信息
  originalClassId: string;
  originalClassName: string;
  originalWeekday: Weekday;
  originalTimeSlot: number;
  originalCourseId: string;
  originalCourseName: string;
  originalTeacherId: string;
  originalTeacherName: string;
  
  // 目标课信息（调课/换课）
  targetClassId?: string;
  targetClassName?: string;
  targetWeekday?: Weekday;
  targetTimeSlot?: number;
  targetCourseId?: string;
  targetCourseName?: string;
  targetTeacherId?: string;
  targetTeacherName?: string;
  
  // 代课教师（代课）
  substituteTeacherId?: string;
  substituteTeacherName?: string;
  
  // 审批信息
  status: CourseAdjustmentStatus;
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  rejectReason?: string;
  
  // 时间戳
  semester: string;
  effectiveDate?: string;
  createdAt: string;
  updatedAt: string;
}

/** 创建调课申请请求 */
export interface CreateCourseAdjustmentRequest {
  type: 'swap' | 'move' | 'cancel' | 'substitute';
  originalClassId: string;
  originalWeekday: Weekday;
  originalTimeSlot: number;
  reason: string;
  targetClassId?: string;
  targetWeekday?: Weekday;
  targetTimeSlot?: number;
  substituteTeacherId?: string;
  effectiveDate?: string;
}

// ==================== 教学计划 ====================

/** 教学计划 */
export interface TeachingPlan {
  id: string;
  teacherId: string;
  teacherName: string;
  courseId: string;
  courseName: string;
  classId: string;
  className: string;
  semester: string;
  totalHours: number;
  completedHours: number;
  progress: number;
  unitPlans: TeachingUnitPlan[];
  createdAt: string;
  updatedAt: string;
}

/** 单元教学计划 */
export interface TeachingUnitPlan {
  id: string;
  order: number;
  title: string;
  objectives: string[];
  keyPoints: string[];
  teachingMethods: string[];
  plannedHours: number;
  completedHours: number;
  startDate?: string;
  endDate?: string;
  status: '未开始' | '进行中' | '已完成';
}
