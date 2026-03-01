/**
 * 智能排课系统 - 核心服务 v4.0
 * 
 * 数学建模：
 * - 问题类型：约束满足问题（CSP）
 * - 变量：X[c,d,p] = 班级c在第d天第p节的科目和教师
 * - 约束：
 *   C1: 每班每科课时 = 标准课时（硬约束）
 *   C2: 教师同一时间只能在一个班（硬约束）
 *   C3: 主科老师在主科只教一个年级（硬约束）
 *   C4: 主科只在上午（硬约束）
 *   C5: 班会固定周五下午最后一节（硬约束）
 *   C6: 非主科一天内不重复（硬约束）
 *   C7: 同一科目时段错开（软约束）
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
  // 基础课时（所有年级通用）
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
  
  // 低年级（1-2年级）：科学1节，无英语
  if (grade <= 2) {
    return { ...base, '科学': 1 };
  }
  // 中高年级（3-6年级）：科学2节，英语4节
  else {
    return { ...base, '英语': 4, '科学': 2 };
  }
}

// 主科定义
const MAIN_SUBJECTS = ['语文', '数学'];

// ==================== 核心数据结构 ====================

interface TeacherInfo {
  id: string;
  name: string;
  subject: string;
  role: string;
  capacity: number;           // 最大课时容量
  mainSubjectGrade?: number;  // 主教学科年级（主科老师不跨年级）
  headTeacherClassId?: string;
}

interface ClassInfo {
  id: string;
  name: string;
  grade: number;
  headTeacherId?: string;
  subjectHeadId?: string;
}

interface SlotAssignment {
  classId: string;
  weekDay: WeekDay;
  periodIndex: number;
  subject: string;
  teacherId: string;
  teacherName: string;
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

// ==================== 排课算法核心 ====================

/**
 * 智能排课算法 v4.0
 * 
 * 核心原则：
 * 1. 严格按标准课时排课，不多不少
 * 2. 班会固定周五下午最后一节
 * 3. 主科只在上午
 * 4. 主科老师主科不跨年级
 * 5. 非主科一天内不重复
 * 6. 同一科目时段错开
 */
export function generateSchedule(context: SchedulingContext): ScheduleResult {
  const startTime = Date.now();
  const { tasks, existingSlots, rules, semester, classes, teachers } = context;
  
  // ==================== 第一阶段：初始化数据结构 ====================
  
  // 构建班级信息映射
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
  
  // 构建教师信息映射
  const teacherMap = new Map<string, TeacherInfo>();
  for (const t of teachers) {
    const primarySubject = t.primarySubject || '';
    const isMainSubjectTeacher = MAIN_SUBJECTS.includes(primarySubject);
    
    // 确定主科年级
    let mainSubjectGrade: number | undefined;
    if (isMainSubjectTeacher) {
      // 通过班主任班级或科任班级确定年级
      const htClass = t.headTeacherClassId ? classMap.get(t.headTeacherClassId) : null;
      const shClass = t.subjectHeadClassId ? classMap.get(t.subjectHeadClassId) : null;
      mainSubjectGrade = htClass?.grade || shClass?.grade;
    }
    
    // 确定课时容量（国家标准）
    let capacity: number;
    if (isMainSubjectTeacher || primarySubject === '英语') {
      capacity = 16;  // 语数英：14-16节
    } else if (t.role === 'skill_teacher' || t.role === 'subject_head') {
      capacity = 18;  // 技能科：16-18节
    } else {
      capacity = 8;   // 领导层
    }
    
    teacherMap.set(t.id, {
      id: t.id,
      name: t.name,
      subject: primarySubject,
      role: t.role || 'subject_head',
      capacity,
      mainSubjectGrade,
      headTeacherClassId: t.headTeacherClassId,
    });
  }
  
  // 每班每科的课时需求（严格按标准）
  const classSubjectNeeds = new Map<string, Map<string, number>>();
  for (const cls of classes) {
    const grade = cls.grade || 3;
    const standardHours = getStandardHours(grade);
    classSubjectNeeds.set(cls.id, new Map(Object.entries(standardHours)));
  }
  
  // 每班每科已排课时计数
  const classSubjectCount = new Map<string, Map<string, number>>();
  for (const cls of classes) {
    classSubjectCount.set(cls.id, new Map());
  }
  
  // 教师已排课时计数
  const teacherHours = new Map<string, number>();
  for (const t of teachers) {
    teacherHours.set(t.id, 0);
  }
  
  // 教师时间占用：teacherId -> Set<"weekDay-periodIndex">
  const teacherTimeMap = new Map<string, Set<string>>();
  
  // 班级时间占用：classId -> Set<"weekDay-periodIndex">
  const classTimeMap = new Map<string, Set<string>>();
  
  // 结果数组
  const slots: SlotAssignment[] = [];
  const conflicts: ScheduleConflict[] = [];
  
  // ==================== 第二阶段：班会固定安排 ====================
  // 规则：班会固定在周五下午最后一节
  
  for (const cls of classes) {
    const grade = cls.grade || 3;
    const lastPeriod = grade <= 2 ? 5 : 6;
    
    // 找班主任
    const headTeacherId = cls.headTeacherId;
    const headTeacher = headTeacherId ? teacherMap.get(headTeacherId) : null;
    
    if (!headTeacher || !headTeacherId) continue;
    
    // 检查班主任时间
    const timeKey = `5-${lastPeriod}`;
    if (teacherTimeMap.has(headTeacherId) && teacherTimeMap.get(headTeacherId)!.has(timeKey)) {
      conflicts.push({
        id: `conflict-banhui-${cls.id}`,
        type: 'rule_violation',
        description: `班级 ${cls.name} 班主任在周五下午最后一节有冲突，无法安排班会`,
        relatedSlots: [],
        severity: 'warning',
        suggestions: ['调整班主任时间'],
      });
      continue;
    }
    
    // 安排班会
    slots.push({
      classId: cls.id,
      weekDay: 5 as WeekDay,
      periodIndex: lastPeriod,
      subject: '班会',
      teacherId: headTeacherId,
      teacherName: headTeacher.name,
    });
    
    // 更新状态
    updateMaps(cls.id, headTeacherId, 5, lastPeriod, classTimeMap, teacherTimeMap);
    classSubjectCount.get(cls.id)!.set('班会', 1);
    teacherHours.set(headTeacherId, teacherHours.get(headTeacherId)! + 1);
  }
  
  // ==================== 第三阶段：第一节语数轮换安排 ====================
  // 规则：周一到周五第一节，语文数学交替
  
  for (const cls of classes) {
    const grade = cls.grade || 3;
    const classTeachers = Array.from(teacherMap.values()).filter(t => 
      t.headTeacherClassId === cls.id || 
      (teachers.find(tt => tt.id === t.id)?.subjectHeadClassId === cls.id)
    );
    
    // 找语文老师
    const chineseTask = tasks.find(t => t.classId === cls.id && t.subject === '语文');
    const mathTask = tasks.find(t => t.classId === cls.id && t.subject === '数学');
    
    if (!chineseTask && !mathTask) continue;
    
    // 基于班级ID决定起始科目
    const startWithChinese = parseInt(cls.id.replace(/\D/g, '') || '0') % 2 === 0;
    
    for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
      const day = dayIndex + 1;
      const timeKey = `${day}-1`;
      
      // 检查时间槽是否已被占用
      if (classTimeMap.has(cls.id) && classTimeMap.get(cls.id)!.has(timeKey)) {
        continue;
      }
      
      // 检查该班语数课时是否已满
      const chineseCount = classSubjectCount.get(cls.id)!.get('语文') || 0;
      const mathCount = classSubjectCount.get(cls.id)!.get('数学') || 0;
      const standardHours = getStandardHours(grade);
      
      // 选择科目（轮换策略）
      let subject: string;
      let teacherId: string;
      let teacherName: string;
      
      const preferChinese = startWithChinese ? (dayIndex % 2 === 0) : (dayIndex % 2 === 1);
      
      // 优先按轮换规则，但要考虑课时是否已满
      if (preferChinese && chineseCount < standardHours['语文'] && chineseTask) {
        subject = '语文';
        teacherId = chineseTask.teacherId;
        teacherName = chineseTask.teacherName;
      } else if (!preferChinese && mathCount < standardHours['数学'] && mathTask) {
        subject = '数学';
        teacherId = mathTask.teacherId;
        teacherName = mathTask.teacherName;
      } else if (chineseCount < standardHours['语文'] && chineseTask) {
        subject = '语文';
        teacherId = chineseTask.teacherId;
        teacherName = chineseTask.teacherName;
      } else if (mathCount < standardHours['数学'] && mathTask) {
        subject = '数学';
        teacherId = mathTask.teacherId;
        teacherName = mathTask.teacherName;
      } else {
        continue;  // 语数都已排满
      }
      
      // 检查教师是否可用
      if (teacherTimeMap.has(teacherId) && teacherTimeMap.get(teacherId)!.has(timeKey)) {
        // 教师冲突，尝试另一个科目
        if (subject === '语文' && mathTask && mathCount < standardHours['数学']) {
          subject = '数学';
          teacherId = mathTask.teacherId;
          teacherName = mathTask.teacherName;
        } else if (subject === '数学' && chineseTask && chineseCount < standardHours['语文']) {
          subject = '语文';
          teacherId = chineseTask.teacherId;
          teacherName = chineseTask.teacherName;
        } else {
          continue;
        }
        
        if (teacherTimeMap.has(teacherId) && teacherTimeMap.get(teacherId)!.has(timeKey)) {
          continue;
        }
      }
      
      // 安排课程
      slots.push({
        classId: cls.id,
        weekDay: day as WeekDay,
        periodIndex: 1,
        subject,
        teacherId,
        teacherName,
      });
      
      updateMaps(cls.id, teacherId, day, 1, classTimeMap, teacherTimeMap);
      const currentCount = classSubjectCount.get(cls.id)!.get(subject) || 0;
      classSubjectCount.get(cls.id)!.set(subject, currentCount + 1);
      teacherHours.set(teacherId, teacherHours.get(teacherId)! + 1);
    }
  }
  
  // ==================== 第四阶段：填充其他节次 ====================
  // 严格按照标准课时，每班每科排满为止
  
  // 按优先级排序科目：主科优先
  const subjectPriority = ['语文', '数学', '英语', '体育', '科学', '道德与法治', '音乐', '美术', '劳动'];
  
  for (const subject of subjectPriority) {
    for (const cls of classes) {
      const grade = cls.grade || 3;
      const standardHours = getStandardHours(grade);
      const targetHours = standardHours[subject];
      
      if (!targetHours) continue;  // 该年级没有这门课
      
      const currentCount = classSubjectCount.get(cls.id)!.get(subject) || 0;
      const remaining = targetHours - currentCount;
      
      if (remaining <= 0) continue;  // 已排满
      
      // 找能教这门课的教师
      const task = tasks.find(t => t.classId === cls.id && t.subject === subject);
      if (!task) continue;
      
      const teacher = teacherMap.get(task.teacherId);
      if (!teacher) continue;
      
      // 主科年级检查
      const isMainSubject = MAIN_SUBJECTS.includes(subject);
      if (isMainSubject && teacher.mainSubjectGrade !== undefined && grade !== teacher.mainSubjectGrade) {
        continue;  // 主科老师不跨年级
      }
      
      // 为这门课安排 remaining 节课
      let arranged = 0;
      
      // 获取该班级该科目已使用的时段（用于错开）
      const usedPeriods = new Set<number>();
      for (const slot of slots) {
        if (slot.classId === cls.id && slot.subject === subject) {
          usedPeriods.add(slot.periodIndex);
        }
      }
      
      // 时段优先级
      // 主科：只在上午（1,2,3节）
      // 其他：优先上午2,3节，其次下午，最后上午第1节
      const periodPriority = isMainSubject 
        ? [2, 3, 1]  // 主科只在上午
        : [2, 3, 4, 5, 6, 1];  // 其他科目优先上午2,3节
      
      // 第一轮：优先选择未使用过的时段
      for (const periodIndex of periodPriority) {
        if (arranged >= remaining) break;
        if (usedPeriods.has(periodIndex)) continue;  // 时段错开
        
        for (const day of WEEK_DAYS) {
          if (arranged >= remaining) break;
          
          const timeKey = `${day}-${periodIndex}`;
          
          // 检查班级是否已有课
          if (classTimeMap.has(cls.id) && classTimeMap.get(cls.id)!.has(timeKey)) {
            continue;
          }
          
          // 检查教师是否可用
          if (teacherTimeMap.has(task.teacherId) && teacherTimeMap.get(task.teacherId)!.has(timeKey)) {
            continue;
          }
          
          // 主科只在上午
          if (isMainSubject && periodIndex >= 4) {
            continue;
          }
          
          // 非主科：检查当天是否已有该科目
          if (!isMainSubject) {
            const hasSubjectToday = slots.some(s => 
              s.classId === cls.id && s.weekDay === day && s.subject === subject
            );
            if (hasSubjectToday) continue;
          }
          
          // 检查教师课时是否已满
          if (teacherHours.get(task.teacherId)! >= teacher.capacity) {
            continue;
          }
          
          // 安排课程
          slots.push({
            classId: cls.id,
            weekDay: day as WeekDay,
            periodIndex,
            subject,
            teacherId: task.teacherId,
            teacherName: teacher.name,
          });
          
          updateMaps(cls.id, task.teacherId, day, periodIndex, classTimeMap, teacherTimeMap);
          arranged++;
          usedPeriods.add(periodIndex);
        }
      }
      
      // 第二轮：允许重复时段（兜底）
      if (arranged < remaining) {
        for (const periodIndex of periodPriority) {
          if (arranged >= remaining) break;
          
          for (const day of WEEK_DAYS) {
            if (arranged >= remaining) break;
            
            const timeKey = `${day}-${periodIndex}`;
            
            if (classTimeMap.has(cls.id) && classTimeMap.get(cls.id)!.has(timeKey)) {
              continue;
            }
            
            if (teacherTimeMap.has(task.teacherId) && teacherTimeMap.get(task.teacherId)!.has(timeKey)) {
              continue;
            }
            
            if (isMainSubject && periodIndex >= 4) {
              continue;
            }
            
            if (!isMainSubject) {
              const hasSubjectToday = slots.some(s => 
                s.classId === cls.id && s.weekDay === day && s.subject === subject
              );
              if (hasSubjectToday) continue;
            }
            
            if (teacherHours.get(task.teacherId)! >= teacher.capacity) {
              continue;
            }
            
            slots.push({
              classId: cls.id,
              weekDay: day as WeekDay,
              periodIndex,
              subject,
              teacherId: task.teacherId,
              teacherName: teacher.name,
            });
            
            updateMaps(cls.id, task.teacherId, day, periodIndex, classTimeMap, teacherTimeMap);
            arranged++;
          }
        }
      }
      
      // 更新计数
      classSubjectCount.get(cls.id)!.set(subject, currentCount + arranged);
      teacherHours.set(task.teacherId, teacherHours.get(task.teacherId)! + arranged);
      
      if (arranged < remaining) {
        conflicts.push({
          id: `incomplete-${cls.id}-${subject}`,
          type: 'rule_violation',
          description: `班级 ${cls.name} 的 ${subject} 课时不足，已排 ${arranged} 节，还需 ${remaining - arranged} 节`,
          relatedSlots: [],
          severity: 'warning',
          suggestions: ['增加教师资源', '调整教师课时上限'],
        });
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
  
  // 统计信息
  const totalNeeded = classes.reduce((sum, cls) => {
    const grade = cls.grade || 3;
    const standardHours = getStandardHours(grade);
    return sum + Object.values(standardHours).reduce((a, b) => a + b, 0);
  }, 0);
  
  const totalArranged = finalSlots.length;
  
  return {
    success: conflicts.filter(c => c.severity === 'error').length === 0,
    slots: finalSlots,
    conflicts,
    adjustments: [],
    unfilledSlots: [],
    statistics: {
      totalSlots: totalNeeded,
      arrangedSlots: totalArranged,
      conflictCount: conflicts.length,
      coverageRate: totalNeeded > 0 ? totalArranged / totalNeeded : 1,
    },
    duration: Date.now() - startTime,
  };
}

// ==================== 辅助函数 ====================

function updateMaps(
  classId: string,
  teacherId: string,
  weekDay: number,
  periodIndex: number,
  classTimeMap: Map<string, Set<string>>,
  teacherTimeMap: Map<string, Set<string>>
) {
  const timeKey = `${weekDay}-${periodIndex}`;
  
  if (!classTimeMap.has(classId)) {
    classTimeMap.set(classId, new Set());
  }
  classTimeMap.get(classId)!.add(timeKey);
  
  if (!teacherTimeMap.has(teacherId)) {
    teacherTimeMap.set(teacherId, new Set());
  }
  teacherTimeMap.get(teacherId)!.add(timeKey);
}

// ==================== 导出辅助函数 ====================

export function getClassSchedule(slots: ScheduleSlot[], classId: string): ScheduleSlot[] {
  return slots.filter(s => s.classId === classId);
}

export function getTeacherSchedule(slots: ScheduleSlot[], teacherId: string): ScheduleSlot[] {
  return slots.filter(s => s.teacherId === teacherId);
}

// 计算班级各科目课时
export function calculateClassSubjectHours(slots: ScheduleSlot[], classId: string): Record<string, number> {
  const result: Record<string, number> = {};
  const classSlots = slots.filter(s => s.classId === classId);
  for (const slot of classSlots) {
    result[slot.subject] = (result[slot.subject] || 0) + 1;
  }
  return result;
}

// 计算教师周课时
export function calculateTeacherWeeklyHours(slots: ScheduleSlot[], teacherId: string): number {
  return slots.filter(s => s.teacherId === teacherId).length;
}

export function formatScheduleAsTable(
  slots: ScheduleSlot[],
  periods: PeriodConfig[],
  weekDays: WeekDay[]
): Record<number, Record<number, ScheduleSlot | null>> {
  const table: Record<number, Record<number, ScheduleSlot | null>> = {};
  
  for (const period of periods) {
    table[period.index] = {};
    for (const day of weekDays) {
      const slot = slots.find(s => s.weekDay === day && s.periodIndex === period.index);
      table[period.index][day] = slot || null;
    }
  }
  
  return table;
}
