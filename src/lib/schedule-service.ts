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

/**
 * 上午节次配置（统一3节）
 */
export const MORNING_PERIODS: PeriodConfig[] = [
  { id: 'p1', index: 1, name: '第一节', startTime: '08:00', endTime: '08:40', type: 'morning', isActive: true },
  { id: 'p2', index: 2, name: '第二节', startTime: '08:50', endTime: '09:30', type: 'morning', isActive: true },
  { id: 'p3', index: 3, name: '第三节', startTime: '10:00', endTime: '10:40', type: 'morning', isActive: true },
];

/**
 * 下午节次配置（低年级2节）
 */
export const AFTERNOON_PERIODS_LOW: PeriodConfig[] = [
  { id: 'p4', index: 4, name: '第四节', startTime: '14:00', endTime: '14:40', type: 'afternoon', isActive: true },
  { id: 'p5', index: 5, name: '第五节', startTime: '14:50', endTime: '15:30', type: 'afternoon', isActive: true },
];

/**
 * 下午节次配置（中高年级3节）
 */
export const AFTERNOON_PERIODS_HIGH: PeriodConfig[] = [
  { id: 'p4', index: 4, name: '第四节', startTime: '14:00', endTime: '14:40', type: 'afternoon', isActive: true },
  { id: 'p5', index: 5, name: '第五节', startTime: '14:50', endTime: '15:30', type: 'afternoon', isActive: true },
  { id: 'p6', index: 6, name: '第六节', startTime: '15:40', endTime: '16:20', type: 'afternoon', isActive: true },
];

/**
 * 默认节次配置（兼容旧代码，使用中高年级配置）
 */
export const DEFAULT_PERIODS: PeriodConfig[] = [
  ...MORNING_PERIODS,
  ...AFTERNOON_PERIODS_HIGH,
];

/**
 * 根据年级获取节次配置
 * - 低年级（1-2年级）：上午3节 + 下午2节 = 5节/天
 * - 中高年级（3-6年级）：上午3节 + 下午3节 = 6节/天
 */
export function getPeriodsByGrade(grade: number): PeriodConfig[] {
  const isLowerGrade = grade <= 2;
  return [
    ...MORNING_PERIODS,
    ...(isLowerGrade ? AFTERNOON_PERIODS_LOW : AFTERNOON_PERIODS_HIGH),
  ];
}

/**
 * 获取每天总课时数
 */
export function getTotalPeriodsPerDay(grade: number): number {
  return grade <= 2 ? 5 : 6;
}

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
 * 
 * 特殊规则：避免第一节全是语文，语文数学交替
 */
export function generateSchedule(context: SchedulingContext): ScheduleResult {
  const startTime = Date.now();
  const { tasks, existingSlots, rules, periods, weekDays, semester, classes, teachers } = context;
  
  const newSlots: ScheduleSlot[] = [...existingSlots];
  const conflicts: ScheduleConflict[] = [];
  
  // ===== 第一步：预处理，确保第一节语文数学均衡 =====
  // 统计每个班级的语文和数学任务
  const chineseTasks = tasks.filter(t => t.subject === '语文');
  const mathTasks = tasks.filter(t => t.subject === '数学');
  
  // 先为每个班级的第一节课程分配语文和数学
  // 使用轮换策略：班级1周一第一节语文、班级2周一第一节数学...
  const classList = classes.filter(c => c.id);
  const dayList = weekDays;
  
  // 为每天的第一节做均衡分配
  for (const day of dayList) {
    let period1ChineseCount = 0;
    let period1MathCount = 0;
    
    // 按班级轮换分配第一节
    for (let i = 0; i < classList.length; i++) {
      const cls = classList[i];
      const grade = cls.grade || 3;
      const effectivePeriods = getPeriodsByGrade(grade);
      
      // 检查第一节是否已安排
      const existingSlot = newSlots.find(
        s => s.classId === cls.id && s.weekDay === day && s.periodIndex === 1
      );
      if (existingSlot) continue;
      
      // 决定第一节排语文还是数学
      // 轮换策略：奇数班级语文，偶数班级数学，但要根据当前统计调整
      let preferChinese = i % 2 === 0;
      
      // 如果语文已经比数学多，优先排数学
      if (period1ChineseCount > period1MathCount) {
        preferChinese = false;
      } else if (period1MathCount > period1ChineseCount) {
        preferChinese = true;
      }
      
      // 找到对应的任务
      const chineseTask = chineseTasks.find(t => 
        t.classId === cls.id && 
        t.weeklyHours > t.arrangedHours
      );
      const mathTask = mathTasks.find(t => 
        t.classId === cls.id && 
        t.weeklyHours > t.arrangedHours
      );
      
      let selectedTask = preferChinese ? chineseTask : mathTask;
      
      // 如果优先的任务不存在，用另一个
      if (!selectedTask || selectedTask.weeklyHours <= selectedTask.arrangedHours) {
        selectedTask = preferChinese ? mathTask : chineseTask;
      }
      
      if (!selectedTask || selectedTask.weeklyHours <= selectedTask.arrangedHours) continue;
      
      // 检查教师是否可用
      const teacherConflict = newSlots.find(
        s => s.teacherId === selectedTask!.teacherId && 
             s.weekDay === day && 
             s.periodIndex === 1
      );
      if (teacherConflict) {
        // 教师冲突，尝试另一个任务
        selectedTask = preferChinese ? mathTask : chineseTask;
        if (!selectedTask || selectedTask.weeklyHours <= selectedTask.arrangedHours) continue;
        
        const teacherConflict2 = newSlots.find(
          s => s.teacherId === selectedTask!.teacherId && 
               s.weekDay === day && 
               s.periodIndex === 1
        );
        if (teacherConflict2) continue;
      }
      
      // 创建课表槽
      const slot: ScheduleSlot = {
        id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        classId: selectedTask.classId,
        className: selectedTask.className,
        grade: selectedTask.grade,
        weekDay: day,
        periodIndex: 1,
        semester,
        courseName: selectedTask.subject,
        subject: selectedTask.subject,
        courseType: 'normal',
        teacherId: selectedTask.teacherId,
        teacherName: selectedTask.teacherName,
        status: 'normal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      newSlots.push(slot);
      selectedTask.arrangedHours++;
      
      if (selectedTask.subject === '语文') {
        period1ChineseCount++;
      } else {
        period1MathCount++;
      }
    }
  }
  
  // ===== 第二步：按优先级排序剩余教学任务 =====
  const sortedTasks = sortTasksByPriority(tasks, classes, teachers);
  
  // ===== 第三步：为剩余教学任务分配时间槽 =====
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
 * 
 * 额外规则：语文数学交替排列，避免语文全部排在第一节
 */
function sortTasksByPriority(
  tasks: TeachingTask[], 
  classes: Array<{ id: string; headTeacherId?: string; subjectHeadId?: string }>,
  teachers: Array<{ id: string; primarySubject?: string }>
): TeachingTask[] {
  // 先按班级分组，确保同一班级的语文数学交替排列
  const tasksByClass = new Map<string, TeachingTask[]>();
  for (const task of tasks) {
    const classTasks = tasksByClass.get(task.classId) || [];
    classTasks.push(task);
    tasksByClass.set(task.classId, classTasks);
  }
  
  // 对每个班级的任务进行排序，让语文数学交替
  const alternatedTasks: TeachingTask[] = [];
  for (const [, classTasks] of tasksByClass) {
    // 分离语文、数学和其他科目
    const chinese = classTasks.filter(t => t.subject === '语文');
    const math = classTasks.filter(t => t.subject === '数学');
    const others = classTasks.filter(t => t.subject !== '语文' && t.subject !== '数学');
    
    // 交替排列语文和数学
    const maxLen = Math.max(chinese.length, math.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < chinese.length) alternatedTasks.push(chinese[i]);
      if (i < math.length) alternatedTasks.push(math[i]);
    }
    // 添加其他科目
    alternatedTasks.push(...others);
  }
  
  // 最后按优先级排序，但保持语文数学交替的趋势
  return alternatedTasks.sort((a, b) => {
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
    
    // 主科优先，但语文数学之间交替（不区分优先级）
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
 * 根据班级年级动态获取节次配置
 */
function findBestSlot(
  task: TeachingTask,
  existingSlots: ScheduleSlot[],
  rules: ScheduleRule[],
  periods: PeriodConfig[], // 保留参数兼容，但会根据年级覆盖
  weekDays: WeekDay[],
  semester: string,
  classes: Array<{ id: string; headTeacherId?: string; subjectHeadId?: string; grade?: number }>,
  teachers: Array<{ id: string; primarySubject?: string }>
): ScheduleSlot | null {
  // 判断优先级类型
  const cls = classes.find(c => c.id === task.classId);
  const teacher = teachers.find(t => t.id === task.teacherId);
  
  // 根据班级年级获取正确的节次配置
  const grade = cls?.grade || task.grade || 3; // 默认使用中高年级配置
  const effectivePeriods = getPeriodsByGrade(grade);
  
  const isHeadTeacher = cls?.headTeacherId === task.teacherId;
  const isSubjectHead = cls?.subjectHeadId === task.teacherId;
  const isMainSubject = MAIN_SUBJECTS.includes(task.subject as any);
  const primarySubject = teacher?.primarySubject || '';
  const isPrioritySecondary = PRIORITY_SECONDARY_SUBJECTS[primarySubject]?.includes(task.subject);
  
  // 生成所有可能的时间槽候选
  const candidates: Array<{ weekDay: WeekDay; periodIndex: number; score: number }> = [];
  
  for (const weekDay of weekDays) {
    for (const period of effectivePeriods) {
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
 * 4. 主科尽量安排在上午（前3节）
 * 5. 避免"第一节全是语文"，语文数学要轮换
 * 6. 班主任/科任的本班课程优先安排
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
  
  // 主科尽量安排在上午（前3节）
  if (isMainSubject && periodIndex > 3) {
    score -= 15; // 下午扣15分
  }
  
  // 3. 语文数学轮换检查（重要！避免第一节全是语文）
  
  // 检查该班级当天该节次前后的科目
  const classDaySlots = existingSlots.filter(
    s => s.classId === task.classId && s.weekDay === weekDay
  ).sort((a, b) => a.periodIndex - b.periodIndex);
  
  // 检查前一节是否是同科目（避免连续两节相同主科）
  const prevSlot = classDaySlots.find(s => s.periodIndex === periodIndex - 1);
  if (prevSlot && prevSlot.subject === task.subject && isMainSubject) {
    score -= 30; // 连续两节相同主科，大幅扣分
  }
  
  // 检查后一节是否是同科目
  const nextSlot = classDaySlots.find(s => s.periodIndex === periodIndex + 1);
  if (nextSlot && nextSlot.subject === task.subject && isMainSubject) {
    score -= 30; // 连续两节相同主科，大幅扣分
  }
  
  // 4. 全局科目分布均衡（避免全校第一节全是语文）
  
  // 检查全校该节次该科目的数量
  const globalSamePeriodSubject = existingSlots.filter(
    s => s.weekDay === weekDay && s.periodIndex === periodIndex && s.subject === task.subject
  );
  
  // 第一节特殊处理：严格控制语文数学均衡
  if (periodIndex === 1) {
    const chineseCount = existingSlots.filter(
      s => s.weekDay === weekDay && s.periodIndex === 1 && s.subject === '语文'
    ).length;
    const mathCount = existingSlots.filter(
      s => s.weekDay === weekDay && s.periodIndex === 1 && s.subject === '数学'
    ).length;
    
    // 如果当前是语文课，且语文已经比数学多2节以上，大幅扣分
    if (task.subject === '语文' && chineseCount >= mathCount + 2) {
      score -= 50; // 大幅扣分，强制分散
    }
    // 如果当前是数学课，且语文比数学多，加分鼓励
    else if (task.subject === '数学' && chineseCount > mathCount) {
      score += 25; // 鼓励数学排第一节
    }
    // 反之亦然
    else if (task.subject === '数学' && mathCount >= chineseCount + 2) {
      score -= 50;
    }
    else if (task.subject === '语文' && mathCount > chineseCount) {
      score += 25;
    }
  }
  
  // 如果该节次该科目已经很多了，扣分
  if (globalSamePeriodSubject.length >= 10) {
    score -= 20; // 该节次该科目太多，扣分
  } else if (globalSamePeriodSubject.length >= 5) {
    score -= 10;
  }
  
  // 语文数学交替：如果该节次已有较多语文，数学加分；反之亦然
  const chineseCount = existingSlots.filter(
    s => s.weekDay === weekDay && s.periodIndex === periodIndex && s.subject === '语文'
  ).length;
  const mathCount = existingSlots.filter(
    s => s.weekDay === weekDay && s.periodIndex === periodIndex && s.subject === '数学'
  ).length;
  
  if (task.subject === '数学' && chineseCount > mathCount + 2) {
    score += 15; // 语文太多，数学加分
  } else if (task.subject === '语文' && mathCount > chineseCount + 2) {
    score += 15; // 数学太多，语文加分
  }
  
  // 5. 加分项
  
  // 班主任/科任的本班课程加分
  if (isHeadTeacher || isSubjectHead) {
    score += 10; // 班主任/科任教本班的课，优先安排
  }
  
  // 6. 课程分布优化
  
  // 检查该科目在该班级本周已有课时
  const subjectSlots = existingSlots.filter(
    s => s.classId === task.classId && s.subject === task.subject
  );
  
  // 同一科目尽量不在同一天连着排
  const sameDaySubjectSlots = subjectSlots.filter(s => s.weekDay === weekDay);
  if (sameDaySubjectSlots.length >= 2) {
    score -= 25; // 同一天已有多节同科目，扣分
  } else if (sameDaySubjectSlots.length >= 1) {
    score -= 10; // 同一天已有1节同科目，轻微扣分
  }
  
  // 同一科目尽量分散在不同天
  const subjectDays = new Set(subjectSlots.map(s => s.weekDay));
  if (!subjectDays.has(weekDay)) {
    score += 8; // 该科目还没排在今天，加分
  }
  
  // 7. 节次偏好（上午前两节适合主科，第三节适合英语/科学等）
  if (periodIndex === 1 || periodIndex === 2) {
    // 第一节和第二节
    if (task.subject === '语文' || task.subject === '数学') {
      score += 5; // 主科适合前两节
    }
  } else if (periodIndex === 3) {
    // 第三节
    if (task.subject === '英语' || task.subject === '科学') {
      score += 5;
    }
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
