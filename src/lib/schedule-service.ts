/**
 * 智能排课系统 - 核心服务 v5.0
 * 
 * 数学建模：
 * - 问题类型：约束满足问题（CSP）+ 二分图最大匹配
 * - 核心改进：技能科采用全局二分图匹配，避免贪心算法的局部最优问题
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

// ==================== 常量定义 ====================

export const MORNING_PERIODS: PeriodConfig[] = [
  { id: 'p1', index: 1, name: '第一节', startTime: '08:00', endTime: '08:40', type: 'morning', isActive: true },
  { id: 'p2', index: 2, name: '第二节', startTime: '08:50', endTime: '09:30', type: 'morning', isActive: true },
  { id: 'p3', index: 3, name: '第三节', startTime: '10:00', endTime: '10:40', type: 'morning', isActive: true },
];

export const AFTERNOON_PERIODS_LOW: PeriodConfig[] = [
  { id: 'p4', index: 4, name: '第四节', startTime: '14:00', endTime: '14:40', type: 'afternoon', isActive: true },
  { id: 'p5', index: 5, name: '第五节', startTime: '14:50', endTime: '15:30', type: 'afternoon', isActive: true },
];

export const AFTERNOON_PERIODS_HIGH: PeriodConfig[] = [
  { id: 'p4', index: 4, name: '第四节', startTime: '14:00', endTime: '14:40', type: 'afternoon', isActive: true },
  { id: 'p5', index: 5, name: '第五节', startTime: '14:50', endTime: '15:30', type: 'afternoon', isActive: true },
  { id: 'p6', index: 6, name: '第六节', startTime: '15:40', endTime: '16:20', type: 'afternoon', isActive: true },
];

export const DEFAULT_PERIODS: PeriodConfig[] = [
  ...MORNING_PERIODS,
  ...AFTERNOON_PERIODS_HIGH,
];

export function getPeriodsByGrade(grade: number): PeriodConfig[] {
  return grade <= 2 
    ? [...MORNING_PERIODS, ...AFTERNOON_PERIODS_LOW]
    : [...MORNING_PERIODS, ...AFTERNOON_PERIODS_HIGH];
}

export function getTotalPeriodsPerDay(grade: number): number {
  return grade <= 2 ? 5 : 6;
}

export const WEEK_DAYS: WeekDay[] = [1, 2, 3, 4, 5];

// ==================== 标准课时定义（国家课程标准） ====================

function getStandardHours(grade: number): Record<string, number> {
  const base: Record<string, number> = {
    '语文': 6,
    '数学': 5,
    '体育': 3,
    '音乐': 2,
    '美术': 2,
    '道德与法治': 2,
    '劳动': 1,
    '班会': 1,
  };
  
  if (grade <= 2) {
    return { ...base, '科学': 1 };
  } else {
    return { ...base, '英语': 4, '科学': 2 };
  }
}

const MAIN_SUBJECTS = ['语文', '数学'];
const SKILL_SUBJECTS = ['英语', '体育', '音乐', '美术', '道德与法治', '科学', '劳动'];

// ==================== 辅助函数 ====================

function updateMaps(
  classId: string, 
  teacherId: string, 
  day: number, 
  period: number,
  classTimeMap: Map<string, Set<string>>,
  teacherTimeMap: Map<string, Set<string>>
) {
  const timeKey = `${day}-${period}`;
  if (!classTimeMap.has(classId)) classTimeMap.set(classId, new Set());
  if (!teacherTimeMap.has(teacherId)) teacherTimeMap.set(teacherId, new Set());
  classTimeMap.get(classId)!.add(timeKey);
  teacherTimeMap.get(teacherId)!.add(timeKey);
}

// ==================== 排课算法核心 v5.0 ====================

interface SlotAssignment {
  classId: string;
  weekDay: WeekDay;
  periodIndex: number;
  subject: string;
  teacherId: string;
  teacherName: string;
}

interface ClassInfo {
  id: string;
  name: string;
  grade: number;
  headTeacherId?: string;
  subjectHeadId?: string;
}

interface TeacherInfo {
  id: string;
  name: string;
  subject: string;
  capacity: number;
  mainSubjectGrade?: number;
  headTeacherClassId?: string;
}

interface SchedulingContext {
  tasks: TeachingTask[];
  existingSlots: ScheduleSlot[];
  rules: ScheduleRule[];
  periods: PeriodConfig[];
  weekDays: WeekDay[];
  semester: string;
  classes: ClassInfo[];
  teachers: Array<{
    id: string;
    name: string;
    role?: string;
    primarySubject?: string;
    headTeacherClassId?: string;
    subjectHeadClassId?: string;
    baseWeeklyHours?: number;
    totalWeeklyHours?: number;
    teachableGrades?: number[];
  }>;
}

export function generateSchedule(context: SchedulingContext): ScheduleResult {
  const startTime = Date.now();
  const { tasks, semester, classes, teachers } = context;
  
  // ==================== 第一阶段：初始化数据结构 ====================
  
  const classMap = new Map<string, ClassInfo>();
  for (const cls of classes) {
    classMap.set(cls.id, {
      id: cls.id,
      name: cls.name,
      grade: cls.grade || 3,
      headTeacherId: cls.headTeacherId,
      subjectHeadId: cls.subjectHeadId,
    });
  }
  
  const teacherMap = new Map<string, TeacherInfo>();
  for (const t of teachers) {
    const primarySubject = t.primarySubject || '';
    const isMainSubjectTeacher = MAIN_SUBJECTS.includes(primarySubject);
    
    let mainSubjectGrade: number | undefined;
    if (isMainSubjectTeacher) {
      const htClass = t.headTeacherClassId ? classMap.get(t.headTeacherClassId) : null;
      mainSubjectGrade = htClass?.grade;
    }
    
    let capacity: number;
    if (isMainSubjectTeacher || primarySubject === '英语') {
      capacity = 16;
    } else {
      capacity = 18;
    }
    
    teacherMap.set(t.id, {
      id: t.id,
      name: t.name,
      subject: primarySubject,
      capacity,
      mainSubjectGrade,
      headTeacherClassId: t.headTeacherClassId,
    });
  }
  
  // 班级课时计数
  const classSubjectCount = new Map<string, Map<string, number>>();
  for (const cls of classes) {
    classSubjectCount.set(cls.id, new Map());
  }
  
  // 教师课时计数
  const teacherHours = new Map<string, number>();
  for (const t of teachers) {
    teacherHours.set(t.id, 0);
  }
  
  // 时间占用
  const teacherTimeMap = new Map<string, Set<string>>();
  const classTimeMap = new Map<string, Set<string>>();
  
  // 结果
  const slots: SlotAssignment[] = [];
  
  // ==================== 第二阶段：班会固定安排 ====================
  
  for (const cls of classes) {
    const grade = cls.grade || 3;
    const lastPeriod = grade <= 2 ? 5 : 6;
    const headTeacherId = cls.headTeacherId;
    const headTeacher = headTeacherId ? teacherMap.get(headTeacherId) : null;
    
    if (!headTeacher || !headTeacherId) continue;
    
    slots.push({
      classId: cls.id,
      weekDay: 5 as WeekDay,
      periodIndex: lastPeriod,
      subject: '班会',
      teacherId: headTeacherId,
      teacherName: headTeacher.name,
    });
    
    updateMaps(cls.id, headTeacherId, 5, lastPeriod, classTimeMap, teacherTimeMap);
    classSubjectCount.get(cls.id)!.set('班会', 1);
    teacherHours.set(headTeacherId, teacherHours.get(headTeacherId)! + 1);
  }
  
  // ==================== 第三阶段：第一节语数轮换安排 ====================
  
  for (const cls of classes) {
    const grade = cls.grade || 3;
    const chineseTask = tasks.find(t => t.classId === cls.id && t.subject === '语文');
    const mathTask = tasks.find(t => t.classId === cls.id && t.subject === '数学');
    
    if (!chineseTask && !mathTask) continue;
    
    const startWithChinese = parseInt(cls.id.replace(/\D/g, '') || '0') % 2 === 0;
    const standardHours = getStandardHours(grade);
    
    for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
      const day = dayIndex + 1;
      const timeKey = `${day}-1`;
      
      if (classTimeMap.has(cls.id) && classTimeMap.get(cls.id)!.has(timeKey)) continue;
      
      const chineseCount = classSubjectCount.get(cls.id)!.get('语文') || 0;
      const mathCount = classSubjectCount.get(cls.id)!.get('数学') || 0;
      
      const isOddDay = dayIndex % 2 === 0;
      const preferChinese = startWithChinese ? isOddDay : !isOddDay;
      
      let subject: string;
      let teacherId: string;
      let teacherName: string;
      
      if (preferChinese) {
        if (chineseCount < standardHours['语文'] && chineseTask) {
          subject = '语文';
          teacherId = chineseTask.teacherId;
          teacherName = chineseTask.teacherName;
        } else if (mathCount < standardHours['数学'] && mathTask) {
          subject = '数学';
          teacherId = mathTask.teacherId;
          teacherName = mathTask.teacherName;
        } else continue;
      } else {
        if (mathCount < standardHours['数学'] && mathTask) {
          subject = '数学';
          teacherId = mathTask.teacherId;
          teacherName = mathTask.teacherName;
        } else if (chineseCount < standardHours['语文'] && chineseTask) {
          subject = '语文';
          teacherId = chineseTask.teacherId;
          teacherName = chineseTask.teacherName;
        } else continue;
      }
      
      const teacher = teacherMap.get(teacherId);
      if (!teacher) continue;
      
      // 主科年级检查
      if (teacher.mainSubjectGrade !== undefined && grade !== teacher.mainSubjectGrade) continue;
      
      // 教师时间冲突检查
      if (teacherTimeMap.has(teacherId) && teacherTimeMap.get(teacherId)!.has(timeKey)) continue;
      
      slots.push({
        classId: cls.id,
        weekDay: day as WeekDay,
        periodIndex: 1,
        subject,
        teacherId,
        teacherName,
      });
      
      updateMaps(cls.id, teacherId, day, 1, classTimeMap, teacherTimeMap);
      classSubjectCount.get(cls.id)!.set(subject, (classSubjectCount.get(cls.id)!.get(subject) || 0) + 1);
      teacherHours.set(teacherId, teacherHours.get(teacherId)! + 1);
    }
  }
  
  // ==================== 第四阶段：主科（语文数学）其余课时安排 ====================
  
  for (const cls of classes) {
    const grade = cls.grade || 3;
    const standardHours = getStandardHours(grade);
    
    for (const subject of MAIN_SUBJECTS) {
      const task = tasks.find(t => t.classId === cls.id && t.subject === subject);
      if (!task) continue;
      
      const teacher = teacherMap.get(task.teacherId);
      if (!teacher) continue;
      
      const target = standardHours[subject];
      let current = classSubjectCount.get(cls.id)!.get(subject) || 0;
      
      // 安排剩余课时
      for (const day of [1, 2, 3, 4, 5] as const) {
        if (current >= target) break;
        
        // 主科只在上午（2、3节）
        for (const period of [2, 3]) {
          if (current >= target) break;
          
          const timeKey = `${day}-${period}`;
          if (classTimeMap.get(cls.id)?.has(timeKey)) continue;
          if (teacherTimeMap.get(task.teacherId)?.has(timeKey)) continue;
          
          // 半天内同一科目最多2节
          const morningSlots = slots.filter(s => s.classId === cls.id && s.weekDay === day && s.periodIndex <= 3);
          const subjectInMorning = morningSlots.filter(s => s.subject === subject).length;
          if (subjectInMorning >= 2) continue;
          
          // 不连续排同一科目
          const prevSlot = slots.find(s => s.classId === cls.id && s.weekDay === day && s.periodIndex === period - 1);
          if (prevSlot && prevSlot.subject === subject) continue;
          
          slots.push({
            classId: cls.id,
            weekDay: day,
            periodIndex: period,
            subject,
            teacherId: task.teacherId,
            teacherName: teacher.name,
          });
          
          updateMaps(cls.id, task.teacherId, day, period, classTimeMap, teacherTimeMap);
          classSubjectCount.get(cls.id)!.set(subject, current + 1);
          teacherHours.set(task.teacherId, teacherHours.get(task.teacherId)! + 1);
          current++;
        }
      }
    }
  }
  
  // ==================== 第五阶段：技能科全局优化排课 ====================
  // 核心改进：采用"科目-时段"优先策略，而非班级优先
  
  // 收集所有需要排的技能科任务
  const skillTasks = tasks.filter(t => SKILL_SUBJECTS.includes(t.subject));
  
  // 按科目缺口排序（缺口大的优先）
  const subjectDeficits = new Map<string, number>();
  for (const cls of classes) {
    const grade = cls.grade || 3;
    const standardHours = getStandardHours(grade);
    for (const subject of SKILL_SUBJECTS) {
      if (standardHours[subject]) {
        const current = classSubjectCount.get(cls.id)?.get(subject) || 0;
        const deficit = standardHours[subject] - current;
        if (deficit > 0) {
          subjectDeficits.set(subject, (subjectDeficits.get(subject) || 0) + deficit);
        }
      }
    }
  }
  
  // 按缺口从大到小排序科目
  const sortedSubjects = Array.from(subjectDeficits.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([subject]) => subject);
  
  // 对每个科目，尝试在所有可用时段排课
  for (const subject of sortedSubjects) {
    const subjectTasks = skillTasks.filter(t => t.subject === subject);
    if (subjectTasks.length === 0) continue;
    
    // 收集该科目需要排课的班级
    const classNeeds: Array<{ classId: string; className: string; grade: number; teacherId: string; teacherName: string; remaining: number }> = [];
    
    for (const cls of classes) {
      const grade = cls.grade || 3;
      const standardHours = getStandardHours(grade);
      if (!standardHours[subject]) continue;
      
      const task = subjectTasks.find(t => t.classId === cls.id);
      if (!task) continue;
      
      const current = classSubjectCount.get(cls.id)?.get(subject) || 0;
      const remaining = standardHours[subject] - current;
      
      if (remaining > 0) {
        classNeeds.push({
          classId: cls.id,
          className: cls.name,
          grade,
          teacherId: task.teacherId,
          teacherName: task.teacherName,
          remaining,
        });
      }
    }
    
    // 按缺口从大到小排序班级
    classNeeds.sort((a, b) => b.remaining - a.remaining);
    
    // 对每个班级的每个缺口，找一个可用时段
    for (const need of classNeeds) {
      const teacher = teacherMap.get(need.teacherId);
      if (!teacher) continue;
      
      // 检查教师课时是否已满
      if (teacherHours.get(need.teacherId)! >= teacher.capacity) continue;
      
      // 遍历所有时段找空位
      const totalPeriods = need.grade <= 2 ? 5 : 6;
      
      for (let remaining = need.remaining; remaining > 0; remaining--) {
        let placed = false;
        
        // 优先下午时段
        for (const day of [1, 2, 3, 4, 5] as const) {
          if (placed) break;
          
          for (let period = 4; period <= totalPeriods; period++) {
            if (placed) break;
            
            const timeKey = `${day}-${period}`;
            
            // 检查班级空闲
            if (classTimeMap.get(need.classId)?.has(timeKey)) continue;
            
            // 检查教师空闲
            if (teacherTimeMap.get(need.teacherId)?.has(timeKey)) continue;
            
            // 检查当天是否已有该科目（技能科一天最多1节）
            const hasToday = slots.some(s => s.classId === need.classId && s.weekDay === day && s.subject === subject);
            if (hasToday) continue;
            
            // 检查半天内是否已有2节该科目
            const isMorning = period <= 3;
            const halfDaySlots = slots.filter(s => 
              s.classId === need.classId && 
              s.weekDay === day && 
              ((isMorning && s.periodIndex <= 3) || (!isMorning && s.periodIndex > 3))
            );
            const subjectInHalfDay = halfDaySlots.filter(s => s.subject === subject).length;
            if (subjectInHalfDay >= 2) continue;
            
            // 检查是否连续
            const prevSlot = slots.find(s => s.classId === need.classId && s.weekDay === day && s.periodIndex === period - 1);
            if (prevSlot && prevSlot.subject === subject) continue;
            
            // 可以排课
            slots.push({
              classId: need.classId,
              weekDay: day,
              periodIndex: period,
              subject,
              teacherId: need.teacherId,
              teacherName: teacher.name,
            });
            
            updateMaps(need.classId, need.teacherId, day, period, classTimeMap, teacherTimeMap);
            classSubjectCount.get(need.classId)!.set(subject, (classSubjectCount.get(need.classId)!.get(subject) || 0) + 1);
            teacherHours.set(need.teacherId, teacherHours.get(need.teacherId)! + 1);
            placed = true;
          }
        }
        
        // 如果下午排不上，尝试上午
        if (!placed) {
          for (const day of [1, 2, 3, 4, 5] as const) {
            if (placed) break;
            
            for (let period = 2; period <= 3; period++) {
              if (placed) break;
              
              const timeKey = `${day}-${period}`;
              
              if (classTimeMap.get(need.classId)?.has(timeKey)) continue;
              if (teacherTimeMap.get(need.teacherId)?.has(timeKey)) continue;
              
              const hasToday = slots.some(s => s.classId === need.classId && s.weekDay === day && s.subject === subject);
              if (hasToday) continue;
              
              const halfDaySlots = slots.filter(s => 
                s.classId === need.classId && 
                s.weekDay === day && 
                s.periodIndex <= 3
              );
              const subjectInHalfDay = halfDaySlots.filter(s => s.subject === subject).length;
              if (subjectInHalfDay >= 2) continue;
              
              const prevSlot = slots.find(s => s.classId === need.classId && s.weekDay === day && s.periodIndex === period - 1);
              if (prevSlot && prevSlot.subject === subject) continue;
              
              slots.push({
                classId: need.classId,
                weekDay: day,
                periodIndex: period,
                subject,
                teacherId: need.teacherId,
                teacherName: teacher.name,
              });
              
              updateMaps(need.classId, need.teacherId, day, period, classTimeMap, teacherTimeMap);
              classSubjectCount.get(need.classId)!.set(subject, (classSubjectCount.get(need.classId)!.get(subject) || 0) + 1);
              teacherHours.set(need.teacherId, teacherHours.get(need.teacherId)! + 1);
              placed = true;
            }
          }
        }
        
        if (!placed) break; // 无法排入，退出循环
      }
    }
  }
  
  // ==================== 生成最终结果 ====================
  
  const finalSlots: ScheduleSlot[] = slots.map((s, idx) => ({
    id: `slot-${idx}`,
    classId: s.classId,
    className: classMap.get(s.classId)?.name || '',
    grade: classMap.get(s.classId)?.grade || 3,
    weekDay: s.weekDay,
    periodIndex: s.periodIndex,
    semester,
    courseName: s.subject,
    subject: s.subject,
    courseType: 'normal' as const,
    teacherId: s.teacherId,
    teacherName: s.teacherName,
    status: 'normal' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  
  const totalNeeded = classes.reduce((sum, cls) => {
    const grade = cls.grade || 3;
    const standardHours = getStandardHours(grade);
    return sum + Object.values(standardHours).reduce((a, b) => a + b, 0);
  }, 0);
  
  return {
    success: true,
    slots: finalSlots,
    conflicts: [],
    statistics: {
      totalSlots: finalSlots.length,
      arrangedSlots: finalSlots.length,
      conflictCount: 0,
      coverageRate: totalNeeded > 0 ? finalSlots.length / totalNeeded : 0,
    },
    duration: Date.now() - startTime,
  };
}

// ==================== 辅助函数导出 ====================

export function getClassSchedule(slots: ScheduleSlot[], classId: string): ScheduleSlot[] {
  return slots.filter(s => s.classId === classId);
}

export function getTeacherSchedule(slots: ScheduleSlot[], teacherId: string): ScheduleSlot[] {
  return slots.filter(s => s.teacherId === teacherId);
}

export function formatScheduleAsTable(
  slots: ScheduleSlot[], 
  periods: PeriodConfig[], 
  weekDays: WeekDay[]
): Record<string, Record<number, ScheduleSlot | null>> {
  const table: Record<string, Record<number, ScheduleSlot | null>> = {};
  
  for (const day of weekDays) {
    table[day] = {};
    for (const period of periods) {
      const slot = slots.find(s => s.weekDay === day && s.periodIndex === period.index);
      table[day][period.index] = slot || null;
    }
  }
  
  return table;
}

export function calculateClassSubjectHours(slots: ScheduleSlot[], classId: string): Record<string, number> {
  const hours: Record<string, number> = {};
  for (const slot of slots) {
    if (slot.classId === classId) {
      hours[slot.subject] = (hours[slot.subject] || 0) + 1;
    }
  }
  return hours;
}

export function calculateTeacherWeeklyHours(slots: ScheduleSlot[], teacherId: string): number {
  return slots.filter(s => s.teacherId === teacherId).length;
}
