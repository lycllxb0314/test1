import { useState, useEffect, useCallback } from 'react';

/**
 * 教务管理数据获取 Hook
 */

// 课程类型
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

// 课表项类型
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

// 考试类型
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

// 成绩类型
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

// 考勤类型
export type AttendanceType = 'attendance' | 'leave' | 'late' | 'early_leave' | 'absent';

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

// 请假申请类型
export type LeaveType = 'sick' | 'personal' | 'official' | 'maternity' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

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

// 调课申请类型
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

/**
 * 获取课程列表
 */
export function useCourses(filters?: {
  teacherId?: string;
  classId?: string;
  semester?: string;
}) {
  const [data, setData] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.teacherId) params.append('teacherId', filters.teacherId);
      if (filters?.classId) params.append('classId', filters.classId);
      if (filters?.semester) params.append('semester', filters.semester);
      
      const response = await fetch(`/api/courses?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || '获取数据失败');
        setData([]);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setError('网络错误');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.teacherId, filters?.classId, filters?.semester]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 获取课表
 */
export function useSchedules(filters?: {
  classId?: string;
  teacherId?: string;
  semester?: string;
}) {
  const [data, setData] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.classId) params.append('classId', filters.classId);
      if (filters?.teacherId) params.append('teacherId', filters.teacherId);
      if (filters?.semester) params.append('semester', filters.semester);
      
      const response = await fetch(`/api/schedules?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || '获取数据失败');
        setData([]);
      }
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
      setError('网络错误');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.classId, filters?.teacherId, filters?.semester]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 获取考试列表
 */
export function useExams(filters?: {
  type?: string;
  semester?: string;
  grade?: number;
}) {
  const [data, setData] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.semester) params.append('semester', filters.semester);
      if (filters?.grade) params.append('grade', filters.grade.toString());
      
      const response = await fetch(`/api/exams?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || '获取数据失败');
        setData([]);
      }
    } catch (err) {
      console.error('Failed to fetch exams:', err);
      setError('网络错误');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.type, filters?.semester, filters?.grade]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 获取学生成绩
 */
export function useGrades(filters?: {
  studentId?: string;
  classId?: string;
  examId?: string;
  subject?: string;
}) {
  const [data, setData] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.studentId) params.append('studentId', filters.studentId);
      if (filters?.classId) params.append('classId', filters.classId);
      if (filters?.examId) params.append('examId', filters.examId);
      if (filters?.subject) params.append('subject', filters.subject);
      
      const response = await fetch(`/api/grades?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || '获取数据失败');
        setData([]);
      }
    } catch (err) {
      console.error('Failed to fetch grades:', err);
      setError('网络错误');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.studentId, filters?.classId, filters?.examId, filters?.subject]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 获取考勤记录
 */
export function useAttendance(filters?: {
  studentId?: string;
  classId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  type?: AttendanceType;
}) {
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.studentId) params.append('studentId', filters.studentId);
      if (filters?.classId) params.append('classId', filters.classId);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.type) params.append('type', filters.type);
      
      const response = await fetch(`/api/attendance?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || '获取数据失败');
        setData([]);
      }
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
      setError('网络错误');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.studentId, filters?.classId, filters?.date, filters?.startDate, filters?.endDate, filters?.type]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 获取请假申请列表
 */
export function useLeaveRequests(filters?: {
  applicantId?: string;
  status?: LeaveStatus;
  type?: LeaveType;
  startDate?: string;
  endDate?: string;
}) {
  const [data, setData] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.applicantId) params.append('applicantId', filters.applicantId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      
      const response = await fetch(`/api/leave-requests?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || '获取数据失败');
        setData([]);
      }
    } catch (err) {
      console.error('Failed to fetch leave requests:', err);
      setError('网络错误');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.applicantId, filters?.status, filters?.type, filters?.startDate, filters?.endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 获取调课申请列表
 */
export function useScheduleChanges(filters?: {
  teacherId?: string;
  classId?: string;
  status?: string;
  semester?: string;
}) {
  const [data, setData] = useState<ScheduleChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.teacherId) params.append('teacherId', filters.teacherId);
      if (filters?.classId) params.append('classId', filters.classId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.semester) params.append('semester', filters.semester);
      
      const response = await fetch(`/api/schedule-changes?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || '获取数据失败');
        setData([]);
      }
    } catch (err) {
      console.error('Failed to fetch schedule changes:', err);
      setError('网络错误');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.teacherId, filters?.classId, filters?.status, filters?.semester]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
