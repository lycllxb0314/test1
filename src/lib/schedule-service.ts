/**
 * 智能排课系统 - 核心服务
 * 
 * 功能：
 * 1. 智能排课算法
 * 2. 与请假系统联动
 * 3. 代课管理
 * 4. 课表同步
 */

import type { 
  ScheduleSlot, 
  TeachingTask, 
  ScheduleRule, 
  ScheduleResult, 
  ScheduleConflict,
  SubstituteRecord,
  PeriodConfig,
  WeekDay
} from '@/types';

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
}

/**
 * 智能排课算法
 * 使用贪心算法 + 约束满足
 */
export function generateSchedule(context: SchedulingContext): ScheduleResult {
  const startTime = Date.now();
  const { tasks, existingSlots, rules, periods, weekDays, semester } = context;
  
  const newSlots: ScheduleSlot[] = [...existingSlots];
  const conflicts: ScheduleConflict[] = [];
  
  // 按优先级排序教学任务（主科优先、课时多的优先）
  const sortedTasks = sortTasksByPriority(tasks);
  
  // 为每个教学任务分配时间槽
  for (const task of sortedTasks) {
    const neededSlots = task.weeklyHours - task.arrangedHours;
    
    for (let i = 0; i < neededSlots; i++) {
      const bestSlot = findBestSlot(task, newSlots, rules, periods, weekDays, semester);
      
      if (bestSlot) {
        newSlots.push(bestSlot);
        task.arrangedHours++;
      } else {
        // 无法找到合适的时间槽，记录冲突
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
 */
function sortTasksByPriority(tasks: TeachingTask[]): TeachingTask[] {
  const subjectPriority: Record<string, number> = {
    '语文': 10,
    '数学': 10,
    '英语': 9,
    '科学': 8,
    '道德与法治': 7,
    '体育': 6,
    '音乐': 5,
    '美术': 5,
    '信息技术': 4,
    '阅读': 3,
  };
  
  return [...tasks].sort((a, b) => {
    // 主科优先
    const priorityA = subjectPriority[a.subject] || 1;
    const priorityB = subjectPriority[b.subject] || 1;
    if (priorityA !== priorityB) return priorityB - priorityA;
    
    // 课时多的优先
    return b.weeklyHours - a.weeklyHours;
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
  semester: string
): ScheduleSlot | null {
  // 生成所有可能的时间槽候选
  const candidates: Array<{ weekDay: WeekDay; periodIndex: number; score: number }> = [];
  
  for (const weekDay of weekDays) {
    for (const period of periods) {
      if (!period.isActive) continue;
      
      // 检查该时间槽是否可用
      const score = evaluateSlot(weekDay, period.index, task, existingSlots, rules);
      
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
 * 评估时间槽的适合程度
 */
function evaluateSlot(
  weekDay: WeekDay,
  periodIndex: number,
  task: TeachingTask,
  existingSlots: ScheduleSlot[],
  rules: ScheduleRule[]
): number {
  let score = 100;
  
  // 1. 检查教师冲突（硬约束）
  const teacherConflict = existingSlots.find(
    s => s.teacherId === task.teacherId && s.weekDay === weekDay && s.periodIndex === periodIndex
  );
  if (teacherConflict) return 0;
  
  // 2. 检查班级冲突（硬约束）
  const classConflict = existingSlots.find(
    s => s.classId === task.classId && s.weekDay === weekDay && s.periodIndex === periodIndex
  );
  if (classConflict) return 0;
  
  // 3. 主科尽量安排在上午（软约束）
  const morningSubjects = ['语文', '数学', '英语'];
  if (morningSubjects.includes(task.subject)) {
    if (periodIndex <= 4) score += 20;
    else score -= 10;
  }
  
  // 4. 体育课尽量安排在下午（软约束）
  if (task.subject === '体育') {
    if (periodIndex > 4) score += 15;
    else score -= 5;
  }
  
  // 5. 同一科目尽量分散在不同天（软约束）
  const sameSubjectSlots = existingSlots.filter(
    s => s.classId === task.classId && s.subject === task.subject
  );
  const usedDays = new Set(sameSubjectSlots.map(s => s.weekDay));
  if (!usedDays.has(weekDay)) score += 10;
  
  // 6. 避免连续同一科目（除非是连堂）
  if (periodIndex > 1) {
    const prevSlot = existingSlots.find(
      s => s.classId === task.classId && s.weekDay === weekDay && s.periodIndex === periodIndex - 1
    );
    if (prevSlot && prevSlot.subject === task.subject) {
      score -= 15;
    }
  }
  
  // 7. 上午最后一节和下午第一节不太理想
  if (periodIndex === 4 || periodIndex === 5) {
    score -= 5;
  }
  
  return score;
}

/**
 * 检测冲突
 */
function detectConflicts(slots: ScheduleSlot[], rules: ScheduleRule[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  
  // 检查教师冲突
  const teacherSlots: Record<string, ScheduleSlot[]> = {};
  for (const slot of slots) {
    const key = `${slot.teacherId}-${slot.weekDay}-${slot.periodIndex}`;
    if (!teacherSlots[key]) teacherSlots[key] = [];
    teacherSlots[key].push(slot);
  }
  
  for (const [key, slotList] of Object.entries(teacherSlots)) {
    if (slotList.length > 1) {
      conflicts.push({
        id: `conflict-teacher-${key}`,
        type: 'teacher_conflict',
        description: `${slotList[0].teacherName}在同一时间有${slotList.length}节课`,
        relatedSlots: slotList.map(s => s.id),
        severity: 'error',
      });
    }
  }
  
  // 检查班级冲突
  const classSlots: Record<string, ScheduleSlot[]> = {};
  for (const slot of slots) {
    const key = `${slot.classId}-${slot.weekDay}-${slot.periodIndex}`;
    if (!classSlots[key]) classSlots[key] = [];
    classSlots[key].push(slot);
  }
  
  for (const [key, slotList] of Object.entries(classSlots)) {
    if (slotList.length > 1) {
      conflicts.push({
        id: `conflict-class-${key}`,
        type: 'time_conflict',
        description: `${slotList[0].className}在同一时间有${slotList.length}节课`,
        relatedSlots: slotList.map(s => s.id),
        severity: 'error',
      });
    }
  }
  
  return conflicts;
}

// ==================== 请假-代课联动 ====================

/**
 * 处理请假审批通过后的课表影响
 * 返回需要安排代课的课程列表
 */
export function processLeaveApproval(params: {
  leaveRequestId: string;
  teacherId: string;
  teacherName: string;
  startDate: string;
  endDate: string;
  reason: string;
  currentSlots: ScheduleSlot[];
  semester: string;
}): SubstituteRecord[] {
  const { leaveRequestId, teacherId, teacherName, startDate, endDate, reason, currentSlots, semester } = params;
  
  // 解析日期范围
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // 计算受影响的星期几
  const affectedWeekDays = new Set<number>();
  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    // 转换为周一=1的格式
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      affectedWeekDays.add(dayOfWeek);
    }
    current.setDate(current.getDate() + 1);
  }
  
  // 找出该教师在这些天所有的课程
  const affectedSlots = currentSlots.filter(
    s => s.teacherId === teacherId && affectedWeekDays.has(s.weekDay) && s.status === 'normal'
  );
  
  // 为每节受影响的课程创建代课记录
  const substituteRecords: SubstituteRecord[] = affectedSlots.map(slot => ({
    id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    leaveRequestId,
    scheduleSlotId: slot.id,
    originalTeacherId: teacherId,
    originalTeacherName: teacherName,
    classId: slot.classId,
    className: slot.className,
    subject: slot.subject,
    courseName: slot.courseName,
    weekDay: slot.weekDay,
    periodIndex: slot.periodIndex,
    periodName: DEFAULT_PERIODS.find(p => p.index === slot.periodIndex)?.name || `第${slot.periodIndex}节`,
    semester,
    status: 'pending' as const,
    substituteType: 'temporary' as const,
    leaveTeacherName: teacherName,
    leaveReason: reason,
    leaveStartDate: startDate,
    leaveEndDate: endDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  
  return substituteRecords;
}

/**
 * 安排代课教师
 */
export function arrangeSubstitute(params: {
  substituteRecord: SubstituteRecord;
  substituteTeacherId: string;
  substituteTeacherName: string;
  arrangerId: string;
  arrangerName: string;
  remark?: string;
  currentSlots: ScheduleSlot[];
}): { updatedSlot: ScheduleSlot; updatedRecord: SubstituteRecord } {
  const { substituteRecord, substituteTeacherId, substituteTeacherName, arrangerId, arrangerName, remark, currentSlots } = params;
  
  // 找到对应的课表槽位
  const slot = currentSlots.find(s => s.id === substituteRecord.scheduleSlotId);
  if (!slot) {
    throw new Error('找不到对应的课表槽位');
  }
  
  // 检查代课教师在该时间是否有冲突
  const conflict = currentSlots.find(
    s => s.teacherId === substituteTeacherId && 
         s.weekDay === slot.weekDay && 
         s.periodIndex === slot.periodIndex &&
         s.id !== slot.id
  );
  
  if (conflict) {
    throw new Error(`${substituteTeacherName}在${WEEK_DAYS.find(d => d.key === slot.weekDay)?.label}第${slot.periodIndex}节已有课程安排`);
  }
  
  // 更新课表槽位
  const updatedSlot: ScheduleSlot = {
    ...slot,
    teacherId: substituteTeacherId,
    teacherName: substituteTeacherName,
    originalTeacherId: slot.teacherId,
    originalTeacherName: slot.teacherName,
    status: 'substituted',
    substituteRecordId: substituteRecord.id,
    updatedAt: new Date().toISOString(),
  };
  
  // 更新代课记录
  const updatedRecord: SubstituteRecord = {
    ...substituteRecord,
    substituteTeacherId,
    substituteTeacherName,
    arrangerId,
    arrangerName,
    arrangedAt: new Date().toISOString(),
    arrangeRemark: remark,
    status: 'arranged',
    updatedAt: new Date().toISOString(),
  };
  
  return { updatedSlot, updatedRecord };
}

/**
 * 获取待安排代课的课程（按年段长管理的年级筛选）
 */
export function getPendingSubstitutes(
  substitutes: SubstituteRecord[],
  managedGrades: number[],
  classes: Array<{ id: string; grade: number }>
): SubstituteRecord[] {
  // 获取管理的班级ID
  const managedClassIds = classes
    .filter(c => managedGrades.includes(c.grade))
    .map(c => c.id);
  
  // 筛选待安排的代课记录
  return substitutes.filter(
    s => s.status === 'pending' && managedClassIds.includes(s.classId)
  );
}

// ==================== 课表查询 ====================

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
  return slots.filter(s => s.teacherId === teacherId || s.originalTeacherId === teacherId);
}

/**
 * 获取年级课表概览
 */
export function getGradeScheduleOverview(
  slots: ScheduleSlot[],
  grade: number
): ScheduleSlot[] {
  return slots.filter(s => s.grade === grade);
}

/**
 * 格式化课表为二维表格
 */
export function formatScheduleAsTable(
  slots: ScheduleSlot[],
  periods: PeriodConfig[],
  weekDays: number[]
): Array<{ period: PeriodConfig; slots: (ScheduleSlot | null)[] }> {
  return periods.map(period => ({
    period,
    slots: weekDays.map(weekDay => 
      slots.find(s => s.weekDay === weekDay && s.periodIndex === period.index) || null
    ),
  }));
}

// ==================== 统计分析 ====================

/**
 * 计算教师周课时
 */
export function calculateTeacherWeeklyHours(
  slots: ScheduleSlot[],
  teacherId: string
): number {
  return slots.filter(s => s.teacherId === teacherId).length;
}

/**
 * 计算班级各科目课时
 */
export function calculateClassSubjectHours(
  slots: ScheduleSlot[],
  classId: string
): Record<string, number> {
  const hours: Record<string, number> = {};
  const classSlots = slots.filter(s => s.classId === classId);
  
  for (const slot of classSlots) {
    if (slot.subject && slot.subject !== '自习') {
      hours[slot.subject] = (hours[slot.subject] || 0) + 1;
    }
  }
  
  return hours;
}
