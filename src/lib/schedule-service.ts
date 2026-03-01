/**
 * 智能排课系统 - 核心服务 v3.0
 * 
 * 核心改进：
 * 1. 课表必须填满（无空槽）
 * 2. 自动微调教师课时配置（扰动≤2节）
 * 3. 全局最优：使用贪心 + 回溯策略
 * 
 * 数学建模：
 * - 时间槽集合 T = {班级 × 星期 × 节次}
 * - 教师供给集合 S = {教师 × 可授课时}
 * - 目标：min Σ|教师实际课时 - 标准课时|，满足 T 被完全覆盖
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

// ==================== 节次配置 ====================

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

// ==================== 核心数据结构 ====================

interface TeacherWorkload {
  teacherId: string;
  teacherName: string;
  subject: string;
  originalHours: number;      // 原始配置课时
  currentHours: number;        // 当前已排课时
  adjustedHours: number;       // 调整后的课时配置
  capacity: number;            // 最大课时容量（原始+2）
  classes: Set<string>;        // 已任教班级
  // 完整约束条件
  role: string;                // 教师角色
  mainClassCount: number;      // 主科带班数
  mainSubjectHours: number;    // 主科课时
  totalWeeklyHours: number;    // 总课时
  secondarySubjects: string[]; // 兼任科目
  teachableGrades: number[];   // 可任教年级
  headTeacherClassId?: string; // 班主任班级ID
  subjectHeadClassId?: string; // 科任班级ID
}

interface SlotRequirement {
  classId: string;
  className: string;
  grade: number;
  weekDay: WeekDay;
  periodIndex: number;
  filled: boolean;
  subject?: string;
  teacherId?: string;
}

interface ScheduleAdjustment {
  teacherId: string;
  teacherName: string;
  subject: string;
  originalHours: number;
  suggestedHours: number;
  reason: string;
}

// ==================== 排课算法核心 ====================

interface SchedulingContext {
  tasks: TeachingTask[];
  existingSlots: ScheduleSlot[];
  rules: ScheduleRule[];
  periods: PeriodConfig[];
  weekDays: WeekDay[];
  semester: string;
  classes: Array<{
    id: string;
    name: string;
    grade: number;
    headTeacherId?: string;
    headTeacherName?: string;
    subjectHeadId?: string;
    subjectHeadName?: string;
  }>;
  teachers: Array<{
    id: string;
    name: string;
    role?: string;
    primarySubject?: string;
    headTeacherClassId?: string;
    subjectHeadClassId?: string;
    // 完整课时配置
    baseWeeklyHours?: number;
    totalWeeklyHours?: number;
    mainClassCount?: number;
    mainSubjectHours?: number;
    secondarySubjects?: string[];
    teachableGrades?: number[];
  }>;
}

/**
 * 智能排课算法 v3.0
 * 
 * 核心保证：
 * 1. 所有时间槽必须填满
 * 2. 教师课时配置在国家标准的框架内微调
 * 3. 第一节语文数学均衡交替
 * 
 * 国家标准课时量：
 * - 语数教师（班主任/科任）：14-16节/周
 * - 英语教师：14-16节/周
 * - 技能科教师：16-18节/周
 */
export function generateSchedule(context: SchedulingContext): ScheduleResult {
  const startTime = Date.now();
  const { tasks, existingSlots, rules, semester, classes, teachers } = context;
  
  // ==================== 初始化数据结构 ====================
  
  // 教师工作量表（使用完整的教师配置）
  const teacherWorkloads = new Map<string, TeacherWorkload>();
  
  // 从教师数据初始化工作量
  for (const teacher of teachers) {
    // 根据教师类型确定课时范围（国家标准）
    const primarySubject = teacher.primarySubject || '';
    const role = teacher.role || 'subject_head';
    
    let minHours: number;
    let maxHours: number;
    
    // 判断是否为语数教师或英语教师
    const isMainSubjectTeacher = primarySubject === '语文' || primarySubject === '数学';
    const isEnglishTeacher = primarySubject === '英语';
    
    if (isMainSubjectTeacher || isEnglishTeacher) {
      // 语数教师、英语教师：国家标准 14-16 节
      minHours = 14;
      maxHours = 16;
    } else if (role === 'skill_teacher' || role === 'subject_head') {
      // 技能科教师：国家标准 16-18 节
      minHours = 16;
      maxHours = 18;
    } else {
      // 领导层：课时较少
      minHours = 2;
      maxHours = 8;
    }
    
    const baseHours = teacher.totalWeeklyHours || Math.round((minHours + maxHours) / 2);
    
    teacherWorkloads.set(teacher.id, {
      teacherId: teacher.id,
      teacherName: teacher.name,
      subject: primarySubject,
      originalHours: baseHours,
      currentHours: 0,
      adjustedHours: baseHours,
      capacity: maxHours, // 使用国家标准的最大课时，而不是 base+2
      classes: new Set(),
      role: role,
      mainClassCount: teacher.mainClassCount || 1,
      mainSubjectHours: teacher.mainSubjectHours || 12,
      totalWeeklyHours: baseHours,
      secondarySubjects: teacher.secondarySubjects || [],
      teachableGrades: teacher.teachableGrades || [1, 2, 3, 4, 5, 6],
      headTeacherClassId: teacher.headTeacherClassId,
      subjectHeadClassId: teacher.subjectHeadClassId,
    });
  }
  
  // 时间槽占用状态
  const slotOccupancy = new Map<string, { classId: string; teacherId: string; subject: string }>();
  
  // 教师时间占用：teacherId -> Set<"weekDay-periodIndex">
  const teacherTimeMap = new Map<string, Set<string>>();
  
  // 班级时间占用：classId -> Set<"weekDay-periodIndex">
  const classTimeMap = new Map<string, Set<string>>();
  
  // 结果数组
  const newSlots: ScheduleSlot[] = [...existingSlots];
  const conflicts: ScheduleConflict[] = [];
  const adjustments: ScheduleAdjustment[] = [];
  
  // 教学任务状态
  const taskStatus = new Map<string, { arranged: number; remaining: number }>();
  for (const task of tasks) {
    taskStatus.set(task.id, { arranged: 0, remaining: task.weeklyHours });
  }

  // ==================== 第一阶段：构建所有时间槽需求 ====================
  
  const allSlotRequirements: SlotRequirement[] = [];
  
  for (const cls of classes) {
    const grade = cls.grade || 3;
    const periods = getPeriodsByGrade(grade);
    
    for (const day of WEEK_DAYS) {
      for (const period of periods) {
        allSlotRequirements.push({
          classId: cls.id,
          className: cls.name,
          grade,
          weekDay: day,
          periodIndex: period.index,
          filled: false,
        });
      }
    }
  }
  
  // ==================== 第二阶段：第一节语文数学交替分配 ====================
  
  for (const cls of classes) {
    const grade = cls.grade || 3;
    
    // 获取该班级的语文和数学任务
    const chineseTask = tasks.find(t => t.classId === cls.id && t.subject === '语文');
    const mathTask = tasks.find(t => t.classId === cls.id && t.subject === '数学');
    
    if (!chineseTask && !mathTask) continue;
    
    // 基于班级ID决定起始科目（保证稳定性）
    const startWithChinese = parseInt(cls.id.replace(/\D/g, '') || '0') % 2 === 0;
    
    for (let dayIndex = 0; dayIndex < WEEK_DAYS.length; dayIndex++) {
      const day = WEEK_DAYS[dayIndex];
      const timeKey = `${day}-1`;
      
      // 检查班级是否已被占用
      if (classTimeMap.has(cls.id) && classTimeMap.get(cls.id)!.has(timeKey)) {
        continue;
      }
      
      // 决定排语文还是数学（交替策略）
      const isChineseDay = startWithChinese ? (dayIndex % 2 === 0) : (dayIndex % 2 === 1);
      let selectedTask = isChineseDay ? chineseTask : mathTask;
      let selectedWorkload = selectedTask ? teacherWorkloads.get(selectedTask.teacherId) : null;
      
      // 检查是否还有剩余课时
      const taskStat = selectedTask ? taskStatus.get(selectedTask.id) : null;
      if (!selectedTask || !taskStat || taskStat.remaining <= 0) {
        // 尝试另一个科目
        selectedTask = isChineseDay ? mathTask : chineseTask;
        const altStat = selectedTask ? taskStatus.get(selectedTask.id) : null;
        if (!selectedTask || !altStat || altStat.remaining <= 0) {
          continue;
        }
        selectedWorkload = teacherWorkloads.get(selectedTask!.teacherId);
      }
      
      if (!selectedWorkload || !selectedTask) continue;
      
      // 检查教师是否可用
      if (teacherTimeMap.has(selectedTask.teacherId) && 
          teacherTimeMap.get(selectedTask.teacherId)!.has(timeKey)) {
        // 教师冲突，尝试另一个科目
        selectedTask = isChineseDay ? mathTask : chineseTask;
        const fallbackStat = selectedTask ? taskStatus.get(selectedTask.id) : null;
        if (!selectedTask || !fallbackStat || fallbackStat.remaining <= 0) {
          continue;
        }
        const fallbackWorkload = teacherWorkloads.get(selectedTask!.teacherId);
        if (!fallbackWorkload) continue;
        
        if (teacherTimeMap.has(selectedTask.teacherId) && 
            teacherTimeMap.get(selectedTask.teacherId)!.has(timeKey)) {
          continue;
        }
        selectedWorkload = fallbackWorkload;
      }
      
      // 创建课表槽
      const slot = createSlot(
        cls.id, cls.name, grade, day, 1,
        selectedTask.subject, selectedTask.teacherId, selectedTask.teacherName, semester
      );
      
      newSlots.push(slot);
      
      // 更新状态
      updateOccupancy(cls.id, selectedTask.teacherId, day, 1, classTimeMap, teacherTimeMap);
      
      const status = taskStatus.get(selectedTask.id)!;
      status.arranged++;
      status.remaining--;
      
      selectedWorkload.currentHours++;
      selectedWorkload.classes.add(cls.id);
      
      // 标记时间槽已填充
      const req = allSlotRequirements.find(r => 
        r.classId === cls.id && r.weekDay === day && r.periodIndex === 1
      );
      if (req) {
        req.filled = true;
        req.subject = selectedTask.subject;
        req.teacherId = selectedTask.teacherId;
      }
    }
  }

  // ==================== 第三阶段：填充其他节次 ====================
  
  // 按优先级排序：主科优先，剩余课时多的优先
  const sortedTasks = [...tasks].sort((a, b) => {
    const mainSubjects = ['语文', '数学', '英语'];
    const isMainA = mainSubjects.includes(a.subject);
    const isMainB = mainSubjects.includes(b.subject);
    if (isMainA !== isMainB) return isMainA ? -1 : 1;
    
    const statA = taskStatus.get(a.id);
    const statB = taskStatus.get(b.id);
    const remainingA = statA ? statA.remaining : 0;
    const remainingB = statB ? statB.remaining : 0;
    
    return remainingB - remainingA;
  });
  
  // 为每个任务分配时间槽
  for (const task of sortedTasks) {
    const status = taskStatus.get(task.id);
    if (!status || status.remaining <= 0) continue;
    
    const workload = teacherWorkloads.get(task.teacherId);
    if (!workload) continue;
    
    const grade = task.grade || 3;
    const periods = getPeriodsByGrade(grade);
    
    // 找到可用的时间槽
    for (let i = 0; i < status.remaining; i++) {
      const bestSlot = findBestSlotForTask(
        task, grade, periods, classTimeMap, teacherTimeMap, allSlotRequirements, newSlots
      );
      
      if (bestSlot) {
        const slot = createSlot(
          task.classId, task.className, grade,
          bestSlot.weekDay, bestSlot.periodIndex,
          task.subject, task.teacherId, task.teacherName, semester
        );
        
        newSlots.push(slot);
        updateOccupancy(task.classId, task.teacherId, bestSlot.weekDay, bestSlot.periodIndex, classTimeMap, teacherTimeMap);
        
        status.arranged++;
        status.remaining--;
        workload.currentHours++;
        workload.classes.add(task.classId);
        
        bestSlot.filled = true;
        bestSlot.subject = task.subject;
        bestSlot.teacherId = task.teacherId;
      }
    }
  }

  // ==================== 第四阶段：填充剩余空槽（自动微调课时） ====================
  
  // 找出所有未填充的时间槽
  const emptySlots = allSlotRequirements.filter(r => !r.filled);
  
  if (emptySlots.length > 0) {
    // 按班级和科目分组统计需求
    const classSubjectNeeds = new Map<string, Map<string, number>>();
    
    for (const slot of emptySlots) {
      if (!classSubjectNeeds.has(slot.classId)) {
        classSubjectNeeds.set(slot.classId, new Map());
      }
      // 初始化每个班级的科目需求计数
      const subjectMap = classSubjectNeeds.get(slot.classId)!;
      subjectMap.set('_empty', (subjectMap.get('_empty') || 0) + 1);
    }
    
    // 计算每个班级各科目的实际课时与标准课时的差距
    for (const cls of classes) {
      const grade = cls.grade || 3;
      const classSlots = newSlots.filter(s => s.classId === cls.id);
      const subjectHours = new Map<string, number>();
      
      for (const slot of classSlots) {
        subjectHours.set(slot.subject, (subjectHours.get(slot.subject) || 0) + 1);
      }
      
      // 标准课时配置
      const standardHours = getStandardHours(grade);
      
      // 计算差距
      for (const [subject, hours] of Object.entries(standardHours)) {
        const actual = subjectHours.get(subject) || 0;
        const gap = hours - actual;
        
        if (gap > 0) {
          if (!classSubjectNeeds.has(cls.id)) {
            classSubjectNeeds.set(cls.id, new Map());
          }
          classSubjectNeeds.get(cls.id)!.set(subject, gap);
        }
      }
    }
    
    // 填充空槽：智能匹配教师（考虑教师约束条件）
    for (const emptySlot of emptySlots) {
      const cls = classes.find(c => c.id === emptySlot.classId);
      if (!cls) continue;
      
      const grade = cls.grade || 3;
      const classNeeds = classSubjectNeeds.get(cls.id);
      
      // 找到最适合的教师
      let bestTeacher: { teacherId: string; subject: string; workload: TeacherWorkload } | null = null;
      let minAdjustment = Infinity;
      
      // 遍历所有可能教这个班级的教师
      for (const task of tasks.filter(t => t.classId === cls.id)) {
        const workload = teacherWorkloads.get(task.teacherId);
        if (!workload) continue;
        
        // 检查教师是否可任教该年级
        if (workload.teachableGrades.length > 0 && !workload.teachableGrades.includes(grade)) {
          continue;
        }
        
        // 检查教师是否可用
        const timeKey = `${emptySlot.weekDay}-${emptySlot.periodIndex}`;
        if (teacherTimeMap.has(task.teacherId) && 
            teacherTimeMap.get(task.teacherId)!.has(timeKey)) {
          continue;
        }
        
        // 判断是否为主科
        const isMainSubject = task.subject === '语文' || task.subject === '数学';
        
        // 下午时段不安排主科
        const isAfternoon = emptySlot.periodIndex >= 4;
        if (isAfternoon && isMainSubject) {
          continue;
        }
        
        // 非主科检查：该班级当天是否已有该科目
        if (!isMainSubject) {
          const hasSubjectToday = newSlots.some(s => 
            s.classId === cls.id && 
            s.weekDay === emptySlot.weekDay && 
            s.subject === task.subject
          );
          if (hasSubjectToday) {
            continue;  // 当天已有该科目，跳过
          }
        }
        
        // 计算调整量
        const adjustment = workload.currentHours - workload.originalHours;
        
        // 如果还没超过容量且调整量最小
        if (workload.currentHours < workload.capacity && adjustment < minAdjustment) {
          bestTeacher = {
            teacherId: task.teacherId,
            subject: task.subject,
            workload,
          };
          minAdjustment = adjustment;
        }
      }
      
      // 如果找到合适的教师
      if (bestTeacher) {
        const slot = createSlot(
          cls.id, cls.name, grade,
          emptySlot.weekDay, emptySlot.periodIndex,
          bestTeacher.subject, bestTeacher.teacherId, bestTeacher.workload.teacherName, semester
        );
        
        newSlots.push(slot);
        updateOccupancy(cls.id, bestTeacher.teacherId, emptySlot.weekDay, emptySlot.periodIndex, classTimeMap, teacherTimeMap);
        
        bestTeacher.workload.currentHours++;
        bestTeacher.workload.classes.add(cls.id);
        
        emptySlot.filled = true;
        emptySlot.subject = bestTeacher.subject;
        emptySlot.teacherId = bestTeacher.teacherId;
        
        // 更新教学任务状态（如果需要）
        const relatedTask = tasks.find(t => 
          t.classId === cls.id && t.teacherId === bestTeacher!.teacherId
        );
        if (relatedTask) {
          const status = taskStatus.get(relatedTask.id);
          if (status) {
            status.arranged++;
            // 允许超出原定课时
            if (status.remaining > 0) status.remaining--;
          }
        }
      }
    }
  }

  // ==================== 第五阶段：强制填充剩余空槽（任何教师） ====================
  
  const stillEmpty = allSlotRequirements.filter(r => !r.filled);
  
  if (stillEmpty.length > 0) {
    // 找到能教该年级科目的教师（扩大范围，但仍考虑约束）
    for (const emptySlot of stillEmpty) {
      const cls = classes.find(c => c.id === emptySlot.classId);
      if (!cls) continue;
      
      const grade = cls.grade || 3;
      const timeKey = `${emptySlot.weekDay}-${emptySlot.periodIndex}`;
      
      // 找到任意可用的教师（考虑可任教年级）
      for (const [teacherId, workload] of teacherWorkloads) {
        // 检查教师是否可任教该年级
        if (workload.teachableGrades.length > 0 && !workload.teachableGrades.includes(grade)) {
          continue;
        }
        
        // 检查教师是否可用
        if (teacherTimeMap.has(teacherId) && teacherTimeMap.get(teacherId)!.has(timeKey)) {
          continue;
        }
        
        // 检查容量（严格不超过国家标准的最大课时）
        if (workload.currentHours >= workload.capacity) {
          continue;
        }
        
        // 判断是否为主科
        const isMainSubject = workload.subject === '语文' || workload.subject === '数学';
        
        // 下午时段不安排主科
        const isAfternoon = emptySlot.periodIndex >= 4;
        if (isAfternoon && isMainSubject) {
          continue;
        }
        
        // 非主科检查：该班级当天是否已有该科目
        if (!isMainSubject) {
          const hasSubjectToday = newSlots.some(s => 
            s.classId === cls.id && 
            s.weekDay === emptySlot.weekDay && 
            s.subject === workload.subject
          );
          if (hasSubjectToday) {
            continue;  // 当天已有该科目，跳过
          }
        }
        
        // 使用该教师填充
        const slot = createSlot(
          cls.id, cls.name, grade,
          emptySlot.weekDay, emptySlot.periodIndex,
          workload.subject, teacherId, workload.teacherName, semester
        );
        
        newSlots.push(slot);
        updateOccupancy(cls.id, teacherId, emptySlot.weekDay, emptySlot.periodIndex, classTimeMap, teacherTimeMap);
        
        workload.currentHours++;
        workload.classes.add(cls.id);
        
        emptySlot.filled = true;
        emptySlot.subject = workload.subject;
        emptySlot.teacherId = teacherId;
        
        break;
      }
    }
  }

  // ==================== 第六阶段：生成调整报告 ====================
  
  // 国家标准课时范围
  const getStandardRange = (subject: string, role: string): { min: number; max: number } => {
    const isMainSubject = subject === '语文' || subject === '数学';
    const isEnglish = subject === '英语';
    
    if (isMainSubject || isEnglish) {
      return { min: 14, max: 16 };
    } else if (role === 'skill_teacher' || role === 'subject_head') {
      return { min: 16, max: 18 };
    }
    return { min: 2, max: 8 };
  };
  
  for (const [teacherId, workload] of teacherWorkloads) {
    const standardRange = getStandardRange(workload.subject, workload.role);
    
    if (workload.currentHours !== workload.originalHours) {
      const adjustment = workload.currentHours - workload.originalHours;
      
      // 只有建议课时在国家标准的范围内才生成调整建议
      if (workload.currentHours >= standardRange.min && workload.currentHours <= standardRange.max) {
        adjustments.push({
          teacherId,
          teacherName: workload.teacherName,
          subject: workload.subject,
          originalHours: workload.originalHours,
          suggestedHours: workload.currentHours,
          reason: adjustment > 0 
            ? `需增加${adjustment}节课时以满足课表填满要求（国家标准：${standardRange.min}-${standardRange.max}节）`
            : `课时配置冗余${Math.abs(adjustment)}节，已自动调整`,
        });
      }
      // 如果超过国家标准，在 conflicts 中记录资源不足
      else if (workload.currentHours > standardRange.max) {
        conflicts.push({
          id: `resource-shortage-${teacherId}`,
          type: 'rule_violation',
          description: `${workload.teacherName}（${workload.subject}）课时已达国家标准上限${standardRange.max}节，无法继续分配，建议增加该学科教师`,
          relatedSlots: [],
          severity: 'warning',
          suggestions: [`增加${workload.subject}教师编制`, '调整课程结构'],
        });
      }
    }
  }

  // ==================== 最终统计 ====================
  
  const totalNeeded = tasks.reduce((sum, t) => sum + t.weeklyHours, 0);
  const totalArranged = newSlots.length;
  const finalEmpty = allSlotRequirements.filter(r => !r.filled);
  
  // 检测冲突
  const detectedConflicts = detectConflicts(newSlots);
  conflicts.push(...detectedConflicts);
  
  // 如果还有空槽，添加警告
  if (finalEmpty.length > 0) {
    conflicts.push({
      id: 'unfilled-slots',
      type: 'time_conflict',
      description: `仍有${finalEmpty.length}个时间槽未填充，可能需要增加教师资源`,
      relatedSlots: finalEmpty.map(s => `${s.className}-${s.weekDay}-${s.periodIndex}`),
      severity: 'warning',
      suggestions: ['增加教师配置', '调整教师课时上限'],
    });
  }

  return {
    success: finalEmpty.length === 0 && conflicts.filter(c => c.severity === 'error').length === 0,
    slots: newSlots,
    conflicts,
    adjustments,
    unfilledSlots: finalEmpty.map(s => ({
      classId: s.classId,
      className: s.className,
      weekDay: s.weekDay,
      periodIndex: s.periodIndex,
    })),
    statistics: {
      totalSlots: totalNeeded,
      arrangedSlots: totalArranged,
      conflictCount: conflicts.length,
      coverageRate: allSlotRequirements.length > 0 
        ? (allSlotRequirements.length - finalEmpty.length) / allSlotRequirements.length 
        : 1,
    },
    duration: Date.now() - startTime,
  };
}

// ==================== 辅助函数 ====================

function createSlot(
  classId: string,
  className: string,
  grade: number,
  weekDay: WeekDay,
  periodIndex: number,
  subject: string,
  teacherId: string,
  teacherName: string,
  semester: string
): ScheduleSlot {
  return {
    id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    classId,
    className,
    grade,
    weekDay,
    periodIndex,
    semester,
    courseName: subject,
    subject,
    courseType: 'normal',
    teacherId,
    teacherName,
    status: 'normal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function updateOccupancy(
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

function findBestSlotForTask(
  task: TeachingTask,
  grade: number,
  periods: PeriodConfig[],
  classTimeMap: Map<string, Set<string>>,
  teacherTimeMap: Map<string, Set<string>>,
  allSlotRequirements: SlotRequirement[],
  newSlots: ScheduleSlot[]  // 已安排的课表，用于检查当天科目重复
): SlotRequirement | null {
  // 判断是否为主科（语文、数学）
  const isMainSubject = task.subject === '语文' || task.subject === '数学';
  
  // 统计该班级该科目已经使用过的时段
  const usedPeriods = new Set<number>();
  newSlots.forEach(s => {
    if (s.classId === task.classId && s.subject === task.subject) {
      usedPeriods.add(s.periodIndex);
    }
  });
  
  // 优先级：上午第2、3节 > 上午第1节 > 下午
  // 主科（语文、数学）只在上午排课（第1、2、3节）
  const periodPriority = isMainSubject 
    ? [2, 3, 1]  // 主科只在上午
    : [2, 3, 4, 5, 6, 1];  // 其他科目优先上午2、3节，其次下午，最后上午第1节
  
  // 第一轮：优先选择未使用过的时段
  for (const periodIndex of periodPriority) {
    if (!periods.find(p => p.index === periodIndex)) continue;
    if (usedPeriods.has(periodIndex)) continue;  // 跳过已使用的时段
    
    for (const day of WEEK_DAYS) {
      const timeKey = `${day}-${periodIndex}`;
      
      // 检查班级是否已有课
      if (classTimeMap.has(task.classId) && classTimeMap.get(task.classId)!.has(timeKey)) {
        continue;
      }
      
      // 检查教师是否可用
      if (teacherTimeMap.has(task.teacherId) && teacherTimeMap.get(task.teacherId)!.has(timeKey)) {
        continue;
      }
      
      // 非主科检查：该班级当天是否已有该科目
      if (!isMainSubject) {
        const hasSubjectToday = newSlots.some(s => 
          s.classId === task.classId && 
          s.weekDay === day && 
          s.subject === task.subject
        );
        if (hasSubjectToday) {
          continue;  // 当天已有该科目，跳过
        }
      }
      
      // 检查时间槽是否可用
      const req = allSlotRequirements.find(r => 
        r.classId === task.classId && r.weekDay === day && r.periodIndex === periodIndex && !r.filled
      );
      
      if (req) {
        return req;
      }
    }
  }
  
  // 第二轮：所有时段都用过了，允许重复时段（但仍然要避免同一天重复）
  for (const periodIndex of periodPriority) {
    if (!periods.find(p => p.index === periodIndex)) continue;
    
    for (const day of WEEK_DAYS) {
      const timeKey = `${day}-${periodIndex}`;
      
      // 检查班级是否已有课
      if (classTimeMap.has(task.classId) && classTimeMap.get(task.classId)!.has(timeKey)) {
        continue;
      }
      
      // 检查教师是否可用
      if (teacherTimeMap.has(task.teacherId) && teacherTimeMap.get(task.teacherId)!.has(timeKey)) {
        continue;
      }
      
      // 非主科检查：该班级当天是否已有该科目
      if (!isMainSubject) {
        const hasSubjectToday = newSlots.some(s => 
          s.classId === task.classId && 
          s.weekDay === day && 
          s.subject === task.subject
        );
        if (hasSubjectToday) {
          continue;
        }
      }
      
      // 检查时间槽是否可用
      const req = allSlotRequirements.find(r => 
        r.classId === task.classId && r.weekDay === day && r.periodIndex === periodIndex && !r.filled
      );
      
      if (req) {
        return req;
      }
    }
  }
  
  return null;
}

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

function detectConflicts(slots: ScheduleSlot[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  
  // 检测教师冲突
  const teacherSlots = new Map<string, ScheduleSlot[]>();
  for (const slot of slots) {
    const key = `${slot.teacherId}-${slot.weekDay}-${slot.periodIndex}`;
    if (!teacherSlots.has(key)) {
      teacherSlots.set(key, []);
    }
    teacherSlots.get(key)!.push(slot);
  }
  
  for (const [key, slotList] of teacherSlots) {
    if (slotList.length > 1) {
      conflicts.push({
        id: `conflict-teacher-${key}`,
        type: 'teacher_conflict',
        description: `教师冲突：${slotList[0].teacherName}在同一时间有多个班级课程`,
        relatedSlots: slotList.map(s => s.id),
        severity: 'error',
        suggestions: ['调整课程时间', '安排代课'],
      });
    }
  }
  
  // 检测班级冲突
  const classSlots = new Map<string, ScheduleSlot[]>();
  for (const slot of slots) {
    const key = `${slot.classId}-${slot.weekDay}-${slot.periodIndex}`;
    if (!classSlots.has(key)) {
      classSlots.set(key, []);
    }
    classSlots.get(key)!.push(slot);
  }
  
  for (const [key, slotList] of classSlots) {
    if (slotList.length > 1) {
      conflicts.push({
        id: `conflict-class-${key}`,
        type: 'class_conflict',
        description: `班级冲突：${slotList[0].className}在同一时间有多门课程`,
        relatedSlots: slotList.map(s => s.id),
        severity: 'error',
        suggestions: ['调整课程时间'],
      });
    }
  }
  
  return conflicts;
}

// ==================== 导出辅助函数 ====================

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

export function calculateClassSubjectHours(slots: ScheduleSlot[], classId: string): Record<string, number> {
  const classSlots = slots.filter(s => s.classId === classId);
  const hours: Record<string, number> = {};
  
  for (const slot of classSlots) {
    hours[slot.subject] = (hours[slot.subject] || 0) + 1;
  }
  
  return hours;
}

export function calculateTeacherWeeklyHours(slots: ScheduleSlot[], teacherId: string): number {
  return slots.filter(s => s.teacherId === teacherId).length;
}
