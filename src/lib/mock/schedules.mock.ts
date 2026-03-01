/**
 * 课表相关Mock数据
 * 
 * 数据来源：从 master-data.ts 导入统一主数据
 * 
 * 包含：
 * 1. 基准课表（学期固定课表）
 * 2. 实际课表（每周变化的课表）
 * 3. 简化课表视图数据
 */

import type { BaseScheduleSlot, ActualScheduleSlot, ScheduleSlot, WeekDay } from '@/types';
import { 
  MASTER_CLASSES, 
  MASTER_TEACHERS, 
  getMasterClassById, 
  getMasterTeacherById,
  MASTER_SCHOOL,
} from './master-data';

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
 * 生成课表数据的辅助函数
 */
function generateScheduleForClass(classId: string): ScheduleViewItem[] {
  const cls = getMasterClassById(classId);
  if (!cls) return [];
  
  const teacher = getMasterTeacherById(cls.headTeacherId);
  const subject = teacher?.subjects[0] || '语文';
  
  const slots: ScheduleViewItem[] = [];
  let slotId = 1;
  
  // 简化的排课逻辑
  const schedule = [
    // 周一
    [{ subject: '语文', teacherId: cls.headTeacherId }, { subject: '数学', teacherId: 't002' }, { subject: '语文', teacherId: cls.headTeacherId }, { subject: '数学', teacherId: 't002' }],
    // 周二
    [{ subject: '数学', teacherId: 't002' }, { subject: '语文', teacherId: cls.headTeacherId }, { subject: '语文', teacherId: cls.headTeacherId }, { subject: '语文', teacherId: cls.headTeacherId }],
    // 周三
    [{ subject: '语文', teacherId: cls.headTeacherId }, { subject: '数学', teacherId: 't002' }, { subject: '语文', teacherId: cls.headTeacherId }, { subject: '数学', teacherId: 't002' }],
    // 周四
    [{ subject: '数学', teacherId: 't002' }, { subject: '语文', teacherId: cls.headTeacherId }, { subject: '语文', teacherId: cls.headTeacherId }, { subject: '语文', teacherId: cls.headTeacherId }],
    // 周五
    [{ subject: '语文', teacherId: cls.headTeacherId }, { subject: '数学', teacherId: 't002' }, { subject: '数学', teacherId: 't002' }, { subject: '语文', teacherId: cls.headTeacherId }],
  ];
  
  for (let day = 1; day <= 5; day++) {
    const daySchedule = schedule[day - 1];
    for (let period = 1; period <= 4; period++) {
      const slot = daySchedule[period - 1];
      const slotTeacher = getMasterTeacherById(slot.teacherId);
      
      slots.push({
        id: `sch-${classId}-${day}-${period}`,
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        teacherId: slot.teacherId,
        teacherName: slotTeacher?.name || cls.headTeacherName,
        courseId: `course-${slot.subject}`,
        courseName: slot.subject,
        subject: slot.subject,
        dayOfWeek: day,
        period: period,
        startTime: PERIOD_TIMES[period - 1].startTime,
        endTime: PERIOD_TIMES[period - 1].endTime,
        roomId: cls.classroomId,
        roomName: cls.classroomName,
        building: cls.building,
        semester: MASTER_SCHOOL.currentSemester,
        status: 'active',
      });
      
      slotId++;
    }
  }
  
  return slots;
}

/**
 * 六年级1班（c013）完整课表Mock数据
 */
export const MOCK_SCHEDULE_VIEW_DATA: ScheduleViewItem[] = generateScheduleForClass('c013');

/**
 * 获取简化课表视图数据
 */
export function getMockScheduleViewData(filters?: {
  classId?: string;
  teacherId?: string;
  semester?: string;
}): ScheduleViewItem[] {
  // 如果指定了班级，生成该班级的课表
  if (filters?.classId) {
    return generateScheduleForClass(filters.classId);
  }
  
  // 如果指定了教师，返回该教师的所有课程
  if (filters?.teacherId) {
    const result: ScheduleViewItem[] = [];
    MASTER_CLASSES.forEach(cls => {
      const classSchedule = generateScheduleForClass(cls.id);
      result.push(...classSchedule.filter(s => s.teacherId === filters.teacherId));
    });
    return result;
  }
  
  // 默认返回六年级1班的课表
  return MOCK_SCHEDULE_VIEW_DATA;
}

// ============================================
// 基准课表数据
// ============================================
function generateBaseSchedule(): BaseScheduleSlot[] {
  const slots: BaseScheduleSlot[] = [];
  let slotId = 1;
  
  // 为一年级1班生成课表
  const cls = getMasterClassById('c001');
  if (!cls) return [];
  
  const teacher = getMasterTeacherById(cls.headTeacherId);
  const subject = teacher?.subjects[0] || '语文';
  
  // 周一到周五
  for (let day = 1; day <= 5; day++) {
    for (const period of PERIOD_TIMES) {
      // 简单的排课逻辑：班主任教语文，数学老师教数学
      let currentSubject: string;
      let currentTeacherId: string;
      let currentTeacherName: string;
      
      if (period.index === 1 || period.index === 3) {
        currentSubject = '语文';
        currentTeacherId = cls.headTeacherId;
        currentTeacherName = cls.headTeacherName;
      } else if (period.index === 2 || period.index === 5) {
        currentSubject = '数学';
        // 找到数学老师
        const mathTeacher = MASTER_TEACHERS.find(t => 
          t.subjects.includes('数学') && 
          t.headTeacherClassIds.includes(cls.id)
        ) || MASTER_TEACHERS.find(t => t.subjects.includes('数学'));
        currentTeacherId = mathTeacher?.id || 't002';
        currentTeacherName = mathTeacher?.name || '李秀芳';
      } else if (period.index === 4) {
        currentSubject = day % 2 === 1 ? '语文' : '数学';
        currentTeacherId = day % 2 === 1 ? cls.headTeacherId : 't002';
        currentTeacherName = day % 2 === 1 ? cls.headTeacherName : '李秀芳';
      } else if (period.index === 6) {
        const skillSubjects = ['音乐', '美术', '体育'];
        currentSubject = skillSubjects[(day - 1) % 3];
        currentTeacherId = `t0${10 + (day - 1) % 3}`;
        currentTeacherName = ['林小燕', '陈思思', '王强'][(day - 1) % 3];
      } else if (period.index === 7) {
        currentSubject = '科学';
        currentTeacherId = 't002';
        currentTeacherName = '李秀芳';
      } else {
        currentSubject = '劳动';
        currentTeacherId = cls.headTeacherId;
        currentTeacherName = cls.headTeacherName;
      }
      
      slots.push({
        id: `bs${String(slotId).padStart(3, '0')}`,
        semester: MASTER_SCHOOL.currentSemester,
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        dayOfWeek: day,
        periodIndex: period.index,
        startTime: period.startTime,
        endTime: period.endTime,
        subject: currentSubject,
        teacherId: currentTeacherId,
        teacherName: currentTeacherName,
        classroomId: cls.classroomId,
        classroomName: cls.classroomName,
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
  adjustmentReason: index === 5 ? '教师请假' : undefined,
  adjustmentType: index === 5 ? 'substitute' : undefined,
} as ActualScheduleSlot));

/**
 * 获取基准课表Mock数据
 */
export function getMockBaseSchedule(filters?: {
  classId?: string;
  semester?: string;
}): BaseScheduleSlot[] {
  let result = [...MOCK_BASE_SCHEDULE];
  
  if (filters?.classId) {
    // 如果请求特定班级，生成该班级的课表
    result = generateBaseSchedule();
    // 简单处理：返回基准课表
  }
  
  if (filters?.semester) {
    result = result.filter(s => s.semester === filters.semester);
  }
  
  return result;
}

/**
 * 获取实际课表Mock数据
 */
export function getMockActualSchedule(filters?: {
  classId?: string;
  teacherId?: string;
  weekNumber?: number;
}): ActualScheduleSlot[] {
  let result = [...MOCK_ACTUAL_SCHEDULE];
  
  if (filters?.classId) {
    result = result.filter(s => s.classId === filters.classId);
  }
  
  if (filters?.teacherId) {
    result = result.filter(s => s.teacherId === filters.teacherId);
  }
  
  if (filters?.weekNumber) {
    result = result.filter(s => s.weekNumber === filters.weekNumber);
  }
  
  return result;
}

/**
 * 获取简化课表数据（合并基准和实际）
 */
export function getMockSchedule(filters?: {
  classId?: string;
  teacherId?: string;
  weekNumber?: number;
}): ScheduleSlot[] {
  const baseSchedule = getMockBaseSchedule(filters);
  const actualSchedule = getMockActualSchedule(filters);
  
  // 合并基准课表和实际课表，并转换为 ScheduleSlot 格式
  return baseSchedule.map(base => {
    const actual = actualSchedule.find(a => 
      a.classId === base.classId && 
      a.dayOfWeek === base.dayOfWeek && 
      a.periodIndex === base.periodIndex
    );
    
    const source = actual || base;
    
    // 转换为 ScheduleSlot 格式
    return {
      id: source.id,
      classId: source.classId,
      className: source.className,
      grade: source.grade,
      weekDay: source.dayOfWeek as WeekDay,  // dayOfWeek -> weekDay
      periodIndex: source.periodIndex,
      startTime: source.startTime,
      endTime: source.endTime,
      semester: source.semester,
      courseName: source.subject,  // subject -> courseName
      subject: source.subject,
      courseType: source.courseType,
      teacherId: source.teacherId,
      teacherName: source.teacherName,
      classroomId: source.classroomId,
      classroomName: source.classroomName,
      status: source.status === 'leave' ? 'cancelled' : source.status,
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
    } as ScheduleSlot;
  });
}
