/**
 * 教务管理数据获取Hooks
 * 
 * 使用统一的基础Hook库（useApi.ts）实现
 * 
 * @module hooks/useAcademicData
 */

import { useQuery, usePaginatedQuery, useMutation, type QueryParams } from './useApi';
import { apiClient } from '@/services/api-client';

// ============================================
// 类型定义
// ============================================

/** 课程类型 */
export interface Course {
  id: string;
  name: string;
  code: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  teacherEmployeeId: string;
  classId: string;
  className: string;
  grade: number;
  semester: string;
  hoursPerWeek: number;
  totalHours: number;
  description?: string;
  status: string;
}

/** 课表项类型 */
export interface ScheduleItem {
  id: string;
  classId: string;
  className: string;
  grade: number;
  teacherId: string;
  teacherName: string;
  courseId: string;
  courseName: string;
  subject: string;
  dayOfWeek: number;
  period: number;
  startTime: string;
  endTime: string;
  roomId?: string;
  roomName?: string;
  building?: string;
  semester: string;
  weekStart?: number;
  weekEnd?: number;
  isSingleWeek: boolean;
  isDoubleWeek: boolean;
  status: string;
}

/** 考试类型 */
export interface Exam {
  id: string;
  name: string;
  examType: string;
  semester: string;
  examDate: string;
  grades: number[];
  subjects: string[];
  totalScore?: number;
  status: string;
  description?: string;
  createdAt: string;
}

/** 成绩类型 */
export interface Grade {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  studentGrade: number;
  className: string;
  examId: string;
  examName: string;
  examType: string;
  examDate: string;
  subject: string;
  score: number;
  rank?: number;
  classRank?: number;
  gradeRank?: number;
  comments?: string;
  createdAt: string;
}

/** 考勤类型 */
export type AttendanceType = 'attendance' | 'leave' | 'late' | 'early_leave' | 'absent';

/** 考勤记录 */
export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  grade: number;
  className: string;
  date: string;
  type: AttendanceType;
  reason?: string;
  recorderId?: string;
  recorderName?: string;
  createdAt: string;
}

/** 请假类型 */
export type LeaveType = 'sick' | 'personal' | 'official' | 'maternity' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

/** 请假申请 */
export interface LeaveRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantType: string;
  applicantGradeRole?: string;
  applicantDepartmentRole?: string;
  type: LeaveType;
  startTime: string;
  endTime: string;
  duration: number;
  reason: string;
  status: LeaveStatus;
  currentStep: number;
  attachmentUrl?: string;
  replacementId?: string;
  replacementName?: string;
  createdAt: string;
}

/** 调课申请 */
export interface ScheduleChange {
  id: string;
  originalScheduleId: string;
  classId: string;
  className: string;
  originalTeacherId: string;
  originalTeacherName: string;
  courseId: string;
  courseName: string;
  originalDayOfWeek: number;
  originalPeriod: number;
  newTeacherId?: string;
  newTeacherName?: string;
  newRoomId?: string;
  newRoomName?: string;
  newDayOfWeek?: number;
  newPeriod?: number;
  reason: string;
  status: string;
  requesterId: string;
  requesterName: string;
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  createdAt: string;
  semester: string;
}

// ============================================
// 课程Hooks
// ============================================

/**
 * 获取课程列表
 */
export function useCourses(filters?: {
  teacherId?: string;
  classId?: string;
  semester?: string;
}) {
  const params: QueryParams = {};
  if (filters?.teacherId) params.teacherId = filters.teacherId;
  if (filters?.classId) params.classId = filters.classId;
  if (filters?.semester) params.semester = filters.semester;
  
  return useQuery<Course[]>(() => apiClient.get('/courses', params), { deps: [params] });
}

// ============================================
// 课表Hooks
// ============================================

/**
 * 获取课表
 */
export function useSchedules(filters?: {
  classId?: string;
  teacherId?: string;
  semester?: string;
}) {
  const params: QueryParams = {};
  if (filters?.classId) params.classId = filters.classId;
  if (filters?.teacherId) params.teacherId = filters.teacherId;
  if (filters?.semester) params.semester = filters.semester;
  
  return useQuery<ScheduleItem[]>(() => apiClient.get('/schedules', params), { deps: [params] });
}

// ============================================
// 考试Hooks
// ============================================

/**
 * 获取考试列表
 */
export function useExams(filters?: {
  grade?: number;
  semester?: string;
  status?: string;
}) {
  const params: QueryParams = {};
  if (filters?.grade) params.grade = filters.grade;
  if (filters?.semester) params.semester = filters.semester;
  if (filters?.status) params.status = filters.status;
  
  return useQuery<Exam[]>(() => apiClient.get('/exams', params), { deps: [params] });
}

/**
 * 获取成绩列表
 */
export function useGrades(filters?: {
  examId?: string;
  classId?: string;
  studentId?: string;
}) {
  const params: QueryParams = {};
  if (filters?.examId) params.examId = filters.examId;
  if (filters?.classId) params.classId = filters.classId;
  if (filters?.studentId) params.studentId = filters.studentId;
  
  return useQuery<Grade[]>(() => apiClient.get('/grades', params), { deps: [params] });
}

// ============================================
// 考勤Hooks
// ============================================

/**
 * 获取考勤记录
 */
export function useAttendance(filters?: {
  classId?: string;
  date?: string;
  type?: AttendanceType;
}) {
  const params: QueryParams = {};
  if (filters?.classId) params.classId = filters.classId;
  if (filters?.date) params.date = filters.date;
  if (filters?.type) params.type = filters.type;
  
  return useQuery<AttendanceRecord[]>(() => apiClient.get('/attendance', params), { deps: [params] });
}

// ============================================
// 请假/调课Hooks
// ============================================

/**
 * 获取请假申请列表
 */
export function useLeaveRequestsList(filters?: {
  applicantId?: string;
  status?: LeaveStatus;
  type?: LeaveType;
}) {
  const params: QueryParams = {};
  if (filters?.applicantId) params.applicantId = filters.applicantId;
  if (filters?.status) params.status = filters.status;
  if (filters?.type) params.type = filters.type;
  
  return useQuery<LeaveRequest[]>(() => apiClient.get('/leave-requests', params), { deps: [params] });
}

/**
 * 创建请假申请
 */
export function useCreateLeaveRequest() {
  return useMutation<LeaveRequest, Partial<LeaveRequest>>(
    (data) => apiClient.post('/leave-requests', data)
  );
}

/**
 * 获取调课申请列表
 */
export function useScheduleChangesList(filters?: {
  requesterId?: string;
  status?: string;
}) {
  const params: QueryParams = {};
  if (filters?.requesterId) params.requesterId = filters.requesterId;
  if (filters?.status) params.status = filters.status;
  
  return useQuery<ScheduleChange[]>(() => apiClient.get('/schedule-changes', params), { deps: [params] });
}

/**
 * 创建调课申请
 */
export function useCreateScheduleChange() {
  return useMutation<ScheduleChange, Partial<ScheduleChange>>(
    (data) => apiClient.post('/schedule-changes', data)
  );
}
