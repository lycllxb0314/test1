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

// ============================================
// 课程数据 (Course)
// ============================================

/**
 * 课程Mock数据
 */
export const MOCK_COURSES = [
  { id: 'course-1', name: '语文', code: 'YW001', subject: '语文', teacherId: 't001', teacherName: '王明华', teacherEmployeeId: 'T001', classId: 'c001', className: '一年级1班', grade: 1, semester: '2024-2025-1', hoursPerWeek: 6, totalHours: 216, status: 'active' },
  { id: 'course-2', name: '数学', code: 'SX001', subject: '数学', teacherId: 't002', teacherName: '李芳', teacherEmployeeId: 'T002', classId: 'c001', className: '一年级1班', grade: 1, semester: '2024-2025-1', hoursPerWeek: 5, totalHours: 180, status: 'active' },
  { id: 'course-3', name: '英语', code: 'YY001', subject: '英语', teacherId: 't003', teacherName: '张强', teacherEmployeeId: 'T003', classId: 'c001', className: '一年级1班', grade: 1, semester: '2024-2025-1', hoursPerWeek: 3, totalHours: 108, status: 'active' },
  { id: 'course-4', name: '科学', code: 'KX001', subject: '科学', teacherId: 't004', teacherName: '刘洋', teacherEmployeeId: 'T004', classId: 'c001', className: '一年级1班', grade: 1, semester: '2024-2025-1', hoursPerWeek: 2, totalHours: 72, status: 'active' },
  { id: 'course-5', name: '音乐', code: 'YY002', subject: '音乐', teacherId: 't005', teacherName: '陈红', teacherEmployeeId: 'T005', classId: 'c001', className: '一年级1班', grade: 1, semester: '2024-2025-1', hoursPerWeek: 1, totalHours: 36, status: 'active' },
  { id: 'course-6', name: '体育', code: 'TY001', subject: '体育', teacherId: 't006', teacherName: '赵刚', teacherEmployeeId: 'T006', classId: 'c001', className: '一年级1班', grade: 1, semester: '2024-2025-1', hoursPerWeek: 3, totalHours: 108, status: 'active' },
  { id: 'course-7', name: '美术', code: 'MS001', subject: '美术', teacherId: 't007', teacherName: '孙丽', teacherEmployeeId: 'T007', classId: 'c002', className: '一年级2班', grade: 1, semester: '2024-2025-1', hoursPerWeek: 1, totalHours: 36, status: 'active' },
  { id: 'course-8', name: '信息技术', code: 'XX001', subject: '信息技术', teacherId: 't008', teacherName: '周伟', teacherEmployeeId: 'T008', classId: 'c002', className: '一年级2班', grade: 1, semester: '2024-2025-1', hoursPerWeek: 1, totalHours: 36, status: 'active' },
];

/**
 * 获取课程列表
 */
export function getMockCourses(filters?: {
  teacherId?: string;
  classId?: string;
  semester?: string;
}): typeof MOCK_COURSES {
  let result = [...MOCK_COURSES];
  
  if (filters?.teacherId) {
    result = result.filter(c => c.teacherId === filters.teacherId);
  }
  
  if (filters?.classId) {
    result = result.filter(c => c.classId === filters.classId);
  }
  
  if (filters?.semester) {
    result = result.filter(c => c.semester === filters.semester);
  }
  
  return result;
}

// ============================================
// 成绩数据 (Grade)
// ============================================

/**
 * 成绩Mock数据
 */
export const MOCK_GRADES = [
  { id: 'g1', studentId: 's001', studentName: '张三', studentNumber: '2024001', studentGrade: 1, className: '一年级1班', examId: 'exam-1', examName: '期中考试', examType: '期中', examDate: '2024-11-11', subject: '语文', score: 92, classRank: 5, gradeRank: 28, createdAt: '2024-11-12' },
  { id: 'g2', studentId: 's001', studentName: '张三', studentNumber: '2024001', studentGrade: 1, className: '一年级1班', examId: 'exam-1', examName: '期中考试', examType: '期中', examDate: '2024-11-11', subject: '数学', score: 88, classRank: 8, gradeRank: 45, createdAt: '2024-11-12' },
  { id: 'g3', studentId: 's001', studentName: '张三', studentNumber: '2024001', studentGrade: 1, className: '一年级1班', examId: 'exam-1', examName: '期中考试', examType: '期中', examDate: '2024-11-11', subject: '英语', score: 95, classRank: 3, gradeRank: 15, createdAt: '2024-11-12' },
  { id: 'g4', studentId: 's002', studentName: '李四', studentNumber: '2024002', studentGrade: 1, className: '一年级1班', examId: 'exam-1', examName: '期中考试', examType: '期中', examDate: '2024-11-11', subject: '语文', score: 95, classRank: 2, gradeRank: 12, createdAt: '2024-11-12' },
  { id: 'g5', studentId: 's002', studentName: '李四', studentNumber: '2024002', studentGrade: 1, className: '一年级1班', examId: 'exam-1', examName: '期中考试', examType: '期中', examDate: '2024-11-11', subject: '数学', score: 98, classRank: 1, gradeRank: 5, createdAt: '2024-11-12' },
];

/**
 * 获取成绩列表
 */
export function getMockGrades(filters?: {
  studentId?: string;
  classId?: string;
  examId?: string;
  subject?: string;
}): typeof MOCK_GRADES {
  let result = [...MOCK_GRADES];
  
  if (filters?.studentId) {
    result = result.filter(g => g.studentId === filters.studentId);
  }
  
  if (filters?.examId) {
    result = result.filter(g => g.examId === filters.examId);
  }
  
  if (filters?.subject) {
    result = result.filter(g => g.subject === filters.subject);
  }
  
  if (filters?.classId) {
    result = result.filter(g => g.className.includes(filters.classId!));
  }
  
  return result;
}

// ============================================
// 课后服务数据
// ============================================

/**
 * 课后服务记录类型
 */
export interface AfterSchoolService {
  id: string;
  semester: string;
  weekNumber: number;
  date: string;
  serviceType: string;
  classId: string;
  className: string;
  grade: number;
  teacherId: string;
  teacherName: string;
  periodIndex: number;
  startTime: string;
  endTime: string;
  hours: number;
  status: string;
  studentCount: number;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export const MOCK_AFTER_SCHOOL_SERVICES: AfterSchoolService[] = [
  {
    id: 'as001',
    semester: '2024-2025-1',
    weekNumber: 12,
    date: '2024-11-18',
    serviceType: '课后托管',
    classId: 'c001',
    className: '一年级1班',
    grade: 1,
    teacherId: 't001',
    teacherName: '张明华',
    periodIndex: 8,
    startTime: '16:30',
    endTime: '17:30',
    hours: 1,
    status: 'completed',
    studentCount: 25,
    createdAt: '2024-11-18T00:00:00Z',
    updatedAt: '2024-11-18T00:00:00Z',
  },
  {
    id: 'as002',
    semester: '2024-2025-1',
    weekNumber: 12,
    date: '2024-11-18',
    serviceType: '兴趣班',
    classId: 'c002',
    className: '一年级2班',
    grade: 1,
    teacherId: 't008',
    teacherName: '吴晓燕',
    periodIndex: 8,
    startTime: '16:30',
    endTime: '17:30',
    hours: 1,
    status: 'completed',
    studentCount: 20,
    remark: '羽毛球兴趣班',
    createdAt: '2024-11-18T00:00:00Z',
    updatedAt: '2024-11-18T00:00:00Z',
  },
  {
    id: 'as003',
    semester: '2024-2025-1',
    weekNumber: 12,
    date: '2024-11-19',
    serviceType: '课后托管',
    classId: 'c003',
    className: '二年级1班',
    grade: 2,
    teacherId: 't003',
    teacherName: '王建国',
    periodIndex: 8,
    startTime: '16:30',
    endTime: '17:30',
    hours: 1,
    status: 'scheduled',
    studentCount: 28,
    createdAt: '2024-11-19T00:00:00Z',
    updatedAt: '2024-11-19T00:00:00Z',
  },
];

/**
 * 获取课后服务列表
 */
export function getMockAfterSchoolServices(filters?: {
  teacherId?: string;
  classId?: string;
  date?: string;
  semester?: string;
  serviceType?: string;
  status?: string;
}): AfterSchoolService[] {
  let result = [...MOCK_AFTER_SCHOOL_SERVICES];
  
  if (filters?.teacherId) {
    result = result.filter(s => s.teacherId === filters.teacherId);
  }
  
  if (filters?.classId) {
    result = result.filter(s => s.classId === filters.classId);
  }
  
  if (filters?.date) {
    result = result.filter(s => s.date === filters.date);
  }
  
  if (filters?.semester) {
    result = result.filter(s => s.semester === filters.semester);
  }
  
  if (filters?.serviceType) {
    result = result.filter(s => s.serviceType === filters.serviceType);
  }
  
  if (filters?.status) {
    result = result.filter(s => s.status === filters.status);
  }
  
  return result;
}

// ============================================
// 作业数据
// ============================================

/**
 * 作业记录类型
 */
export interface HomeworkRecord {
  id: string;
  title: string;
  subject: string;
  classId: string;
  className: string;
  grade: number;
  teacherId: string;
  teacherName: string;
  semester: string;
  assignedDate: string;
  dueDate: string;
  status: string;
  content: string;
  attachments: string[];
  submissionCount: number;
  totalStudents: number;
  createdAt: string;
}

export const MOCK_HOMEWORKS: HomeworkRecord[] = [
  { id: 'hw1', title: '语文第一课练习', subject: '语文', classId: 'c001', className: '一年级1班', grade: 1, teacherId: 't001', teacherName: '张明华', semester: '2024-2025-1', assignedDate: '2024-11-18', dueDate: '2024-11-19', status: 'active', content: '完成课后练习题1-5题', attachments: [], submissionCount: 20, totalStudents: 25, createdAt: '2024-11-18' },
  { id: 'hw2', title: '数学加减法练习', subject: '数学', classId: 'c001', className: '一年级1班', grade: 1, teacherId: 't002', teacherName: '李秀芳', semester: '2024-2025-1', assignedDate: '2024-11-18', dueDate: '2024-11-20', status: 'active', content: '完成练习册第10页', attachments: [], submissionCount: 15, totalStudents: 25, createdAt: '2024-11-18' },
  { id: 'hw3', title: '英语单词抄写', subject: '英语', classId: 'c001', className: '一年级1班', grade: 1, teacherId: 't003', teacherName: '王建国', semester: '2024-2025-1', assignedDate: '2024-11-17', dueDate: '2024-11-18', status: 'completed', content: '抄写Unit1单词各5遍', attachments: [], submissionCount: 25, totalStudents: 25, createdAt: '2024-11-17' },
];

/**
 * 获取作业列表
 */
export function getMockHomeworks(filters?: {
  teacherId?: string;
  classId?: string;
  subject?: string;
  status?: string;
}): HomeworkRecord[] {
  let result = [...MOCK_HOMEWORKS];
  
  if (filters?.teacherId) {
    result = result.filter(h => h.teacherId === filters.teacherId);
  }
  
  if (filters?.classId) {
    result = result.filter(h => h.classId === filters.classId);
  }
  
  if (filters?.subject) {
    result = result.filter(h => h.subject === filters.subject);
  }
  
  if (filters?.status) {
    result = result.filter(h => h.status === filters.status);
  }
  
  return result;
}
