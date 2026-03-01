/**
 * 智能排课系统 - 核心算法引擎
 * 
 * ==================== 核心逻辑 ====================
 * 1. 双向约束：教师课时满足 + 班级课表填满
 * 2. 教师课时范围：baseWeeklyHours ± 2（教务主任预设基准）
 * 3. 分配依据：角色、课时配置、任课设置、学段设置
 * 
 * ==================== 教师分配规则 ====================
 * - 领导层（校长/书记/副校长）：不排课
 * - 有兼任职务的班主任/科任：1个班主科 + 德法/劳动 + 班队课
 * - 无兼任职务的科任：2个班主科 + 德法/劳动
 * - 技能科教师：优先本年级，不足跨段
 */

import {
  type SchedulingTeacher,
  type SchedulingClass,
  type SlotAssignment,
  type TimeSlot,
  type CourseCategory,
  type WeekDay,
  type PeriodType,
  type SchedulingResult,
  type TeacherWorkloadSummary,
  type ClassScheduleSummary,
  type WorkloadAdjustment,
  type SchedulingWarning,
  type SchedulingError,
  type SchedulingStatistics,
  type TeacherAssignmentDetail,
  getPeriodsByGrade,
  getDailyPeriods,
  getWeeklyPeriods,
  getGradeSegment,
  getFridayLastPeriodIndex,
  STANDARD_SUBJECTS,
  MORNING_PERIODS,
  AFTERNOON_PERIODS_LOW,
  AFTERNOON_PERIODS_HIGH,
} from './types';

// ==================== 辅助函数 ====================

/** 获取科目配置 */
function getSubjectConfig(subject: CourseCategory) {
  return STANDARD_SUBJECTS.find(s => s.name === subject);
}

/** 判断是否为主科 */
function isMainSubject(subject: CourseCategory): boolean {
  return subject === '语文' || subject === '数学';
}

/** 判断是否为技能科 */
function isSkillSubject(subject: CourseCategory): boolean {
  return !isMainSubject(subject);
}

/** 获取科目在指定年级的周课时数 */
function getSubjectWeeklyHours(subject: CourseCategory, grade: number): number {
  const config = getSubjectConfig(subject);
  if (!config) return 0;
  
  const segment = getGradeSegment(grade);
  return config.weeklyHours[segment];
}

/** 检查教师是否可教某年级 */
function canTeachGrade(teacher: SchedulingTeacher, grade: number): boolean {
  return teacher.teachableGrades.includes(grade);
}

/** 检查教师是否可教某科目 */
function canTeachSubject(teacher: SchedulingTeacher, subject: CourseCategory): boolean {
  return teacher.teachableSubjects.includes(subject);
}

// ==================== 核心算法 ====================

interface SchedulingEngineContext {
  teachers: SchedulingTeacher[];
  classes: SchedulingClass[];
  semester: string;
}

export class SchedulingEngine {
  private teachers: SchedulingTeacher[];
  private classes: SchedulingClass[];
  private semester: string;
  
  // 中间状态
  private assignments: SlotAssignment[] = [];
  private teacherWorkloads: Map<string, number> = new Map();
  private classSlots: Map<string, Set<string>> = new Map(); // classId -> occupied slotIds
  private teacherSlots: Map<string, Set<string>> = new Map(); // teacherId -> occupied slotIds
  
  // 结果
  private adjustments: WorkloadAdjustment[] = [];
  private warnings: SchedulingWarning[] = [];
  private errors: SchedulingError[] = [];

  constructor(context: SchedulingEngineContext) {
    this.teachers = context.teachers.map(t => ({
      ...t,
      currentWeeklyHours: 0,
      assignedClasses: [],
    }));
    this.classes = context.classes.map(c => ({
      ...c,
      arrangedSlots: [],
    }));
    this.semester = context.semester;
    
    // 初始化工作量映射
    this.teachers.forEach(t => {
      this.teacherWorkloads.set(t.id, 0);
      this.teacherSlots.set(t.id, new Set());
    });
    
    // 初始化班级槽位映射
    this.classes.forEach(c => {
      this.classSlots.set(c.id, new Set());
    });
  }

  /**
   * 执行排课
   */
  public schedule(): SchedulingResult {
    console.log('开始智能排课...');
    
    // 第一阶段：预分配 - 班队课固定在周五下午最后一节
    this.assignClassMeetings();
    
    // 第二阶段：主科分配 - 语数按规则分配
    this.assignMainSubjects();
    
    // 第三阶段：兼任技能科 - 德法、劳动分配
    this.assignSecondarySubjects();
    
    // 第四阶段：技能科教师分配
    this.assignSkillTeachers();
    
    // 第五阶段：填补空槽 - 确保所有班级课表填满
    this.fillEmptySlots();
    
    // 第六阶段：验证与调整
    this.validateAndAdjust();
    
    return this.buildResult();
  }

  /**
   * 第一阶段：分配班队课（固定周五下午最后一节）
   */
  private assignClassMeetings() {
    console.log('第一阶段：分配班队课...');
    
    for (const cls of this.classes) {
      // 找到班主任
      const headTeacher = this.teachers.find(t => t.headTeacherClassId === cls.id);
      
      if (!headTeacher) {
        this.warnings.push({
          type: 'unusual_arrangement',
          message: `班级 ${cls.name} 没有班主任，班队课无法自动分配`,
          details: { classId: cls.id },
        });
        continue;
      }
      
      // 班队课固定在周五下午最后一节
      const lastPeriodIndex = getFridayLastPeriodIndex(cls.grade);
      const slotId = this.generateSlotId(cls.id, 5, lastPeriodIndex);
      
      const assignment: SlotAssignment = {
        slotId,
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        timeSlot: {
          weekDay: 5,
          periodIndex: lastPeriodIndex,
          periodName: lastPeriodIndex === 5 ? '第五节' : '第六节',
          periodType: 'afternoon',
        },
        subject: '班会',
        teacherId: headTeacher.id,
        teacherName: headTeacher.name,
      };
      
      this.addAssignment(assignment);
      this.incrementTeacherHours(headTeacher.id, 1);
      headTeacher.assignedClasses.push(cls.id);
    }
  }

  /**
   * 第二阶段：分配主科（语文、数学）
   */
  private assignMainSubjects() {
    console.log('第二阶段：分配主科...');
    
    // 按年级分组班级
    const classesByGrade = this.groupClassesByGrade();
    
    for (const [grade, gradeClasses] of classesByGrade) {
      // 语文教师分配
      this.assignSubjectToClasses(gradeClasses, '语文', grade);
      // 数学教师分配
      this.assignSubjectToClasses(gradeClasses, '数学', grade);
    }
  }

  /**
   * 为班级分配特定科目
   */
  private assignSubjectToClasses(
    classes: SchedulingClass[],
    subject: CourseCategory,
    grade: number
  ) {
    const weeklyHours = getSubjectWeeklyHours(subject, grade);
    
    // 找出可教该科目该年级的教师
    const eligibleTeachers = this.teachers.filter(t => 
      canTeachSubject(t, subject) && 
      canTeachGrade(t, grade) &&
      this.canAssignMoreHours(t)
    );
    
    for (const cls of classes) {
      // 查找已分配该班级该科目的教师（班主任或科任）
      let teacher = this.findAssignedTeacher(cls, subject);
      
      if (!teacher) {
        // 选择最合适的教师
        teacher = this.selectBestTeacher(eligibleTeachers, cls, subject, weeklyHours);
      }
      
      if (!teacher) {
        this.errors.push({
          type: 'no_teacher_available',
          message: `班级 ${cls.name} 找不到 ${subject} 教师`,
          details: { classId: cls.id, subject, grade },
        });
        continue;
      }
      
      // 分配课时
      this.assignSubjectToClass(cls, teacher, subject, weeklyHours, grade);
    }
  }

  /**
   * 查找已分配给班级某科目的教师
   */
  private findAssignedTeacher(
    cls: SchedulingClass,
    subject: CourseCategory
  ): SchedulingTeacher | undefined {
    // 班主任如果是语文/数学老师，优先教自己班
    if (cls.headTeacherId) {
      const headTeacher = this.teachers.find(t => t.id === cls.headTeacherId);
      if (headTeacher && canTeachSubject(headTeacher, subject)) {
        return headTeacher;
      }
    }
    
    // 科任如果是语文/数学老师
    if (cls.subTeacherId) {
      const subTeacher = this.teachers.find(t => t.id === cls.subTeacherId);
      if (subTeacher && canTeachSubject(subTeacher, subject)) {
        return subTeacher;
      }
    }
    
    return undefined;
  }

  /**
   * 选择最合适的教师
   */
  private selectBestTeacher(
    candidates: SchedulingTeacher[],
    cls: SchedulingClass,
    subject: CourseCategory,
    requiredHours: number
  ): SchedulingTeacher | undefined {
    if (candidates.length === 0) return undefined;
    
    // 排序优先级：
    // 1. 班主任/科任优先
    // 2. 课时缺口大的优先（需要更多课）
    // 3. 已教班级数少的优先
    const sorted = candidates
      .filter(t => {
        // 检查课时是否还有空间
        const remaining = t.maxWeeklyHours - (this.teacherWorkloads.get(t.id) || 0);
        return remaining >= requiredHours;
      })
      .sort((a, b) => {
        // 班主任/科任优先
        const aIsHeadOrSub = a.headTeacherClassId === cls.id || a.subTeacherClassId === cls.id;
        const bIsHeadOrSub = b.headTeacherClassId === cls.id || b.subTeacherClassId === cls.id;
        if (aIsHeadOrSub && !bIsHeadOrSub) return -1;
        if (!aIsHeadOrSub && bIsHeadOrSub) return 1;
        
        // 课时缺口大的优先
        const aGap = a.baseWeeklyHours - (this.teacherWorkloads.get(a.id) || 0);
        const bGap = b.baseWeeklyHours - (this.teacherWorkloads.get(b.id) || 0);
        return bGap - aGap;
      });
    
    return sorted[0];
  }

  /**
   * 为班级分配科目课时
   * 
   * 对于主科（语文、数学）：
   * - 语文：所有年级确保每天至少有1节
   * - 数学：中高年级（3-6）确保每天至少有1节，低年级不强制
   * - 剩余课时按优先上午原则分配
   */
  private assignSubjectToClass(
    cls: SchedulingClass,
    teacher: SchedulingTeacher,
    subject: CourseCategory,
    weeklyHours: number,
    grade: number
  ) {
    // 主科分配逻辑
    if (isMainSubject(subject)) {
      // 判断是否需要确保每天都有该科目
      // 语文：所有年级都需要每天都有
      // 数学：只有中高年级（3-6）需要每天都有
      const needDailySubject = subject === '语文' || (subject === '数学' && grade >= 3);
      
      if (needDailySubject) {
        // 第一步：确保每天至少有1节（周一至周五）
        const weekDays: WeekDay[] = [1, 2, 3, 4, 5];
        for (const weekDay of weekDays) {
          // 检查该天是否已有该科目的课
          const dayAssignments = this.assignments.filter(a => 
            a.classId === cls.id && 
            a.subject === subject && 
            a.timeSlot.weekDay === weekDay
          );
          
          if (dayAssignments.length > 0) continue; // 该天已有该科目
          
          // 获取该天可用的上午时间槽
          const availableMorningSlots = this.getAvailableSlotsForDay(cls.id, grade, weekDay, 'morning');
          
          for (const slot of availableMorningSlots) {
            // 检查教师是否可用
            if (this.isTeacherAvailable(teacher.id, slot.weekDay, slot.periodIndex)) {
              const slotId = this.generateSlotId(cls.id, slot.weekDay, slot.periodIndex);
              
              const assignment: SlotAssignment = {
                slotId,
                classId: cls.id,
                className: cls.name,
                grade: cls.grade,
                timeSlot: slot,
                subject,
                teacherId: teacher.id,
                teacherName: teacher.name,
              };
              
              this.addAssignment(assignment);
              this.incrementTeacherHours(teacher.id, 1);
              teacher.assignedClasses.push(cls.id);
              break; // 该天已安排，跳出
            }
          }
        }
      }
      
      // 统计已分配课时
      const assignedCount = this.assignments.filter(a => 
        a.classId === cls.id && a.subject === subject
      ).length;
      
      // 如果还有剩余课时需要分配
      if (assignedCount < weeklyHours) {
        const remainingHours = weeklyHours - assignedCount;
        const allAvailableSlots = this.getAvailableSlots(cls.id, grade, 'morning');
        
        let remaining = remainingHours;
        for (const slot of allAvailableSlots) {
          if (remaining <= 0) break;
          
          // 检查教师是否可用
          if (this.isTeacherAvailable(teacher.id, slot.weekDay, slot.periodIndex)) {
            const slotId = this.generateSlotId(cls.id, slot.weekDay, slot.periodIndex);
            
            const assignment: SlotAssignment = {
              slotId,
              classId: cls.id,
              className: cls.name,
              grade: cls.grade,
              timeSlot: slot,
              subject,
              teacherId: teacher.id,
              teacherName: teacher.name,
            };
            
            this.addAssignment(assignment);
            this.incrementTeacherHours(teacher.id, 1);
            remaining--;
          }
        }
      }
    } else {
      // 技能科：获取该班级可用的时间槽
      const availableSlots = this.getAvailableSlots(cls.id, grade, 'afternoon');
      
      // 分配课时
      let assigned = 0;
      for (const slot of availableSlots) {
        if (assigned >= weeklyHours) break;
        
        // 检查教师是否可用
        if (this.isTeacherAvailable(teacher.id, slot.weekDay, slot.periodIndex)) {
          const slotId = this.generateSlotId(cls.id, slot.weekDay, slot.periodIndex);
          
          const assignment: SlotAssignment = {
            slotId,
            classId: cls.id,
            className: cls.name,
            grade: cls.grade,
            timeSlot: slot,
            subject,
            teacherId: teacher.id,
            teacherName: teacher.name,
          };
          
          this.addAssignment(assignment);
          this.incrementTeacherHours(teacher.id, 1);
          teacher.assignedClasses.push(cls.id);
          assigned++;
        }
      }
      
      // 如果下午不够，用上午补充
      if (assigned < weeklyHours) {
        const morningSlots = this.getAvailableSlots(cls.id, grade, 'morning');
        for (const slot of morningSlots) {
          if (assigned >= weeklyHours) break;
          
          if (this.isTeacherAvailable(teacher.id, slot.weekDay, slot.periodIndex)) {
            const slotId = this.generateSlotId(cls.id, slot.weekDay, slot.periodIndex);
            
            const assignment: SlotAssignment = {
              slotId,
              classId: cls.id,
              className: cls.name,
              grade: cls.grade,
              timeSlot: slot,
              subject,
              teacherId: teacher.id,
              teacherName: teacher.name,
            };
            
            this.addAssignment(assignment);
            this.incrementTeacherHours(teacher.id, 1);
            teacher.assignedClasses.push(cls.id);
            assigned++;
          }
        }
      }
    }
  }

  /**
   * 第三阶段：分配兼任技能科
   * 
   * 班主任兼任科目：
   * - 书法：低年级2节，中高年级1节（语文老师兼任）
   * - 道德与法治：2节/周（语文老师兼任）
   * - 劳动：1节/周（数学老师兼任）
   * - 综合实践：1节/周（班主任兼任）
   * - 校本课：1-2节/周，3-6年级（班主任兼任）
   */
  private assignSecondarySubjects() {
    console.log('第三阶段：分配兼任技能科...');
    
    for (const cls of this.classes) {
      // 书法课 - 语文老师兼任，低年级2节，中高年级1节
      const chineseTeacher = this.findSubjectTeacher(cls.id, '语文');
      if (chineseTeacher) {
        const calligraphyHours = getSubjectWeeklyHours('书法', cls.grade);
        this.assignSubjectToClass(cls, chineseTeacher, '书法', calligraphyHours, cls.grade);
      }
      
      // 德法课 - 语文老师兼任，2节/周
      if (chineseTeacher) {
        const moralHours = getSubjectWeeklyHours('道德与法治', cls.grade);
        this.assignSubjectToClass(cls, chineseTeacher, '道德与法治', moralHours, cls.grade);
      }
      
      // 劳动课 - 数学老师兼任，1节/周
      const mathTeacher = this.findSubjectTeacher(cls.id, '数学');
      if (mathTeacher) {
        this.assignSubjectToClass(cls, mathTeacher, '劳动', 1, cls.grade);
      }
      
      // 综合实践 - 班主任兼任，1节/周
      if (cls.headTeacherId) {
        const headTeacher = this.teachers.find(t => t.id === cls.headTeacherId);
        if (headTeacher) {
          this.assignSubjectToClass(cls, headTeacher, '综合实践', 1, cls.grade);
        }
      }
      
      // 校本课 - 班主任兼任，3-6年级开设
      if (cls.grade >= 3 && cls.headTeacherId) {
        const headTeacher = this.teachers.find(t => t.id === cls.headTeacherId);
        if (headTeacher) {
          const schoolBasedHours = getSubjectWeeklyHours('校本课', cls.grade);
          this.assignSubjectToClass(cls, headTeacher, '校本课', schoolBasedHours, cls.grade);
        }
      }
    }
  }

  /**
   * 查找班级某科目的教师
   */
  private findSubjectTeacher(classId: string, subject: CourseCategory): SchedulingTeacher | undefined {
    const assignment = this.assignments.find(a => a.classId === classId && a.subject === subject);
    return assignment ? this.teachers.find(t => t.id === assignment.teacherId) : undefined;
  }

  /**
   * 第四阶段：分配技能科教师
   */
  private assignSkillTeachers() {
    console.log('第四阶段：分配技能科教师...');
    
    const skillSubjects: CourseCategory[] = [
      '英语', '体育', '音乐', '美术', '科学', '信息技术'
    ];
    
    for (const subject of skillSubjects) {
      for (const cls of this.classes) {
        const weeklyHours = getSubjectWeeklyHours(subject, cls.grade);
        if (weeklyHours === 0) continue; // 该年级不开设此科目
        
        // 检查是否已分配
        const existing = this.assignments.find(a => 
          a.classId === cls.id && a.subject === subject
        );
        if (existing) continue;
        
        // 找技能科教师
        const teachers = this.teachers.filter(t => 
          canTeachSubject(t, subject) &&
          canTeachGrade(t, cls.grade) &&
          this.canAssignMoreHours(t)
        );
        
        const teacher = this.selectBestTeacher(teachers, cls, subject, weeklyHours);
        
        if (teacher) {
          this.assignSubjectToClass(cls, teacher, subject, weeklyHours, cls.grade);
        } else {
          this.warnings.push({
            type: 'teacher_overload',
            message: `班级 ${cls.name} 的 ${subject} 找不到合适的教师`,
            details: { classId: cls.id, subject },
          });
        }
      }
    }
  }

  /**
   * 第五阶段：填补空槽
   */
  private fillEmptySlots() {
    console.log('第五阶段：填补空槽...');
    
    for (const cls of this.classes) {
      const totalSlots = getWeeklyPeriods(cls.grade);
      const filledSlots = this.classSlots.get(cls.id)?.size || 0;
      const emptySlots = totalSlots - filledSlots;
      
      if (emptySlots > 0) {
        // 找出空槽位置
        const allSlots = this.generateAllSlots(cls.grade);
        const availableSlots = allSlots.filter(slot => 
          !this.classSlots.get(cls.id)?.has(this.generateSlotId(cls.id, slot.weekDay, slot.periodIndex))
        );
        
        // 找课时不足的教师填补
        const underloadedTeachers = this.teachers.filter(t => 
          (this.teacherWorkloads.get(t.id) || 0) < t.minWeeklyHours
        );
        
        for (const slot of availableSlots) {
          for (const teacher of underloadedTeachers) {
            if (this.isTeacherAvailable(teacher.id, slot.weekDay, slot.periodIndex)) {
              // 根据教师可教科目选择
              const subject = teacher.teachableSubjects.find(s => isSkillSubject(s)) || '科学';
              
              const assignment: SlotAssignment = {
                slotId: this.generateSlotId(cls.id, slot.weekDay, slot.periodIndex),
                classId: cls.id,
                className: cls.name,
                grade: cls.grade,
                timeSlot: slot,
                subject,
                teacherId: teacher.id,
                teacherName: teacher.name,
              };
              
              this.addAssignment(assignment);
              this.incrementTeacherHours(teacher.id, 1);
              teacher.assignedClasses.push(cls.id);
              break;
            }
          }
        }
      }
    }
  }

  /**
   * 第六阶段：验证与调整
   */
  private validateAndAdjust() {
    console.log('第六阶段：验证与调整...');
    
    // 检查教师课时
    for (const teacher of this.teachers) {
      const hours = this.teacherWorkloads.get(teacher.id) || 0;
      
      if (hours < teacher.minWeeklyHours) {
        this.warnings.push({
          type: 'teacher_overload',
          message: `教师 ${teacher.name} 课时不足：${hours}节 < 最小${teacher.minWeeklyHours}节`,
          details: { teacherId: teacher.id, hours, minHours: teacher.minWeeklyHours },
        });
      }
      
      if (hours > teacher.maxWeeklyHours) {
        this.warnings.push({
          type: 'teacher_overload',
          message: `教师 ${teacher.name} 课时超限：${hours}节 > 最大${teacher.maxWeeklyHours}节`,
          details: { teacherId: teacher.id, hours, maxHours: teacher.maxWeeklyHours },
        });
      }
      
      // 记录调整
      if (hours !== teacher.baseWeeklyHours) {
        teacher.adjustedWeeklyHours = hours;
        teacher.adjustment = hours - teacher.baseWeeklyHours;
        
        if (teacher.adjustment !== 0) {
          this.adjustments.push({
            teacherId: teacher.id,
            teacherName: teacher.name,
            subject: teacher.primarySubject,
            originalHours: teacher.baseWeeklyHours,
            adjustedHours: hours,
            adjustment: teacher.adjustment,
            reason: teacher.adjustment > 0 ? '课时不足，增加分配' : '课时过多，减少分配',
          });
        }
      }
    }
    
    // 检查班级课表
    for (const cls of this.classes) {
      const totalSlots = getWeeklyPeriods(cls.grade);
      const filledSlots = this.classSlots.get(cls.id)?.size || 0;
      
      if (filledSlots < totalSlots) {
        this.errors.push({
          type: 'constraint_violation',
          message: `班级 ${cls.name} 课表未填满：${filledSlots}/${totalSlots}`,
          details: { classId: cls.id, filledSlots, totalSlots },
        });
      }
    }
  }

  // ==================== 辅助方法 ====================

  private generateSlotId(classId: string, weekDay: WeekDay, periodIndex: number): string {
    return `${classId}-${weekDay}-${periodIndex}`;
  }

  private addAssignment(assignment: SlotAssignment) {
    this.assignments.push(assignment);
    this.classSlots.get(assignment.classId)?.add(assignment.slotId);
    this.teacherSlots.get(assignment.teacherId)?.add(assignment.slotId);
  }

  private incrementTeacherHours(teacherId: string, hours: number) {
    const current = this.teacherWorkloads.get(teacherId) || 0;
    this.teacherWorkloads.set(teacherId, current + hours);
  }

  private canAssignMoreHours(teacher: SchedulingTeacher): boolean {
    const current = this.teacherWorkloads.get(teacher.id) || 0;
    return current < teacher.maxWeeklyHours;
  }

  private isTeacherAvailable(teacherId: string, weekDay: WeekDay, periodIndex: number): boolean {
    const slotId = `${teacherId}-${weekDay}-${periodIndex}`;
    return !this.teacherSlots.get(teacherId)?.has(slotId.replace(teacherId + '-', ''));
  }

  private getAvailableSlots(classId: string, grade: number, periodType: PeriodType): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const periods = getPeriodsByGrade(grade);
    const weekDays: WeekDay[] = [1, 2, 3, 4, 5];
    
    for (const weekDay of weekDays) {
      for (const period of periods) {
        if (period.type !== periodType) continue;
        
        const slotId = this.generateSlotId(classId, weekDay, period.index);
        if (!this.classSlots.get(classId)?.has(slotId)) {
          slots.push({
            weekDay,
            periodIndex: period.index,
            periodName: period.name,
            periodType: period.type,
          });
        }
      }
    }
    
    return slots;
  }

  /**
   * 获取指定日期的可用时间槽
   */
  private getAvailableSlotsForDay(classId: string, grade: number, weekDay: WeekDay, periodType: PeriodType): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const periods = getPeriodsByGrade(grade);
    
    for (const period of periods) {
      if (period.type !== periodType) continue;
      
      const slotId = this.generateSlotId(classId, weekDay, period.index);
      if (!this.classSlots.get(classId)?.has(slotId)) {
        slots.push({
          weekDay,
          periodIndex: period.index,
          periodName: period.name,
          periodType: period.type,
        });
      }
    }
    
    return slots;
  }

  private generateAllSlots(grade: number): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const periods = getPeriodsByGrade(grade);
    const weekDays: WeekDay[] = [1, 2, 3, 4, 5];
    
    for (const weekDay of weekDays) {
      for (const period of periods) {
        slots.push({
          weekDay,
          periodIndex: period.index,
          periodName: period.name,
          periodType: period.type,
        });
      }
    }
    
    return slots;
  }

  private groupClassesByGrade(): Map<number, SchedulingClass[]> {
    const grouped = new Map<number, SchedulingClass[]>();
    
    for (const cls of this.classes) {
      const list = grouped.get(cls.grade) || [];
      list.push(cls);
      grouped.set(cls.grade, list);
    }
    
    return grouped;
  }

  private buildResult(): SchedulingResult {
    const teacherSummaries: TeacherWorkloadSummary[] = this.teachers.map(t => ({
      teacherId: t.id,
      teacherName: t.name,
      primarySubject: t.primarySubject,
      originalHours: t.baseWeeklyHours,
      adjustedHours: t.adjustedWeeklyHours || this.teacherWorkloads.get(t.id) || 0,
      actualHours: this.teacherWorkloads.get(t.id) || 0,
      classes: this.getTeacherClassAssignments(t.id),
      adjustments: this.adjustments.filter(a => a.teacherId === t.id),
    }));
    
    const classSummaries: ClassScheduleSummary[] = this.classes.map(cls => ({
      classId: cls.id,
      className: cls.name,
      grade: cls.grade,
      totalSlots: getWeeklyPeriods(cls.grade),
      filledSlots: this.classSlots.get(cls.id)?.size || 0,
      subjectHours: this.getClassSubjectHours(cls.id),
      teachers: this.getClassTeachers(cls.id),
    }));
    
    const statistics: SchedulingStatistics = {
      totalClasses: this.classes.length,
      totalTeachers: this.teachers.length,
      totalSlots: this.classes.reduce((sum, c) => sum + getWeeklyPeriods(c.grade), 0),
      filledSlots: this.assignments.length,
      unfilledSlots: this.classSlots.size > 0 ? 
        Array.from(this.classSlots.values()).reduce((sum, slots) => 
          sum + (this.classes.find(c => this.classSlots.get(c.id) === slots) ? 
            getWeeklyPeriods(this.classes.find(c => this.classSlots.get(c.id) === slots)!.grade) - slots.size : 0
          ), 0
        ) : 0,
      averageTeacherHours: teacherSummaries.reduce((sum, t) => sum + t.actualHours, 0) / teacherSummaries.length,
      maxTeacherHours: Math.max(...teacherSummaries.map(t => t.actualHours)),
      minTeacherHours: Math.min(...teacherSummaries.map(t => t.actualHours)),
      crossGradeAssignments: this.countCrossGradeAssignments(),
      adjustmentsCount: this.adjustments.length,
    };
    
    return {
      success: this.errors.length === 0,
      assignments: this.assignments,
      teacherWorkloads: teacherSummaries,
      classSchedules: classSummaries,
      adjustments: this.adjustments,
      warnings: this.warnings,
      errors: this.errors,
      statistics,
    };
  }

  private getTeacherClassAssignments(teacherId: string): TeacherWorkloadSummary['classes'] {
    const teacherAssignments = this.assignments.filter(a => a.teacherId === teacherId);
    const classMap = new Map<string, { classId: string; className: string; subject: CourseCategory; hours: number }>();
    
    for (const a of teacherAssignments) {
      const existing = classMap.get(a.classId);
      if (existing) {
        if (existing.subject === a.subject) {
          existing.hours++;
        } else {
          // 不同科目，添加新条目
          classMap.set(`${a.classId}-${a.subject}`, {
            classId: a.classId,
            className: a.className,
            subject: a.subject,
            hours: 1,
          });
        }
      } else {
        classMap.set(a.classId, {
          classId: a.classId,
          className: a.className,
          subject: a.subject,
          hours: 1,
        });
      }
    }
    
    return Array.from(classMap.values());
  }

  private getClassSubjectHours(classId: string): Map<CourseCategory, number> {
    const hours = new Map<CourseCategory, number>();
    const classAssignments = this.assignments.filter(a => a.classId === classId);
    
    for (const a of classAssignments) {
      hours.set(a.subject, (hours.get(a.subject) || 0) + 1);
    }
    
    return hours;
  }

  private getClassTeachers(classId: string): ClassScheduleSummary['teachers'] {
    const classAssignments = this.assignments.filter(a => a.classId === classId);
    const teacherMap = new Map<string, { teacherId: string; teacherName: string; subject: CourseCategory; hours: number }>();
    
    for (const a of classAssignments) {
      const key = `${a.teacherId}-${a.subject}`;
      const existing = teacherMap.get(key);
      if (existing) {
        existing.hours++;
      } else {
        teacherMap.set(key, {
          teacherId: a.teacherId,
          teacherName: a.teacherName,
          subject: a.subject,
          hours: 1,
        });
      }
    }
    
    return Array.from(teacherMap.values());
  }

  private countCrossGradeAssignments(): number {
    let count = 0;
    for (const teacher of this.teachers) {
      const grades = new Set<number>();
      const teacherAssignments = this.assignments.filter(a => a.teacherId === teacher.id);
      
      for (const a of teacherAssignments) {
        const cls = this.classes.find(c => c.id === a.classId);
        if (cls) grades.add(cls.grade);
      }
      
      if (grades.size > 1) count++;
    }
    return count;
  }
}

export default SchedulingEngine;
