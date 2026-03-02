/**
 * 智能排课算法核心
 * 
 * 排课流程：
 * 1. 数据预处理
 * 2. 固定班队课（周五下午第三节）
 * 3. 排上午第一节（语数轮换）
 * 4. 排剩余语文、数学（上午、单日≤2）
 * 5. 排技能科（下午、禁排约束、单日≤1）
 * 6. 硬约束检查
 * 7. 软约束优化（模拟退火）
 */

import {
  WEEKDAYS,
  TIME_PERIODS,
  PERIOD_CONFIG,
  LOW_GRADES,
  HIGH_GRADES,
  SUBJECT_HOURS_CONFIG,
  MAIN_SUBJECTS,
  SKILL_SUBJECTS,
  CHINESE_SECONDARY,
  MATH_SECONDARY,
  CLASS_MEETING_SLOT,
  CHINESE_BAN_SLOT,
  MATH_BAN_SLOT,
  POSITION_HOURS_REDUCTION,
  isLowGrade,
  getAfternoonPeriods,
  getSubjectHours,
  isMainSubject,
  isSkillSubject,
} from './rules';
import {
  TimeSlot,
  TimeSlotId,
  TimeSlot as TimeSlotType,
  TeacherForSchedule,
  ClassForSchedule,
  ScheduleSlot,
  ClassSchedule,
  TeacherSchedule,
  ScheduleResult,
  ScheduleStatistics,
  ConstraintViolation,
  SoftConstraintDetail,
  ScheduleInput,
  createTimeSlotId,
  parseTimeSlotId,
  TeacherAvailability,
  ClassScheduleState,
  ScheduleTask,
} from './types';

// ==================== 时间槽生成 ====================

/** 为年级生成所有时间槽 */
function generateTimeSlotsForGrade(grade: number): TimeSlotId[] {
  const slots: TimeSlotId[] = [];
  
  for (const weekday of WEEKDAYS) {
    // 上午固定3节
    for (let i = 1; i <= PERIOD_CONFIG.highGradeMorning; i++) {
      slots.push(createTimeSlotId(weekday, '上午', i));
    }
    
    // 下午根据年级和星期
    const afternoonPeriods = getAfternoonPeriods(grade, weekday);
    for (let i = 1; i <= afternoonPeriods; i++) {
      slots.push(createTimeSlotId(weekday, '下午', i));
    }
  }
  
  return slots;
}

// ==================== 教师可用性管理 ====================

/** 初始化教师可用性 */
function initTeacherAvailability(
  teacher: TeacherForSchedule,
  allSlots: TimeSlotId[]
): TeacherAvailability {
  const availableSlots = new Set<TimeSlotId>(allSlots);
  const bannedSlots = new Set<TimeSlotId>();
  
  // 语文教师兼任技能科时，周二下午第二节禁排
  if (teacher.primarySubject === '语文' && 
      teacher.secondarySubjects.some(s => isSkillSubject(s))) {
    bannedSlots.add(createTimeSlotId(
      CHINESE_BAN_SLOT.weekday,
      CHINESE_BAN_SLOT.period,
      CHINESE_BAN_SLOT.periodIndex
    ));
  }
  
  // 数学教师兼任技能科时，周三下午第二节禁排
  if (teacher.primarySubject === '数学' && 
      teacher.secondarySubjects.some(s => isSkillSubject(s))) {
    bannedSlots.add(createTimeSlotId(
      MATH_BAN_SLOT.weekday,
      MATH_BAN_SLOT.period,
      MATH_BAN_SLOT.periodIndex
    ));
  }
  
  // 从可用时段移除禁排时段
  bannedSlots.forEach(s => availableSlots.delete(s));
  
  return {
    teacherId: teacher.id,
    availableSlots,
    bannedSlots,
    assignedSlots: new Map(),
    dailyHours: new Map(WEEKDAYS.map(d => [d, 0])),
    subjectDailyHours: new Map(),
  };
}

/** 检查教师是否可用 */
function isTeacherAvailable(
  teacher: TeacherForSchedule,
  availability: TeacherAvailability,
  slotId: TimeSlotId,
  subject: string
): { available: boolean; reason?: string } {
  const slot = parseTimeSlotId(slotId);
  
  // 1. 检查是否在禁排时段
  if (availability.bannedSlots.has(slotId)) {
    return { available: false, reason: '禁排时段' };
  }
  
  // 2. 检查是否已分配
  if (availability.assignedSlots.has(slotId)) {
    return { available: false, reason: '已有课程' };
  }
  
  // 3. 检查周课时限制
  const totalHours = availability.assignedSlots.size;
  if (totalHours >= teacher.maxHours) {
    return { available: false, reason: '已达周课时上限' };
  }
  
  // 4. 检查主科教师当日课时（主科教师每天同一科目最多2节）
  // 注意：技能科教师不受此限制，因为他们是跨班任教的
  if (isMainSubject(subject) && teacher.primarySubject === subject) {
    const subjectDaily = availability.subjectDailyHours.get(subject)?.get(slot.weekday) || 0;
    if (subjectDaily >= 2) {
      return { available: false, reason: `${subject}单日已达2节上限` };
    }
  }
  
  return { available: true };
}

/** 分配教师到时段 */
function assignTeacherToSlot(
  availability: TeacherAvailability,
  slotId: TimeSlotId,
  classId: string,
  subject: string
): void {
  const slot = parseTimeSlotId(slotId);
  
  availability.assignedSlots.set(slotId, classId);
  availability.dailyHours.set(slot.weekday, (availability.dailyHours.get(slot.weekday) || 0) + 1);
  
  // 更新科目每日课时
  if (!availability.subjectDailyHours.has(subject)) {
    availability.subjectDailyHours.set(subject, new Map());
  }
  const subjectDaily = availability.subjectDailyHours.get(subject)!;
  subjectDaily.set(slot.weekday, (subjectDaily.get(slot.weekday) || 0) + 1);
  
  // 从可用时段移除
  availability.availableSlots.delete(slotId);
}

// ==================== 排课核心算法 ====================

export class SchedulingEngine {
  private input: ScheduleInput;
  private teacherMap: Map<string, TeacherForSchedule>;
  private classMap: Map<string, ClassForSchedule>;
  private teacherAvailability: Map<string, TeacherAvailability>;
  private classStates: Map<string, ClassScheduleState>;
  private schedule: Map<string, ScheduleSlot>; // key: slotId_classId
  private violations: ConstraintViolation[];
  private softPenalties: SoftConstraintDetail[];
  
  /** 每个时段每个科目的已分配教师数量 */
  private slotSubjectTeacherCount: Map<string, Map<string, number>>;
  
  constructor(input: ScheduleInput) {
    this.input = input;
    this.teacherMap = new Map(input.teachers.map(t => [t.id, t]));
    this.classMap = new Map(input.classes.map(c => [c.id, c]));
    this.teacherAvailability = new Map();
    this.classStates = new Map();
    this.schedule = new Map();
    this.violations = [];
    this.softPenalties = [];
    this.slotSubjectTeacherCount = new Map();
  }
  
  /** 执行排课 */
  async execute(
    onProgress?: (phase: string, current: number, total: number, message: string) => void
  ): Promise<ScheduleResult> {
    try {
      // 1. 数据预处理
      onProgress?.('预处理', 0, 7, '初始化排课数据...');
      this.preprocess();
      
      // 2. 固定班队课
      onProgress?.('固定班队课', 1, 7, '安排周五下午第三节班队课...');
      this.scheduleClassMeetings();
      
      // 3. 排上午第一节（语数轮换）
      onProgress?.('排第一节', 2, 7, '安排上午第一节语数轮换...');
      this.scheduleFirstPeriods();
      
      // 4. 排剩余语数
      onProgress?.('排语数', 3, 7, '安排剩余语文数学课程...');
      this.scheduleMainSubjects();
      
      // 5. 排技能科
      onProgress?.('排技能科', 4, 7, '安排技能科课程...');
      this.scheduleSkillSubjects();
      
      // 6. 硬约束检查
      onProgress?.('约束检查', 5, 7, '检查硬约束...');
      this.checkHardConstraints();
      
      // 7. 软约束优化
      onProgress?.('优化', 6, 7, '优化软约束...');
      this.optimizeSoftConstraints();
      
      // 构建结果
      onProgress?.('完成', 7, 7, '生成课表...');
      return this.buildResult();
      
    } catch (error) {
      return {
        success: false,
        message: `排课失败: ${error instanceof Error ? error.message : '未知错误'}`,
        classSchedules: [],
        teacherSchedules: [],
        statistics: {
          totalSlots: 0,
          assignedSlots: 0,
          unassignedSlots: 0,
          teacherHoursVariance: 0,
          averageTeacherHours: 0,
        },
        hardConstraintViolations: [],
        softConstraintPenalty: 0,
        softConstraintDetails: [],
      };
    }
  }
  
  // ==================== 数据预处理 ====================
  
  private preprocess(): void {
    // 初始化教师可用性
    const allSlots = new Set<TimeSlotId>();
    for (let grade = 1; grade <= 6; grade++) {
      generateTimeSlotsForGrade(grade).forEach(s => allSlots.add(s));
    }
    
    for (const teacher of this.input.teachers) {
      this.teacherAvailability.set(
        teacher.id,
        initTeacherAvailability(teacher, Array.from(allSlots))
      );
    }
    
    // 初始化班级状态
    for (const cls of this.input.classes) {
      const subjectHours = new Map<string, number>();
      for (const need of cls.subjectNeeds) {
        subjectHours.set(need.subject, need.weeklyHours);
      }
      
      this.classStates.set(cls.id, {
        classId: cls.id,
        grade: cls.grade,
        subjectHours,
        dailySchedule: new Map(),
        firstPeriodSubjects: [],
        assignedTeachers: new Map(), // 记录每个科目已分配的教师
      });
    }
    
    // 预分配：语文班主任兼道法，数学班主任兼劳动
    this.preassignSecondarySubjects();
  }
  
  private preassignSecondarySubjects(): void {
    for (const cls of this.input.classes) {
      const state = this.classStates.get(cls.id)!;
      
      // 找到班主任
      if (cls.headTeacherId) {
        const headTeacher = this.teacherMap.get(cls.headTeacherId);
        if (!headTeacher) continue;
        
        // 语文班主任：兼任道法
        if (headTeacher.primarySubject === '语文') {
          const daofaHours = state.subjectHours.get('道德与法治') || 0;
          if (daofaHours > 0) {
            // 标记道法由班主任负责
            state.subjectHours.set('道德与法治', 0);
            // 增加语文老师的道法课时
            // 实际分配在排课时处理
          }
        }
        
        // 数学班主任：兼任劳动
        if (headTeacher.primarySubject === '数学') {
          const laborHours = state.subjectHours.get('劳动') || 0;
          if (laborHours > 0) {
            state.subjectHours.set('劳动', 0);
          }
        }
      }
    }
  }
  
  // ==================== 固定班队课 ====================
  
  private scheduleClassMeetings(): void {
    const slotId = createTimeSlotId(
      CLASS_MEETING_SLOT.weekday,
      CLASS_MEETING_SLOT.period,
      CLASS_MEETING_SLOT.periodIndex
    );
    
    for (const cls of this.input.classes) {
      if (!cls.headTeacherId) continue;
      
      const teacher = this.teacherMap.get(cls.headTeacherId);
      if (!teacher) continue;
      
      // 班会固定周五下午第三节
      const scheduleSlot: ScheduleSlot = {
        timeSlotId: slotId,
        timeSlot: {
          weekday: CLASS_MEETING_SLOT.weekday,
          period: CLASS_MEETING_SLOT.period,
          periodIndex: CLASS_MEETING_SLOT.periodIndex,
        },
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        subject: '班会',
        teacherId: teacher.id,
        teacherName: teacher.name,
      };
      
      this.schedule.set(`${slotId}_${cls.id}`, scheduleSlot);
      
      // 更新班级状态
      const state = this.classStates.get(cls.id)!;
      state.subjectHours.set('班会', 0);
      state.dailySchedule.set(slotId, scheduleSlot);
      
      // 更新教师可用性
      const availability = this.teacherAvailability.get(teacher.id)!;
      assignTeacherToSlot(availability, slotId, cls.id, '班会');
    }
  }
  
  // ==================== 排上午第一节 ====================
  
  private scheduleFirstPeriods(): void {
    // 按班级分配第一节：确保语数轮换
    // 一年级语文8节、数学4节 -> 5天上午第一节：语文、数学、语文、数学、语文 或类似轮换
    for (const cls of this.input.classes) {
      const state = this.classStates.get(cls.id)!;
      const isOddClass = cls.classNumber % 2 === 1;
      
      // 获取语文和数学的剩余课时
      let chineseRemaining = state.subjectHours.get('语文') || 0;
      let mathRemaining = state.subjectHours.get('数学') || 0;
      
      // 按天分配第一节（语数轮换）
      for (let dayIndex = 0; dayIndex < WEEKDAYS.length; dayIndex++) {
        const weekday = WEEKDAYS[dayIndex];
        const slotId = createTimeSlotId(weekday, '上午', 1);
        
        // 确定今天第一节排什么科目
        let subject: string | null = null;
        
        if (dayIndex === 0) {
          // 周一：奇数班语文，偶数班数学
          subject = isOddClass ? '语文' : '数学';
        } else {
          // 检查前一天第一节是什么科目
          const prevWeekday = WEEKDAYS[dayIndex - 1];
          const prevSlotId = createTimeSlotId(prevWeekday, '上午', 1);
          const prevSlot = state.dailySchedule.get(prevSlotId);
          
          if (prevSlot) {
            // 连续两天第一节不能同一科目
            const prevSubject = prevSlot.subject;
            if (prevSubject === '语文' && mathRemaining > 0) {
              subject = '数学';
            } else if (prevSubject === '数学' && chineseRemaining > 0) {
              subject = '语文';
            } else if (chineseRemaining > 0) {
              subject = '语文';
            } else if (mathRemaining > 0) {
              subject = '数学';
            }
          }
        }
        
        // 检查是否有剩余课时
        if (subject === '语文' && chineseRemaining <= 0) {
          subject = mathRemaining > 0 ? '数学' : null;
        } else if (subject === '数学' && mathRemaining <= 0) {
          subject = chineseRemaining > 0 ? '语文' : null;
        }
        
        if (!subject) continue;
        
        // 找教师
        const teacher = this.findTeacherForSubject(cls, subject, slotId);
        if (!teacher) continue;
        
        // 分配
        this.assignSlot(cls, state, slotId, subject, teacher);
        
        // 更新剩余课时
        if (subject === '语文') chineseRemaining--;
        else mathRemaining--;
      }
    }
  }
  
  // ==================== 排剩余语数 ====================
  
  private scheduleMainSubjects(): void {
    // 收集所有语数任务
    const tasks: ScheduleTask[] = [];
    
    for (const cls of this.input.classes) {
      const state = this.classStates.get(cls.id)!;
      
      for (const subject of MAIN_SUBJECTS) {
        const remaining = state.subjectHours.get(subject) || 0;
        if (remaining > 0) {
          tasks.push({
            classId: cls.id,
            grade: cls.grade,
            subject,
            remainingHours: remaining,
            priority: subject === '语文' ? 10 : 9, // 语文优先
          });
        }
      }
    }
    
    // 按优先级排序
    tasks.sort((a, b) => b.priority - a.priority);
    
    // 分配上午时段
    for (const task of tasks) {
      const cls = this.classMap.get(task.classId)!;
      const state = this.classStates.get(task.classId)!;
      
      // 获取可用上午时段
      const morningSlots = this.getAvailableMorningSlots(state);
      
      for (const slotId of morningSlots) {
        if (task.remainingHours <= 0) break;
        
        // 检查单日限制
        const slot = parseTimeSlotId(slotId);
        const dailySubjectCount = this.getDailySubjectCount(state, slot.weekday, task.subject);
        if (dailySubjectCount >= 2) continue;
        
        // 找教师
        const teacher = this.findTeacherForSubject(cls, task.subject, slotId);
        if (!teacher) continue;
        
        // 检查教师当日该科目课时
        const availability = this.teacherAvailability.get(teacher.id)!;
        const subjectDaily = availability.subjectDailyHours.get(task.subject)?.get(slot.weekday) || 0;
        if (subjectDaily >= 2) continue;
        
        // 分配
        this.assignSlot(cls, state, slotId, task.subject, teacher);
        task.remainingHours--;
      }
    }
  }
  
  // ==================== 排技能科 ====================
  
  /** 专职技能科（有专职教师的科目） */
  private static readonly FULLTIME_SKILL_SUBJECTS = ['体育', '音乐', '美术', '信息技术', '英语', '心育'];
  
  /** 兼任技能科（由语数教师兼任的科目，应优先下午） */
  private static readonly PARTTIME_SKILL_SUBJECTS = ['道德与法治', '科学', '劳动', '综合实践', '校本'];
  
  /** 语文教师兼任的科目（可以安排在上午） */
  private static readonly CHINESE_PARTTIME_SUBJECTS = ['书法', '道德与法治', '综合实践', '校本'];
  
  private scheduleSkillSubjects(): void {
    // 第一阶段：先排语文兼任科目（书法优先，安排在上午剩余时段）
    this.scheduleChineseParttimeSubjects();
    
    // 第二阶段：排专职技能科和数学兼任科目
    this.scheduleOtherSkillSubjects();
  }
  
  /** 排语文兼任科目（书法、道法、综合实践） */
  private scheduleChineseParttimeSubjects(): void {
    let maxRounds = 30;
    let hasRemaining = true;
    
    while (hasRemaining && maxRounds > 0) {
      maxRounds--;
      hasRemaining = false;
      
      for (const cls of this.input.classes) {
        const state = this.classStates.get(cls.id)!;
        
        for (const subject of SchedulingEngine.CHINESE_PARTTIME_SUBJECTS) {
          const remaining = state.subjectHours.get(subject) || 0;
          if (remaining <= 0) continue;
          
          // 书法课优先上午（和语文一起排），其他兼任科目优先下午
          const preferAfternoon = subject !== '书法';
          const slotId = this.findAvailableSlot(cls, state, subject, preferAfternoon);
          
          if (slotId) {
            const teacher = this.findTeacherForSubject(cls, subject, slotId);
            if (teacher) {
              this.assignSlot(cls, state, slotId, subject, teacher);
            }
          } else if (remaining > 0) {
            hasRemaining = true;
          }
        }
      }
    }
  }
  
  /** 排专职技能科和数学兼任科目 */
  private scheduleOtherSkillSubjects(): void {
    // 收集所有需要排的技能科任务
    const allTasks: { classId: string; subject: string; remaining: number }[] = [];
    
    for (const cls of this.input.classes) {
      const state = this.classStates.get(cls.id)!;
      
      // 专职技能科
      for (const subject of SchedulingEngine.FULLTIME_SKILL_SUBJECTS) {
        const remaining = state.subjectHours.get(subject) || 0;
        if (remaining > 0) {
          allTasks.push({ classId: cls.id, subject, remaining });
        }
      }
      
      // 兼任技能科（排除语文兼任的科目）
      for (const subject of SchedulingEngine.PARTTIME_SKILL_SUBJECTS) {
        const remaining = state.subjectHours.get(subject) || 0;
        if (remaining > 0) {
          allTasks.push({ classId: cls.id, subject, remaining });
        }
      }
    }
    
    // 多轮分配，每轮处理一个时段的一个科目
    let maxRounds = 100;
    while (allTasks.some(t => t.remaining > 0) && maxRounds > 0) {
      maxRounds--;
      
      // 按科目分组，找出剩余最多的科目优先处理
      const subjectRemaining = new Map<string, number>();
      for (const task of allTasks) {
        subjectRemaining.set(task.subject, (subjectRemaining.get(task.subject) || 0) + task.remaining);
      }
      
      // 按剩余数量排序，优先处理剩余多的科目
      const subjectsByPriority = Array.from(subjectRemaining.entries())
        .filter(([_, r]) => r > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([s]) => s);
      
      let assigned = false;
      
      for (const subject of subjectsByPriority) {
        // 获取该科目的所有任务
        const subjectTasks = allTasks.filter(t => t.subject === subject && t.remaining > 0);
        if (subjectTasks.length === 0) continue;
        
        // 为这些任务分配时段（优先下午）
        for (const task of subjectTasks) {
          if (task.remaining <= 0) continue;
          
          const cls = this.classMap.get(task.classId)!;
          const state = this.classStates.get(task.classId)!;
          
          // 先尝试下午时段
          let slotId = this.findAvailableSlot(cls, state, subject, true);
          
          // 如果下午没有，尝试上午时段
          if (!slotId) {
            slotId = this.findAvailableSlot(cls, state, subject, false);
          }
          
          if (slotId) {
            const teacher = this.findTeacherForSubject(cls, subject, slotId);
            if (teacher) {
              this.assignSlot(cls, state, slotId, subject, teacher);
              task.remaining--;
              assigned = true;
            }
          }
        }
      }
      
      if (!assigned) break;
    }
  }
  
  /** 找可用时间槽（检查科目和教师），优先选择教师负载低的时段 */
  private findAvailableSlot(
    cls: ClassForSchedule,
    state: ClassScheduleState,
    subject: string,
    preferAfternoon: boolean
  ): TimeSlotId | null {
    // 获取所有可用时段
    const allSlots: { slotId: TimeSlotId; isAfternoon: boolean; load: number }[] = [];
    
    // 下午时段
    for (const slotId of this.getAvailableAfternoonSlots(state)) {
      const load = this.getSlotSubjectLoad(slotId, subject);
      allSlots.push({ slotId, isAfternoon: true, load });
    }
    // 上午时段
    for (const slotId of this.getAvailableMorningSlots(state)) {
      const load = this.getSlotSubjectLoad(slotId, subject);
      allSlots.push({ slotId, isAfternoon: false, load });
    }
    
    // 根据偏好排序，然后按负载升序（负载低的优先）
    if (preferAfternoon) {
      allSlots.sort((a, b) => {
        // 下午优先
        if (a.isAfternoon !== b.isAfternoon) {
          return b.isAfternoon ? 1 : -1;
        }
        // 负载低的优先
        return a.load - b.load;
      });
    } else {
      // 负载低的优先
      allSlots.sort((a, b) => a.load - b.load);
    }
    
    // 找可用时段
    for (const { slotId } of allSlots) {
      const slot = parseTimeSlotId(slotId);
      
      // 检查该科目当天是否已安排（每个技能科每天最多1节）
      const dailySubjectCount = this.getDailySubjectCount(state, slot.weekday, subject);
      if (dailySubjectCount >= 1) continue;
      
      // 检查是否有教师可用
      const teacher = this.findTeacherForSubject(cls, subject, slotId);
      if (!teacher) continue;
      
      return slotId;
    }
    
    return null;
  }
  
  /** 获取某时段某科目的教师负载（已分配数量） */
  private getSlotSubjectLoad(slotId: TimeSlotId, subject: string): number {
    const slotCount = this.slotSubjectTeacherCount.get(slotId);
    if (!slotCount) return 0;
    return slotCount.get(subject) || 0;
  }
  
  // ==================== 辅助方法 ====================
  
  private findTeacherForSubject(
    cls: ClassForSchedule,
    subject: string,
    slotId: TimeSlotId
  ): TeacherForSchedule | null {
    const slot = parseTimeSlotId(slotId);
    const state = this.classStates.get(cls.id)!;
    
    // 检查该班级该科目是否已有教师
    const existingTeacherId = state.assignedTeachers.get(subject);
    
    // 候选教师
    const candidates: TeacherForSchedule[] = [];
    
    for (const teacher of this.input.teachers) {
      // 检查是否可教该科目（主科或兼任科目）
      const canTeach = teacher.primarySubject === subject || 
                       teacher.secondarySubjects.includes(subject);
      if (!canTeach) continue;
      
      // 检查年级（教师只能教其可教年级范围内的班级）
      if (!teacher.teachableGrades.includes(cls.grade)) continue;
      
      // 检查可用性
      const availability = this.teacherAvailability.get(teacher.id)!;
      const check = isTeacherAvailable(teacher, availability, slotId, subject);
      if (!check.available) continue;
      
      candidates.push(teacher);
    }
    
    // 如果已有教师且在候选列表中，直接返回
    if (existingTeacherId) {
      const existingTeacher = candidates.find(t => t.id === existingTeacherId);
      if (existingTeacher) {
        return existingTeacher;
      }
      // 如果已分配的教师不可用（课时已满等），需要选择新教师
      // 但这只在极端情况下发生
    }
    
    // 优先选择：班主任 > 主科匹配 > 课时最少
    candidates.sort((a, b) => {
      // 班主任优先
      const aIsHead = a.headTeacherClassId === cls.id ? 1 : 0;
      const bIsHead = b.headTeacherClassId === cls.id ? 1 : 0;
      if (aIsHead !== bIsHead) return bIsHead - aIsHead;
      
      // 主科匹配优先
      const aPrimary = a.primarySubject === subject ? 1 : 0;
      const bPrimary = b.primarySubject === subject ? 1 : 0;
      if (aPrimary !== bPrimary) return bPrimary - aPrimary;
      
      // 课时少的优先
      const aHours = this.teacherAvailability.get(a.id)!.assignedSlots.size;
      const bHours = this.teacherAvailability.get(b.id)!.assignedSlots.size;
      return aHours - bHours;
    });
    
    return candidates[0] || null;
  }
  
  private assignSlot(
    cls: ClassForSchedule,
    state: ClassScheduleState,
    slotId: TimeSlotId,
    subject: string,
    teacher: TeacherForSchedule
  ): void {
    const slot = parseTimeSlotId(slotId);
    
    // 创建排课记录
    const scheduleSlot: ScheduleSlot = {
      timeSlotId: slotId,
      timeSlot: slot,
      classId: cls.id,
      className: cls.name,
      grade: cls.grade,
      subject,
      teacherId: teacher.id,
      teacherName: teacher.name,
    };
    
    this.schedule.set(`${slotId}_${cls.id}`, scheduleSlot);
    
    // 更新班级状态
    const remaining = state.subjectHours.get(subject) || 0;
    state.subjectHours.set(subject, remaining - 1);
    state.dailySchedule.set(slotId, scheduleSlot);
    
    // 记录该科目已分配的教师（确保同一班同一科目由同一教师教）
    if (!state.assignedTeachers.has(subject)) {
      state.assignedTeachers.set(subject, teacher.id);
    }
    
    // 更新教师可用性
    const availability = this.teacherAvailability.get(teacher.id)!;
    assignTeacherToSlot(availability, slotId, cls.id, subject);
    
    // 更新时段科目教师计数
    if (!this.slotSubjectTeacherCount.has(slotId)) {
      this.slotSubjectTeacherCount.set(slotId, new Map());
    }
    const slotCount = this.slotSubjectTeacherCount.get(slotId)!;
    slotCount.set(subject, (slotCount.get(subject) || 0) + 1);
  }
  
  private getAvailableMorningSlots(state: ClassScheduleState): TimeSlotId[] {
    const slots: TimeSlotId[] = [];
    
    for (const weekday of WEEKDAYS) {
      for (let i = 1; i <= PERIOD_CONFIG.highGradeMorning; i++) {
        const slotId = createTimeSlotId(weekday, '上午', i);
        if (!state.dailySchedule.has(slotId)) {
          slots.push(slotId);
        }
      }
    }
    
    return slots;
  }
  
  private getAvailableAfternoonSlots(state: ClassScheduleState): TimeSlotId[] {
    const slots: TimeSlotId[] = [];
    const grade = state.grade;
    
    for (const weekday of WEEKDAYS) {
      const afternoonPeriods = getAfternoonPeriods(grade, weekday);
      for (let i = 1; i <= afternoonPeriods; i++) {
        const slotId = createTimeSlotId(weekday, '下午', i);
        if (!state.dailySchedule.has(slotId)) {
          slots.push(slotId);
        }
      }
    }
    
    return slots;
  }
  
  private getDailySubjectCount(
    state: ClassScheduleState,
    weekday: string,
    subject: string
  ): number {
    let count = 0;
    for (const [slotId, slot] of state.dailySchedule) {
      const slotTime = parseTimeSlotId(slotId);
      if (slotTime.weekday === weekday && slot?.subject === subject) {
        count++;
      }
    }
    return count;
  }
  
  private getDailySkillCount(state: ClassScheduleState, weekday: string): number {
    let count = 0;
    for (const [slotId, slot] of state.dailySchedule) {
      const slotTime = parseTimeSlotId(slotId);
      if (slotTime.weekday === weekday && slot && isSkillSubject(slot.subject)) {
        count++;
      }
    }
    return count;
  }
  
  private getSkillSubjectPriority(subject: string): number {
    const priorities: Record<string, number> = {
      '体育': 8,
      '心育': 7,
      '科学': 7,
      '道德与法治': 6,
      '音乐': 5,
      '美术': 5,
      '信息技术': 4,
      '劳动': 3,
      '综合实践': 2,
      '校本': 2,
      '书法': 1,
    };
    return priorities[subject] || 1;
  }
  
  // ==================== 硬约束检查 ====================
  
  private checkHardConstraints(): void {
    // 检查各班各科课时是否达标
    this.checkSubjectHoursConstraint();
    
    // 检查空槽（新增）
    this.checkEmptySlots();
    
    // 检查教师冲突
    this.checkTeacherConflictConstraint();
    
    // 检查语数是否都在上午
    this.checkMainSubjectMorningConstraint();
  }
  
  /** 检查空槽（时间槽未填满） */
  private checkEmptySlots(): void {
    for (const cls of this.input.classes) {
      const state = this.classStates.get(cls.id)!;
      const grade = cls.grade;
      
      // 生成该班级应有的所有时间槽
      const expectedSlots = generateTimeSlotsForGrade(grade);
      
      // 检查每个槽是否都有课程
      const emptySlots: string[] = [];
      for (const slotId of expectedSlots) {
        if (!state.dailySchedule.has(slotId) || state.dailySchedule.get(slotId) === null) {
          emptySlots.push(slotId);
        }
      }
      
      if (emptySlots.length > 0) {
        this.violations.push({
          type: 'EMPTY_SLOTS',
          message: `${cls.name} 有 ${emptySlots.length} 个空槽未安排课程`,
          count: emptySlots.length,
          details: emptySlots.slice(0, 5).map(s => `空槽: ${s}`),
        });
      }
    }
  }
  
  private checkSubjectHoursConstraint(): void {
    for (const cls of this.input.classes) {
      const state = this.classStates.get(cls.id)!;
      
      for (const [subject, remaining] of state.subjectHours) {
        if (remaining > 0) {
          this.violations.push({
            type: 'SUBJECT_HOURS_MISMATCH',
            message: `${cls.name} ${subject} 课时不足`,
            count: remaining,
            details: [`${cls.name} ${subject} 还需安排 ${remaining} 节`],
          });
        }
      }
    }
  }
  
  private checkTeacherConflictConstraint(): void {
    // 按时间槽分组
    const slotMap = new Map<TimeSlotId, ScheduleSlot[]>();
    
    for (const slot of this.schedule.values()) {
      if (!slotMap.has(slot.timeSlotId)) {
        slotMap.set(slot.timeSlotId, []);
      }
      slotMap.get(slot.timeSlotId)!.push(slot);
    }
    
    // 检查每个时间槽是否有教师冲突
    for (const [slotId, slots] of slotMap) {
      const teacherClasses = new Map<string, string[]>();
      
      for (const slot of slots) {
        if (!teacherClasses.has(slot.teacherId)) {
          teacherClasses.set(slot.teacherId, []);
        }
        teacherClasses.get(slot.teacherId)!.push(slot.className);
      }
      
      // 如果一个教师同时教多个班，记录冲突
      for (const [teacherId, classes] of teacherClasses) {
        if (classes.length > 1) {
          const teacher = this.teacherMap.get(teacherId);
          this.violations.push({
            type: 'TEACHER_NO_CONFLICT',
            message: `${teacher?.name || teacherId} 在 ${slotId} 有冲突`,
            count: 1,
            details: [`同时安排在: ${classes.join(', ')}`],
          });
        }
      }
    }
  }
  
  private checkMainSubjectMorningConstraint(): void {
    for (const slot of this.schedule.values()) {
      if (isMainSubject(slot.subject) && slot.timeSlot.period === '下午') {
        this.violations.push({
          type: 'MAIN_SUBJECT_MORNING',
          message: `${slot.className} ${slot.subject} 安排在下午`,
          count: 1,
          details: [`${slot.timeSlotId}: ${slot.subject}`],
        });
      }
    }
  }
  
  // ==================== 软约束优化 ====================
  
  private optimizeSoftConstraints(): void {
    // 计算初始惩罚分数
    let totalPenalty = 0;
    
    // 检查连堂
    const consecutivePenalty = this.checkConsecutiveClasses();
    totalPenalty += consecutivePenalty;
    
    // 检查教师课时均衡
    const balancePenalty = this.checkTeacherHoursBalance();
    totalPenalty += balancePenalty;
    
    this.softPenalties.push({
      type: 'TOTAL_PENALTY',
      penalty: totalPenalty,
      count: 1,
    });
  }
  
  private checkConsecutiveClasses(): number {
    let penalty = 0;
    
    for (const cls of this.input.classes) {
      const state = this.classStates.get(cls.id)!;
      
      for (const weekday of WEEKDAYS) {
        // 检查上午连堂
        let consecutive = 0;
        let prevSubject = '';
        
        for (let i = 1; i <= PERIOD_CONFIG.highGradeMorning; i++) {
          const slotId = createTimeSlotId(weekday, '上午', i);
          const slot = state.dailySchedule.get(slotId);
          
          if (slot && slot.subject === prevSubject) {
            consecutive++;
            if (consecutive >= 2) {
              penalty += 10; // 连堂扣分
            }
          } else {
            consecutive = 0;
          }
          prevSubject = slot?.subject || '';
        }
      }
    }
    
    return penalty;
  }
  
  private checkTeacherHoursBalance(): number {
    const hours = Array.from(this.teacherAvailability.values())
      .map(a => a.assignedSlots.size);
    
    const avg = hours.reduce((a, b) => a + b, 0) / hours.length;
    const variance = hours.reduce((sum, h) => sum + Math.pow(h - avg, 2), 0) / hours.length;
    
    return Math.round(variance * 0.5);
  }
  
  // ==================== 构建结果 ====================
  
  private buildResult(): ScheduleResult {
    // 构建班级课表
    const classSchedules: ClassSchedule[] = [];
    
    for (const cls of this.input.classes) {
      const state = this.classStates.get(cls.id)!;
      const slots: ScheduleSlot[][] = WEEKDAYS.map(() => []);
      
      for (const slot of state.dailySchedule.values()) {
        if (slot) {
          const dayIndex = WEEKDAYS.indexOf(slot.timeSlot.weekday);
          slots[dayIndex].push(slot);
        }
      }
      
      // 按节次排序
      for (const daySlots of slots) {
        daySlots.sort((a, b) => {
          const periodDiff = 
            (a.timeSlot.period === '上午' ? 0 : 100) + a.timeSlot.periodIndex -
            (b.timeSlot.period === '上午' ? 0 : 100) - b.timeSlot.periodIndex;
          return periodDiff;
        });
      }
      
      classSchedules.push({
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        slots,
      });
    }
    
    // 构建教师课表
    const teacherSchedules: TeacherSchedule[] = [];
    
    for (const teacher of this.input.teachers) {
      const availability = this.teacherAvailability.get(teacher.id)!;
      const slots: ScheduleSlot[][] = WEEKDAYS.map(() => []);
      
      for (const [slotId, classId] of availability.assignedSlots) {
        const slot = this.schedule.get(slotId);
        if (slot) {
          const dayIndex = WEEKDAYS.indexOf(slot.timeSlot.weekday);
          slots[dayIndex].push(slot);
        }
      }
      
      teacherSchedules.push({
        teacherId: teacher.id,
        teacherName: teacher.name,
        primarySubject: teacher.primarySubject,
        slots,
        totalHours: availability.assignedSlots.size,
      });
    }
    
    // 统计
    const statistics: ScheduleStatistics = {
      totalSlots: this.schedule.size,
      assignedSlots: this.schedule.size,
      unassignedSlots: this.violations.reduce((sum, v) => sum + v.count, 0),
      teacherHoursVariance: this.calculateTeacherHoursVariance(),
      averageTeacherHours: this.calculateAverageTeacherHours(),
    };
    
    return {
      success: this.violations.length === 0,
      message: this.violations.length === 0 
        ? '排课成功完成' 
        : `排课完成，存在 ${this.violations.length} 个约束违反`,
      classSchedules,
      teacherSchedules,
      statistics,
      hardConstraintViolations: this.violations,
      softConstraintPenalty: this.softPenalties.reduce((sum, p) => sum + p.penalty, 0),
      softConstraintDetails: this.softPenalties,
    };
  }
  
  private calculateTeacherHoursVariance(): number {
    const hours = Array.from(this.teacherAvailability.values())
      .map(a => a.assignedSlots.size);
    
    if (hours.length === 0) return 0;
    
    const avg = hours.reduce((a, b) => a + b, 0) / hours.length;
    return hours.reduce((sum, h) => sum + Math.pow(h - avg, 2), 0) / hours.length;
  }
  
  private calculateAverageTeacherHours(): number {
    const hours = Array.from(this.teacherAvailability.values())
      .map(a => a.assignedSlots.size);
    
    if (hours.length === 0) return 0;
    
    return hours.reduce((a, b) => a + b, 0) / hours.length;
  }
}
