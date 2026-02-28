/**
 * 教务相关Mock数据
 * 
 * 包含：
 * 1. 请假申请数据
 * 2. 调课记录数据
 * 3. 考试数据
 * 4. 教师考勤数据
 */

import type { LeaveRequest, CourseAdjustment, Exam, TeacherAttendance } from '@/types';

// ============================================
// 调课记录数据
// ============================================

/**
 * 调课记录类型
 */
export interface ScheduleChangeRecord {
  id: string;
  leaveRequestId?: string;
  // 申请人（请假教师）信息
  applicantId: string;
  applicantName: string;
  applicantSubject: string;
  applicantGrade: number;
  // 请假信息
  leaveType: string;
  leaveStartDate: string;
  leaveEndDate: string;
  leaveReason: string;
  // 原课程信息
  originalClassId: string;
  originalClassName: string;
  originalSubject: string;
  originalWeekDay: number;
  originalPeriodIndex: number;
  originalPeriodName: string;
  // 调课状态
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  adjustType?: 'substitute' | 'swap' | 'cancel' | 'makeup';
  // 代课教师
  substituteTeacherId?: string;
  substituteTeacherName?: string;
  // 调换信息
  swapWithSlot?: {
    classId: string;
    className: string;
    weekDay: number;
    periodIndex: number;
  };
  // 处理人
  handlerId?: string;
  handlerName?: string;
  handledAt?: string;
  // 备注
  remark?: string;
  // 时间
  createdAt: string;
  updatedAt?: string;
}

/**
 * 调课记录Mock数据
 */
export const MOCK_SCHEDULE_CHANGES: ScheduleChangeRecord[] = [
  {
    id: 'sc-001',
    leaveRequestId: 'lr-001',
    applicantId: 't001',
    applicantName: '张明华',
    applicantSubject: '语文',
    applicantGrade: 3,
    leaveType: '病假',
    leaveStartDate: '2024-11-20',
    leaveEndDate: '2024-11-20',
    leaveReason: '身体不适，需就医',
    originalClassId: 'class-3-1',
    originalClassName: '三年1班',
    originalSubject: '语文',
    originalWeekDay: 1,
    originalPeriodIndex: 3,
    originalPeriodName: '第三节',
    status: 'pending',
    createdAt: '2024-11-18 08:30:00',
  },
  {
    id: 'sc-002',
    leaveRequestId: 'lr-002',
    applicantId: 't002',
    applicantName: '李小红',
    applicantSubject: '数学',
    applicantGrade: 3,
    leaveType: '事假',
    leaveStartDate: '2024-11-21',
    leaveEndDate: '2024-11-21',
    leaveReason: '家中有事需处理',
    originalClassId: 'class-3-2',
    originalClassName: '三年2班',
    originalSubject: '数学',
    originalWeekDay: 2,
    originalPeriodIndex: 1,
    originalPeriodName: '第一节',
    status: 'completed',
    adjustType: 'substitute',
    substituteTeacherId: 't003',
    substituteTeacherName: '王建国',
    handlerId: 'gl-001',
    handlerName: '林国强',
    handledAt: '2024-11-19 10:00:00',
    createdAt: '2024-11-17 14:20:00',
    remark: '已安排王建国老师代课',
  },
  {
    id: 'sc-003',
    leaveRequestId: 'lr-003',
    applicantId: 't003',
    applicantName: '王建国',
    applicantSubject: '英语',
    applicantGrade: 5,
    leaveType: '公假',
    leaveStartDate: '2024-11-22',
    leaveEndDate: '2024-11-22',
    leaveReason: '参加市级教研活动',
    originalClassId: 'class-5-1',
    originalClassName: '五年1班',
    originalSubject: '英语',
    originalWeekDay: 3,
    originalPeriodIndex: 2,
    originalPeriodName: '第二节',
    status: 'processing',
    adjustType: 'swap',
    swapWithSlot: {
      classId: 'class-5-2',
      className: '五年2班',
      weekDay: 4,
      periodIndex: 3,
    },
    handlerId: 'gl-002',
    handlerName: '张年段长',
    createdAt: '2024-11-18 09:15:00',
    updatedAt: '2024-11-18 11:30:00',
  },
];

/**
 * 获取调课记录列表
 */
export function getMockScheduleChanges(filters?: {
  applicantId?: string;
  status?: string;
  grade?: number;
}): ScheduleChangeRecord[] {
  let result = [...MOCK_SCHEDULE_CHANGES];
  
  if (filters?.applicantId) {
    result = result.filter(sc => sc.applicantId === filters.applicantId);
  }
  
  if (filters?.status) {
    result = result.filter(sc => sc.status === filters.status);
  }
  
  if (filters?.grade) {
    result = result.filter(sc => sc.applicantGrade === filters.grade);
  }
  
  return result;
}

// ============================================
// 请假申请数据
// ============================================
export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'lr001',
    type: '病假',
    applicantId: 't001',
    applicantName: '张明华',
    applicantRole: 'teacher',
    startDate: '2024-12-09',
    endDate: '2024-12-10',
    duration: 2,
    reason: '身体不适，需要休息',
    status: 'approved',
    approvalFlow: [
      {
        id: 'an001',
        name: '年段长审批',
        approverRole: 'grade_leader',
        approverId: 'gl001',
        approverName: '李年段长',
        status: 'approved',
        comment: '同意请假',
        approvedAt: '2024-12-08T10:00:00Z',
      },
      {
        id: 'an002',
        name: '教务主任审批',
        approverRole: 'academic_director',
        approverId: 'ad001',
        approverName: '王教务主任',
        status: 'approved',
        comment: '已安排代课',
        approvedAt: '2024-12-08T14:00:00Z',
      },
    ],
    currentStep: 2,
    createdAt: '2024-12-08T08:00:00Z',
    updatedAt: '2024-12-08T14:00:00Z',
  },
  {
    id: 'lr002',
    type: '事假',
    applicantId: 't002',
    applicantName: '李秀芳',
    applicantRole: 'teacher',
    startDate: '2024-12-15',
    endDate: '2024-12-15',
    duration: 1,
    reason: '家中有事需要处理',
    status: 'pending',
    approvalFlow: [
      {
        id: 'an003',
        name: '年段长审批',
        approverRole: 'grade_leader',
        status: 'pending',
      },
    ],
    currentStep: 0,
    createdAt: '2024-12-10T09:00:00Z',
    updatedAt: '2024-12-10T09:00:00Z',
  },
];

// 考试Mock数据
export const MOCK_EXAMS: Exam[] = [
  {
    id: 'exam001',
    name: '2024-2025学年第一学期期中考试',
    type: '期中考试',
    startDate: '2024-11-11',
    endDate: '2024-11-13',
    subjects: ['语文', '数学', '英语'],
    grades: [1, 2, 3, 4, 5, 6],
    status: 'completed',
    createdAt: '2024-10-01T00:00:00Z',
  },
  {
    id: 'exam002',
    name: '2024-2025学年第一学期期末考试',
    type: '期末考试',
    startDate: '2025-01-13',
    endDate: '2025-01-15',
    subjects: ['语文', '数学', '英语', '科学'],
    grades: [1, 2, 3, 4, 5, 6],
    status: 'planning',
    createdAt: '2024-12-01T00:00:00Z',
  },
];

// 教师考勤Mock数据
export const MOCK_TEACHER_ATTENDANCE: TeacherAttendance[] = [
  {
    id: 'ta001',
    teacherId: 't001',
    teacherName: '张明华',
    date: '2024-12-09',
    status: 'leave',
    leaveRequestId: 'lr001',
    leaveType: '病假',
    leaveDuration: 1,
    scheduledCourses: 4,
    actualCourses: 0,
    substitutedCourses: 4,
    createdAt: '2024-12-09T00:00:00Z',
    updatedAt: '2024-12-09T00:00:00Z',
  },
];

/**
 * 获取请假申请列表
 */
export function getMockLeaveRequests(filters?: {
  applicantId?: string;
  status?: string;
  type?: string;
}): LeaveRequest[] {
  let result = [...MOCK_LEAVE_REQUESTS];
  
  if (filters?.applicantId) {
    result = result.filter(lr => lr.applicantId === filters.applicantId);
  }
  
  if (filters?.status && filters.status !== 'all') {
    result = result.filter(lr => lr.status === filters.status);
  }
  
  if (filters?.type && filters.type !== 'all') {
    result = result.filter(lr => lr.type === filters.type);
  }
  
  return result;
}

/**
 * 获取考试列表
 */
export function getMockExams(filters?: {
  grade?: number;
  status?: string;
}): Exam[] {
  let result = [...MOCK_EXAMS];
  
  if (filters?.grade) {
    result = result.filter(e => e.grades.includes(filters.grade!));
  }
  
  if (filters?.status) {
    result = result.filter(e => e.status === filters.status);
  }
  
  return result;
}
