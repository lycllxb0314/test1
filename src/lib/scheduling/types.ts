/**
 * 智能排课数据类型定义
 */

import { Weekday, TimePeriod } from './rules';

// ==================== 基础类型 ====================

/** 时间槽 */
export interface TimeSlot {
  weekday: Weekday;
  period: TimePeriod;
  periodIndex: number; // 第几节
}

/** 时间槽ID */
export type TimeSlotId = string; // 格式: "周一_上午_1"

/** 课程项 */
export interface CourseItem {
  id: string;
  classId: string;
  className: string;
  grade: number;
  subject: string;
  teacherId: string;
  teacherName: string;
  weeklyHours: number;
}

// ==================== 排课输入数据 ====================

/** 教师数据（用于排课） */
export interface TeacherForSchedule {
  id: string;
  name: string;
  primarySubject: string;       // 主教学科
  secondarySubjects: string[];  // 兼教学科
  weeklyHours: number;          // 周课时限额
  currentHours: number;         // 已安排课时
  teachableGrades: number[];    // 可任教年级
  isHeadTeacher: boolean;       // 是否班主任
  headTeacherClassId?: string;  // 班主任班级ID
  additionalRoles: string[];    // 兼任职务
  // 计算字段
  maxHours: number;             // 减免后最大课时
  mainSubjectOnly: boolean;     // 是否只教主科
}

/** 班级数据（用于排课） */
export interface ClassForSchedule {
  id: string;
  name: string;
  grade: number;
  classNumber: number;
  headTeacherId?: string;
  headTeacherName?: string;
  // 课程需求
  subjectNeeds: SubjectNeed[];
}

/** 学科需求 */
export interface SubjectNeed {
  subject: string;
  weeklyHours: number;
  assigned: boolean;
  teacherId?: string;
  teacherName?: string;
}

/** 排课输入 */
export interface ScheduleInput {
  teachers: TeacherForSchedule[];
  classes: ClassForSchedule[];
  semester: string;
}

// ==================== 排课结果 ====================

/** 单节课 */
export interface ScheduleSlot {
  timeSlotId: TimeSlotId;
  timeSlot: TimeSlot;
  classId: string;
  className: string;
  grade: number;
  subject: string;
  teacherId: string;
  teacherName: string;
}

/** 班级课表 */
export interface ClassSchedule {
  classId: string;
  className: string;
  grade: number;
  slots: ScheduleSlot[][];
  // slots[weekdayIndex][periodIndex] 按天分组
}

/** 教师课表 */
export interface TeacherSchedule {
  teacherId: string;
  teacherName: string;
  primarySubject: string;
  slots: ScheduleSlot[][];
  totalHours: number;
}

/** 排课结果 */
export interface ScheduleResult {
  success: boolean;
  message: string;
  
  // 课表数据
  classSchedules: ClassSchedule[];
  teacherSchedules: TeacherSchedule[];
  
  // 统计信息
  statistics: ScheduleStatistics;
  
  // 约束检查结果
  hardConstraintViolations: ConstraintViolation[];
  softConstraintPenalty: number;
  softConstraintDetails: SoftConstraintDetail[];
}

/** 排课统计 */
export interface ScheduleStatistics {
  totalSlots: number;
  assignedSlots: number;
  unassignedSlots: number;
  teacherHoursVariance: number;
  averageTeacherHours: number;
}

/** 约束违反 */
export interface ConstraintViolation {
  type: string;
  message: string;
  count: number;
  details: string[];
}

/** 软约束详情 */
export interface SoftConstraintDetail {
  type: string;
  penalty: number;
  count: number;
}

// ==================== 排课状态 ====================

/** 排课进度 */
export interface ScheduleProgress {
  phase: string;
  current: number;
  total: number;
  message: string;
}

/** 排课状态 */
export interface ScheduleState {
  status: 'idle' | 'preparing' | 'scheduling' | 'optimizing' | 'completed' | 'error';
  progress?: ScheduleProgress;
  result?: ScheduleResult;
  error?: string;
}

// ==================== 算法内部类型 ====================

/** 时间槽状态 */
export interface SlotState {
  timeSlotId: TimeSlotId;
  timeSlot: TimeSlot;
  grade: number;
  classId: string;
  isAvailable: boolean;
  assignedSubject?: string;
  assignedTeacherId?: string;
}

/** 教师可用时段 */
export interface TeacherAvailability {
  teacherId: string;
  availableSlots: Set<TimeSlotId>;
  bannedSlots: Set<TimeSlotId>; // 禁排时段
  assignedSlots: Map<TimeSlotId, string>; // 已分配时段 -> classId
  dailyHours: Map<Weekday, number>; // 每日已排课时
  subjectDailyHours: Map<string, Map<Weekday, number>>; // 各科目每日课时
}

/** 班级排课状态 */
export interface ClassScheduleState {
  classId: string;
  grade: number;
  subjectHours: Map<string, number>; // 各科目剩余课时
  dailySchedule: Map<TimeSlotId, ScheduleSlot | null>;
  firstPeriodSubjects: Weekday[]; // 每天第一节课科目
}

/** 排课任务 */
export interface ScheduleTask {
  classId: string;
  grade: number;
  subject: string;
  remainingHours: number;
  priority: number; // 优先级
  teacherId?: string;
}

/** 模拟退火状态 */
export interface SimulatedAnnealingState {
  currentSolution: Map<TimeSlotId, ScheduleSlot>;
  currentScore: number;
  bestSolution: Map<TimeSlotId, ScheduleSlot>;
  bestScore: number;
  temperature: number;
  iterations: number;
}

// ==================== 辅助函数 ====================

/** 创建时间槽ID */
export function createTimeSlotId(weekday: Weekday, period: TimePeriod, periodIndex: number): TimeSlotId {
  return `${weekday}_${period}_${periodIndex}`;
}

/** 解析时间槽ID */
export function parseTimeSlotId(id: TimeSlotId): TimeSlot {
  const [weekday, period, periodIndex] = id.split('_');
  return {
    weekday: weekday as Weekday,
    period: period as TimePeriod,
    periodIndex: parseInt(periodIndex),
  };
}

/** 比较时间槽顺序 */
export function compareTimeSlots(a: TimeSlotId, b: TimeSlotId): number {
  const weekdayOrder: Record<Weekday, number> = {
    '周一': 0, '周二': 1, '周三': 2, '周四': 3, '周五': 4
  };
  const periodOrder: Record<TimePeriod, number> = {
    '上午': 0, '下午': 1
  };
  
  const slotA = parseTimeSlotId(a);
  const slotB = parseTimeSlotId(b);
  
  const dayDiff = weekdayOrder[slotA.weekday] - weekdayOrder[slotB.weekday];
  if (dayDiff !== 0) return dayDiff;
  
  const periodDiff = periodOrder[slotA.period] - periodOrder[slotB.period];
  if (periodDiff !== 0) return periodDiff;
  
  return slotA.periodIndex - slotB.periodIndex;
}
