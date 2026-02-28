/**
 * 教务相关Mock数据
 */

import type { LeaveRequest, CourseAdjustment, Exam, TeacherAttendance } from '@/types';

// 请假申请Mock数据
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
