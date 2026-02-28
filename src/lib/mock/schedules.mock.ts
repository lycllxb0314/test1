/**
 * 课表相关Mock数据
 * 
 * 包含：
 * 1. 基准课表（学期固定课表）
 * 2. 实际课表（每周变化的课表）
 * 3. 简化课表视图数据
 */

import type { BaseScheduleSlot, ActualScheduleSlot, ScheduleSlot } from '@/types';

// 作息时间配置
export const PERIOD_TIMES = [
  { index: 1, name: '第一节', startTime: '08:00', endTime: '08:40', type: 'morning' as const },
  { index: 2, name: '第二节', startTime: '08:50', endTime: '09:30', type: 'morning' as const },
  { index: 3, name: '第三节', startTime: '10:00', endTime: '10:40', type: 'morning' as const },
  { index: 4, name: '第四节', startTime: '10:50', endTime: '11:30', type: 'morning' as const },
  { index: 5, name: '第五节', startTime: '14:00', endTime: '14:40', type: 'afternoon' as const },
  { index: 6, name: '第六节', startTime: '14:50', endTime: '15:30', type: 'afternoon' as const },
  { index: 7, name: '第七节', startTime: '15:45', endTime: '16:25', type: 'afternoon' as const },
  { index: 8, name: '第八节', startTime: '16:35', endTime: '17:15', type: 'afternoon' as const },
];

// ============================================
// 简化课表视图数据（用于API返回）
// ============================================

/**
 * 简化课表项（用于列表展示）
 */
export interface ScheduleViewItem {
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
  status: string;
}

/**
 * 六年级1班完整课表Mock数据
 */
export const MOCK_SCHEDULE_VIEW_DATA: ScheduleViewItem[] = [
  // 六年级1班课表 - 周一
  { id: 'sch-1', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't001', teacherName: '王明华', courseId: 'course-1', courseName: '语文', subject: '语文', dayOfWeek: 1, period: 1, startTime: '08:00', endTime: '08:40', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-2', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't002', teacherName: '李芳', courseId: 'course-2', courseName: '数学', subject: '数学', dayOfWeek: 1, period: 2, startTime: '08:50', endTime: '09:30', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-3', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't003', teacherName: '张强', courseId: 'course-3', courseName: '英语', subject: '英语', dayOfWeek: 1, period: 3, startTime: '09:50', endTime: '10:30', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-4', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't001', teacherName: '王明华', courseId: 'course-1', courseName: '语文', subject: '语文', dayOfWeek: 1, period: 4, startTime: '10:40', endTime: '11:20', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  // 六年级1班课表 - 周二
  { id: 'sch-5', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't002', teacherName: '李芳', courseId: 'course-2', courseName: '数学', subject: '数学', dayOfWeek: 2, period: 1, startTime: '08:00', endTime: '08:40', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-6', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't001', teacherName: '王明华', courseId: 'course-1', courseName: '语文', subject: '语文', dayOfWeek: 2, period: 2, startTime: '08:50', endTime: '09:30', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-7', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't004', teacherName: '刘洋', courseId: 'course-4', courseName: '科学', subject: '科学', dayOfWeek: 2, period: 3, startTime: '09:50', endTime: '10:30', roomName: '实验室A', building: 'A栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-8', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't006', teacherName: '赵刚', courseId: 'course-6', courseName: '体育', subject: '体育', dayOfWeek: 2, period: 4, startTime: '10:40', endTime: '11:20', roomName: '操场', building: '室外', semester: '2024-2025-1', status: 'active' },
  // 六年级1班课表 - 周三
  { id: 'sch-9', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't003', teacherName: '张强', courseId: 'course-3', courseName: '英语', subject: '英语', dayOfWeek: 3, period: 1, startTime: '08:00', endTime: '08:40', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-10', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't002', teacherName: '李芳', courseId: 'course-2', courseName: '数学', subject: '数学', dayOfWeek: 3, period: 2, startTime: '08:50', endTime: '09:30', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-11', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't005', teacherName: '陈红', courseId: 'course-5', courseName: '音乐', subject: '音乐', dayOfWeek: 3, period: 3, startTime: '09:50', endTime: '10:30', roomName: '音乐教室', building: 'B栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-12', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't001', teacherName: '王明华', courseId: 'course-1', courseName: '语文', subject: '语文', dayOfWeek: 3, period: 4, startTime: '10:40', endTime: '11:20', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  // 六年级1班课表 - 周四
  { id: 'sch-13', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't001', teacherName: '王明华', courseId: 'course-1', courseName: '语文', subject: '语文', dayOfWeek: 4, period: 1, startTime: '08:00', endTime: '08:40', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-14', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't002', teacherName: '李芳', courseId: 'course-2', courseName: '数学', subject: '数学', dayOfWeek: 4, period: 2, startTime: '08:50', endTime: '09:30', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-15', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't006', teacherName: '赵刚', courseId: 'course-6', courseName: '体育', subject: '体育', dayOfWeek: 4, period: 3, startTime: '09:50', endTime: '10:30', roomName: '操场', building: '室外', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-16', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't003', teacherName: '张强', courseId: 'course-3', courseName: '英语', subject: '英语', dayOfWeek: 4, period: 4, startTime: '10:40', endTime: '11:20', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  // 六年级1班课表 - 周五
  { id: 'sch-17', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't002', teacherName: '李芳', courseId: 'course-2', courseName: '数学', subject: '数学', dayOfWeek: 5, period: 1, startTime: '08:00', endTime: '08:40', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-18', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't004', teacherName: '刘洋', courseId: 'course-4', courseName: '科学', subject: '科学', dayOfWeek: 5, period: 2, startTime: '08:50', endTime: '09:30', roomName: '实验室A', building: 'A栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-19', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't001', teacherName: '王明华', courseId: 'course-1', courseName: '语文', subject: '语文', dayOfWeek: 5, period: 3, startTime: '09:50', endTime: '10:30', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
  { id: 'sch-20', classId: 'c6-1', className: '六年级1班', grade: 6, teacherId: 't003', teacherName: '张强', courseId: 'course-3', courseName: '英语', subject: '英语', dayOfWeek: 5, period: 4, startTime: '10:40', endTime: '11:20', roomName: '教学楼C201', building: 'C栋', semester: '2024-2025-1', status: 'active' },
];

/**
 * 获取简化课表视图数据
 */
export function getMockScheduleViewData(filters?: {
  classId?: string;
  teacherId?: string;
  semester?: string;
}): ScheduleViewItem[] {
  let result = [...MOCK_SCHEDULE_VIEW_DATA];
  
  if (filters?.classId) {
    result = result.filter(s => s.classId === filters.classId);
  }
  
  if (filters?.teacherId) {
    result = result.filter(s => s.teacherId === filters.teacherId);
  }
  
  if (filters?.semester) {
    result = result.filter(s => s.semester === filters.semester);
  }
  
  return result;
}

// ============================================
// 基准课表数据
// ============================================
function generateBaseSchedule(): BaseScheduleSlot[] {
  const slots: BaseScheduleSlot[] = [];
  const subjects = ['语文', '数学', '英语', '科学', '道德与法治', '音乐', '美术', '体育', '劳动'];
  const teachers = [
    { id: 't001', name: '张明华', subjects: ['语文', '道德与法治'] },
    { id: 't002', name: '李秀芳', subjects: ['数学', '科学'] },
    { id: 't007', name: '周志明', subjects: ['英语'] },
    { id: 't008', name: '陈思思', subjects: ['美术'] },
    { id: 't009', name: '王强', subjects: ['体育'] },
    { id: 't010', name: '林小燕', subjects: ['音乐'] },
  ];
  
  // 为一年级1班生成课表
  const classId = 'c001';
  const className = '一年级1班';
  let slotId = 1;
  
  // 周一到周五
  for (let day = 1; day <= 5; day++) {
    for (const period of PERIOD_TIMES) {
      // 简单的排课逻辑
      let subject: string;
      let teacher: { id: string; name: string };
      
      if (period.index === 1 || period.index === 3) {
        subject = '语文';
        teacher = { id: 't001', name: '张明华' };
      } else if (period.index === 2 || period.index === 5) {
        subject = '数学';
        teacher = { id: 't002', name: '李秀芳' };
      } else if (period.index === 4) {
        subject = day % 2 === 1 ? '英语' : '道德与法治';
        teacher = day % 2 === 1 ? { id: 't007', name: '周志明' } : { id: 't001', name: '张明华' };
      } else if (period.index === 6) {
        const skillSubjects = ['音乐', '美术', '体育'];
        const skillTeachers = [
          { id: 't010', name: '林小燕' },
          { id: 't008', name: '陈思思' },
          { id: 't009', name: '王强' },
        ];
        const idx = (day - 1) % 3;
        subject = skillSubjects[idx];
        teacher = skillTeachers[idx];
      } else if (period.index === 7) {
        subject = '科学';
        teacher = { id: 't002', name: '李秀芳' };
      } else {
        subject = '劳动';
        teacher = { id: 't001', name: '张明华' };
      }
      
      slots.push({
        id: `bs${String(slotId).padStart(3, '0')}`,
        semester: '2024-2025-1',
        classId,
        className,
        grade: 1,
        dayOfWeek: day,
        periodIndex: period.index,
        startTime: period.startTime,
        endTime: period.endTime,
        subject,
        teacherId: teacher.id,
        teacherName: teacher.name,
        classroomId: 'room001',
        classroomName: '一年级1班教室',
        status: 'normal',
        createdAt: '2024-09-01T00:00:00Z',
        updatedAt: '2024-09-01T00:00:00Z',
      });
      
      slotId++;
    }
  }
  
  return slots;
}

// 基准课表Mock数据
export const MOCK_BASE_SCHEDULE = generateBaseSchedule();

// 实际课表Mock数据（包含请假/代课状态）
export const MOCK_ACTUAL_SCHEDULE: ActualScheduleSlot[] = MOCK_BASE_SCHEDULE.map((slot, index) => ({
  ...slot,
  id: `as${String(index + 1).padStart(3, '0')}`,
  weekNumber: 15, // 第15周
  date: '2024-12-09', // 具体日期
  isAdjusted: index === 5, // 模拟一节代课
  originalTeacherId: index === 5 ? slot.teacherId : undefined,
  originalTeacherName: index === 5 ? slot.teacherName : undefined,
  substituteReason: index === 5 ? '教师请假' : undefined,
  leaveRequestId: index === 5 ? 'lr001' : undefined,
  substituteId: index === 5 ? 'sub001' : undefined,
}));

/**
 * 获取班级基准课表
 */
export function getMockBaseSchedule(classId?: string, semester?: string): BaseScheduleSlot[] {
  let result = [...MOCK_BASE_SCHEDULE];
  
  if (classId) {
    result = result.filter(s => s.classId === classId);
  }
  
  if (semester) {
    result = result.filter(s => s.semester === semester);
  }
  
  return result;
}

/**
 * 获取教师基准课表
 */
export function getMockTeacherSchedule(teacherId: string): BaseScheduleSlot[] {
  return MOCK_BASE_SCHEDULE.filter(s => s.teacherId === teacherId);
}

/**
 * 获取实际课表
 */
export function getMockActualSchedule(
  classId?: string,
  teacherId?: string,
  weekNumber?: number
): ActualScheduleSlot[] {
  let result = [...MOCK_ACTUAL_SCHEDULE];
  
  if (classId) {
    result = result.filter(s => s.classId === classId);
  }
  
  if (teacherId) {
    result = result.filter(s => s.teacherId === teacherId || s.originalTeacherId === teacherId);
  }
  
  if (weekNumber) {
    result = result.filter(s => s.weekNumber === weekNumber);
  }
  
  return result;
}

/**
 * 将课表转换为矩阵格式（按天和节次）
 */
export function scheduleToMatrix(slots: BaseScheduleSlot[]): BaseScheduleSlot[][] {
  const matrix: BaseScheduleSlot[][] = [];
  
  for (let period = 1; period <= 8; period++) {
    const row: BaseScheduleSlot[] = [];
    for (let day = 1; day <= 5; day++) {
      const slot = slots.find(s => s.dayOfWeek === day && s.periodIndex === period);
      row.push(slot || null as unknown as BaseScheduleSlot);
    }
    matrix.push(row);
  }
  
  return matrix;
}
