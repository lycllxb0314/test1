/**
 * 考勤类型定义
 * 
 * @module types/attendance
 */

import type { Weekday } from './course';

// ==================== 考勤状态 ====================

/** 考勤状态 */
export type AttendanceStatus = 
  | 'present'      // 出勤
  | 'absent'       // 缺勤
  | 'late'         // 迟到
  | 'early_leave'  // 早退
  | 'leave'        // 请假
  | 'sick_leave';  // 病假

/** 考勤状态标签 */
export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: '出勤',
  absent: '缺勤',
  late: '迟到',
  early_leave: '早退',
  leave: '请假',
  sick_leave: '病假',
};

// ==================== 学生考勤 ====================

/** 学生考勤记录 */
export interface StudentAttendance {
  id: string;
  studentId: string;
  studentName: string;
  studentNo: string;
  classId: string;
  className: string;
  grade: number;
  date: string;
  status: AttendanceStatus;
  reason?: string;
  leaveId?: string;
  recorderId?: string;
  recorderName?: string;
  createdAt: string;
  updatedAt: string;
}

/** 班级每日考勤统计 */
export interface ClassDailyAttendance {
  classId: string;
  className: string;
  grade: number;
  date: string;
  totalCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  earlyLeaveCount: number;
  leaveCount: number;
  sickLeaveCount: number;
  attendanceRate: number;
  records: StudentAttendance[];
}

/** 学生考勤统计 */
export interface StudentAttendanceStatistics {
  studentId: string;
  studentName: string;
  studentNo: string;
  classId: string;
  className: string;
  semester: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  earlyLeaveDays: number;
  leaveDays: number;
  sickLeaveDays: number;
  attendanceRate: number;
}

// ==================== 教师考勤 ====================

/** 教师考勤记录 */
export interface TeacherAttendance {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'normal' | 'late' | 'early_leave' | 'absent' | 'on_leave';
  note?: string;
  createdAt: string;
  updatedAt: string;
}

/** 教师考勤统计 */
export interface TeacherAttendanceStatistics {
  teacherId: string;
  teacherName: string;
  semester: string;
  totalDays: number;
  normalDays: number;
  lateDays: number;
  earlyLeaveDays: number;
  absentDays: number;
  onLeaveDays: number;
  attendanceRate: number;
}

// ==================== 考勤配置 ====================

/** 考勤时间配置 */
export interface AttendanceTimeConfig {
  checkInStartTime: string;   // 签到开始时间
  checkInEndTime: string;     // 签到结束时间
  checkOutStartTime: string;  // 签退开始时间
  checkOutEndTime: string;    // 签退结束时间
  lateThreshold: string;      // 迟到判定时间
  earlyLeaveThreshold: string; // 早退判定时间
}

/** 考勤筛选条件 */
export interface AttendanceFilters {
  classId?: string;
  grade?: number | 'all';
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus | 'all';
}
