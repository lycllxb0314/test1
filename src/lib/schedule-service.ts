/**
 * 智能排课系统 - 核心服务
 * 
 * 功能：
 * 1. 智能排课算法
 * 2. 与请假系统联动
 * 3. 代课管理
 * 4. 课表同步
 * 
 * 核心规则：
 * - 班主任/科任的课程优先排在本人班级
 * - 主科课时量按照角色和带班数配置
 * - 让老师们在自己班优先有课时量
 */

import type { 
  ScheduleSlot, 
  TeachingTask, 
  ScheduleRule, 
  ScheduleResult, 
  ScheduleConflict,
  PeriodConfig,
  WeekDay
} from '@/types';
import { 
  calculateTaskPriority,
  MAIN_SUBJECTS,
  PRIORITY_SECONDARY_SUBJECTS,
} from './data/teaching-rules';

// ==================== 默认配置 ====================

export const DEFAULT_PERIODS: PeriodConfig[] = [
  { id: 'p1', index: 1, name: '第一节', startTime: '08:00', endTime: '08:40', type: 'morning', isActive: true },
  { id: 'p2', index: 2, name: '第二节', startTime: '08:50', endTime: '09:30', type: 'morning', isActive: true },
  { id: 'p3', index: 3, name: '第三节', startTime: '10:00', endTime: '10:40', type: 'morning', isActive: true },
  { id: 'p4', index: 4, name: '第四节', startTime: '10:50', endTime: '11:30', type: 'morning', isActive: true },
  { id: 'p5', index: 5, name: '第五节', startTime: '14:00', endTime: '14:40', type: 'afternoon', isActive: true },
  { id: 'p6', index: 6, name: '第六节', startTime: '14:50', endTime: '15:30', type: 'afternoon', isActive: true },
  { id: 'p7', index: 7, name: '第七节', startTime: '15:40', endTime: '16:20', type: 'afternoon', isActive: true },
];

export const WEEK_DAYS = [
  { key: 1, label: '周一' },
  { key: 2, label: '周二' },
  { key: 3, label: '周三' },
  { key: 4, label: '周四' },
  { key: 5, label: '周五' },
];

// 科目颜色配置
export const SUBJECT_COLORS: Record<string, string> = {
  '语文': 'bg-red-100 text-red-700 border-red-200',
  '数学': 'bg-blue-100 text-blue-700 border-blue-200',
  '英语': 'bg-green-100 text-green-700 border-green-200',
  '体育': 'bg-orange-100 text-orange-700 border-orange-200',
  '音乐': 'bg-purple-100 text-purple-700 border-purple-200',
  '美术': 'bg-pink-100 text-pink-700 border-pink-200',
  '科学': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  '道德与法治': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  '阅读': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  '班会': 'bg-gray-100 text-gray-700 border-gray-200',
  '劳动': 'bg-amber-100 text-amber-700 border-amber-200',
  '自习': 'bg-slate-100 text-slate-700 border-slate-200',
  '信息技术': 'bg-teal-100 text-teal-700 border-teal-200',
};

// ==================== 排课算法核心 ====================

interface SchedulingContext {
  tasks: TeachingTask[];
  existingSlots: ScheduleSlot[];
  rules: ScheduleRule[];
  periods: PeriodConfig[];
  weekDays: WeekDay[];
  semester: string;
  // 班级信息（用于判断班主任和科任）
  classes: Array<{
    id: string;
    name: string;
    grade: number;
    headTeacherId?: string;
    headTeacherName?: string;
    subjectHeadId?: string;         // 兼容旧数据
    subjectHeadName?: string;
    subjectHeads?: Array<{          // 新数据结构：按科目存储科任
      subject: string;
      teacherId: string;
      teacherName: string;
    }>;
  }>;
  // 教师信息
  teachers: Array<{
    id: string;
    name: string;
    role?: string;
    primarySubject?: string;
    headTeacherClassId?: string;
    subjectHeadClassId?: string;
  }>;
}

/**
 * 智能排课算法
 * 使用贪心算法 + 约束满足
 * 
 * 优先级规则：
 * 1. 班主任教本班主科 > 班主任教本班兼任科目 > 其他
 * 2. 科任教本班主科 > 科任教本班兼任科目 > 其他
 * 3. 主科优先（语数英）
 * 4. 课时量约束是核心
 */
export function generateSchedule(context: SchedulingContext): ScheduleResult {
  const startTime = Date.now();
  const { tasks, existingSlots, rules, periods, weekDays, semester, classes, teachers } = context;
  
  const newSlots: ScheduleSlot[] = [...existingSlots];
  const conflicts: ScheduleConflict[] = [];
  
  // 按优先级排序教学任务
  const sortedTasks = sortTasksByPriority(tasks, classes, teachers);
  
  // 为每个教学任务分配时间槽
  for (const task of sortedTasks) {
    const neededSlots = task.weeklyHours - task.arrangedHours;
    
    for (let i = 0; i < neededSlots; i++) {
      const bestSlot = findBestSlot(
        task, 
        newSlots, 
        rules, 
        periods, 
        weekDays, 
        semester, 
        classes,
        teachers
      );
      
      if (bestSlot) {
        newSlots.push(bestSlot);
        task.arrangedHours++;
      } else {
        conflicts.push({
          id: `conflict-${task.id}-${i}`,
          type: 'time_conflict',
          description: `${task.teacherName}老师的${task.subject}课程无法找到合适的时间槽`,
          relatedSlots: [],
          severity: 'error',
          suggestions: ['考虑增加教师', '调整其他课程时间', '减少课时'],
        });
      }
    }
  }
  
  // 检查所有冲突
  const allConflicts = detectConflicts(newSlots, rules);
  conflicts.push(...allConflicts);
  
  return {
    success: conflicts.filter(c => c.severity === 'error').length === 0,
    slots: newSlots,
    conflicts,
    statistics: {
      totalSlots: tasks.reduce((sum, t) => sum + t.weeklyHours, 0),
      arrangedSlots: newSlots.length,
      conflictCount: conflicts.length,
      coverageRate: newSlots.length / tasks.reduce((sum, t) => sum + t.weeklyHours, 0),
    },
    duration: Date.now() - startTime,
  };
}

/**
 * 按优先级排序教学任务
 * 
 * 核心逻辑：让老师们在自己班优先有课时量
 * 
 * 优先级规则：
 * 1. 班主任教本班主科: 100分
 * 2. 班主任教本班兼任科目（道法、劳动等）: 95分
 * 3. 科任教本班主科: 85分
 * 4. 科任教本班兼任科目: 80分
 * 5. 班主任教其他班主科: 60分
 * 6. 科任教其他班课程: 50分
 * 7. 普通教师主科: 40分
 * 8. 普通教师其他: 30分
 */
function sortTasksByPriority(
  tasks: TeachingTask[], 
  classes: Array<{ id: string; headTeacherId?: string; subjectHeadId?: string }>,
  teachers: Array<{ id: string; primarySubject?: string }>
): TeachingTask[] {
  return [...tasks].sort((a, b) => {
    const classA = classes.find(c => c.id === a.classId);
    const classB = classes.find(c => c.id === b.classId);
    const teacherA = teachers.find(t => t.id === a.teacherId);
    const teacherB = teachers.find(t => t.id === b.teacherId);
    
    const priorityA = calculateTaskPriority(
      { teacherId: a.teacherId, classId: a.classId, subject: a.subject },
      classA,
      teacherA
    );
    
    const priorityB = calculateTaskPriority(
      { teacherId: b.teacherId, classId: b.classId, subject: b.subject },
      classB,
      teacherB
    );
    
    // 优先级高的先排
    if (priorityA !== priorityB) return priorityB - priorityA;
    
    // 主科优先
    const isMainA = MAIN_SUBJECTS.includes(a.subject as any);
    const isMainB = MAIN_SUBJECTS.includes(b.subject as any);
    if (isMainA !== isMainB) return isMainA ? -1 : 1;
    
    // 课时多的优先（剩余课时）
    const remainingA = a.weeklyHours - a.arrangedHours;
    const remainingB = b.weeklyHours - b.arrangedHours;
    return remainingB - remainingA;
  });
}

/**
 * 为教学任务找到最佳时间槽
 */
function findBestSlot(
  task: TeachingTask,
  existingSlots: ScheduleSlot[],
  rules: ScheduleRule[],
  periods: PeriodConfig[],
  weekDays: WeekDay[],
  semester: string,
  classes: Array<{ id: string; headTeacherId?: string; subjectHeadId?: string }>,
  teachers: Array<{ id: string; primarySubject?: string }>
): ScheduleSlot | null {
  // 判断优先级类型
  const cls = classes.find(c => c.id === task.classId);
  const teacher = teachers.find(t => t.id === task.teacherId);
  
  const isHeadTeacher = cls?.headTeacherId === task.teacherId;
  const isSubjectHead = cls?.subjectHeadId === task.teacherId;
  const isMainSubject = MAIN_SUBJECTS.includes(task.subject as any);
  const primarySubject = teacher?.primarySubject || '';
  const isPrioritySecondary = PRIORITY_SECONDARY_SUBJECTS[primarySubject]?.includes(task.subject);
  
  // 生成所有可能的时间槽候选
  const candidates: Array<{ weekDay: WeekDay; periodIndex: number; score: number }> = [];
  
  for (const weekDay of weekDays) {
    for (const period of periods) {
      if (!period.isActive) continue;
      
      // 计算该时间槽的得分
      const score = evaluateSlot(
        weekDay, 
        period.index, 
        task, 
        existingSlots, 
        rules,
        isHeadTeacher,
        isSubjectHead,
        isMainSubject,
        isPrioritySecondary
      );
      
      if (score > 0) {
        candidates.push({ weekDay, periodIndex: period.index, score });
      }
    }
  }
  
  // 按分数排序，选择最佳
  candidates.sort((a, b) => b.score - a.score);
  
  if (candidates.length === 0) return null;
  
  const best = candidates[0];
  
  return {
    id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    classId: task.classId,
    className: task.className,
    grade: task.grade,
    weekDay: best.weekDay as WeekDay,
    periodIndex: best.periodIndex,
    semester,
    courseName: task.subject,
    subject: task.subject,
    courseType: 'normal',
    teacherId: task.teacherId,
    teacherName: task.teacherName,
    status: 'normal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 评估时间槽得分
 * 
 * 考虑因素：
 * 1. 教师冲突（同一时间不能有多节课）
 * 2. 班级冲突（同一时间不能有多节课）
 * 3. 课程分布均匀性
 * 4. 主科尽量安排在上午
 * 5. 班主任/科任的本班课程优先安排
 */
function evaluateSlot(
  weekDay: WeekDay,
  periodIndex: number,
  task: TeachingTask,
  existingSlots: ScheduleSlot[],
  rules: ScheduleRule[],
  isHeadTeacher: boolean,
  isSubjectHead: boolean,
  isMainSubject: boolean,
  isPrioritySecondary: boolean
): number {
  let score = 100; // 基础分
  
  // 1. 检查硬性冲突（必须返回0）
  
  // 教师冲突：同一时间教师不能有多节课
  const teacherConflict = existingSlots.find(
    s => s.teacherId === task.teacherId && 
         s.weekDay === weekDay && 
         s.periodIndex === periodIndex
  );
  if (teacherConflict) return 0;
  
  // 班级冲突：同一时间班级不能有多节课
  const classConflict = existingSlots.find(
    s => s.classId === task.classId && 
         s.weekDay === weekDay && 
         s.periodIndex === periodIndex
  );
  if (classConflict) return 0;
  
  // 2. 软性约束（扣分）
  
  // 教师当天课程数量（避免一天太多课）
  const teacherDaySlots = existingSlots.filter(
    s => s.teacherId === task.teacherId && s.weekDay === weekDay
  );
  score -= teacherDaySlots.length * 5; // 每多一节扣5分
  
  // 教师当天同一班级的课程数量（避免同一天同一班多节）
  const sameClassDaySlots = teacherDaySlots.filter(s => s.classId === task.classId);
  score -= sameClassDaySlots.length * 10; // 每多一节扣10分
  
  // 主科尽量安排在上午
  if (isMainSubject && periodIndex > 4) {
    score -= 10; // 下午扣10分
  }
  
  // 3. 加分项
  
  // 班主任/科任的本班课程加分
  if (isHeadTeacher || isSubjectHead) {
    // 班主任/科任教本班的课，优先安排
    score += 15;
    
    // 兼任科目（道法、劳动等）优先
    if (isPrioritySecondary) {
      score += 10;
    }
  }
  
  // 4. 课程分布优化
  
  // 检查该科目在该班级本周已有课时
  const subjectSlots = existingSlots.filter(
    s => s.classId === task.classId && s.subject === task.subject
  );
  
  // 同一科目尽量不在同一天连着排
  const sameDaySubjectSlots = subjectSlots.filter(s => s.weekDay === weekDay);
  if (sameDaySubjectSlots.length >= 2) {
    score -= 20; // 同一天已有多节同科目，扣分
  }
  
  // 同一科目尽量分散在不同天
  const subjectDays = new Set(subjectSlots.map(s => s.weekDay));
  if (!subjectDays.has(weekDay)) {
    score += 5; // 该科目还没排在今天，加分
  }
  
  return Math.max(0, score);
}

/**
 * 检测课表冲突
 */
function detectConflicts(slots: ScheduleSlot[], rules: ScheduleRule[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  
  // 检查教师时间冲突
  const teacherSlotMap = new Map<string, ScheduleSlot[]>();
  for (const slot of slots) {
    const key = `${slot.teacherId}-${slot.weekDay}-${slot.periodIndex}`;
    if (!teacherSlotMap.has(key)) {
      teacherSlotMap.set(key, []);
    }
    teacherSlotMap.get(key)!.push(slot);
  }
  
  for (const [key, conflictSlots] of teacherSlotMap) {
    if (conflictSlots.length > 1) {
      conflicts.push({
        id: `conflict-teacher-${key}`,
        type: 'teacher_conflict',
        description: `${conflictSlots[0].teacherName}在同一时间有${conflictSlots.length}节课`,
        relatedSlots: conflictSlots.map(s => s.id),
        severity: 'error',
        suggestions: ['调整课程时间', '安排代课'],
      });
    }
  }
  
  // 检查班级时间冲突
  const classSlotMap = new Map<string, ScheduleSlot[]>();
  for (const slot of slots) {
    const key = `${slot.classId}-${slot.weekDay}-${slot.periodIndex}`;
    if (!classSlotMap.has(key)) {
      classSlotMap.set(key, []);
    }
    classSlotMap.get(key)!.push(slot);
  }
  
  for (const [key, conflictSlots] of classSlotMap) {
    if (conflictSlots.length > 1) {
      conflicts.push({
        id: `conflict-class-${key}`,
        type: 'class_conflict',
        description: `${conflictSlots[0].className}在同一时间有${conflictSlots.length}节课`,
        relatedSlots: conflictSlots.map(s => s.id),
        severity: 'error',
        suggestions: ['调整课程时间'],
      });
    }
  }
  
  return conflicts;
}

// ==================== 辅助函数 ====================

/**
 * 获取班级课表
 */
export function getClassSchedule(
  slots: ScheduleSlot[], 
  classId: string
): ScheduleSlot[] {
  return slots.filter(s => s.classId === classId);
}

/**
 * 获取教师课表
 */
export function getTeacherSchedule(
  slots: ScheduleSlot[], 
  teacherId: string
): ScheduleSlot[] {
  return slots.filter(s => s.teacherId === teacherId);
}

/**
 * 格式化课表为表格格式
 */
export function formatScheduleAsTable(
  slots: ScheduleSlot[],
  periods: PeriodConfig[],
  weekDays: Array<{ key: number; label: string }> | WeekDay[]
): Array<{ period: PeriodConfig; days: Array<ScheduleSlot | null> }> {
  // 规范化 weekDays
  const normalizedWeekDays: WeekDay[] = Array.isArray(weekDays) && typeof weekDays[0] === 'object'
    ? (weekDays as Array<{ key: number }>).map(w => w.key as WeekDay)
    : weekDays as WeekDay[];
    
  return periods.map(period => ({
    period,
    days: normalizedWeekDays.map(day => 
      slots.find(s => s.weekDay === day && s.periodIndex === period.index) || null
    ),
  }));
}

/**
 * 计算班级各科目课时
 */
export function calculateClassSubjectHours(slots: ScheduleSlot[]): Record<string, number> {
  const hours: Record<string, number> = {};
  for (const slot of slots) {
    if (slot.subject) {
      hours[slot.subject] = (hours[slot.subject] || 0) + 1;
    }
  }
  return hours;
}

/**
 * 计算教师周课时
 */
export function calculateTeacherWeeklyHours(
  slots: ScheduleSlot[], 
  teacherId: string
): number {
  return slots.filter(s => s.teacherId === teacherId).length;
}
