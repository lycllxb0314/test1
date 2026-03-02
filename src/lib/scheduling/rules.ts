/**
 * 智能排课规则配置
 * 
 * 基于福建省龙岩师范附属小学实际排课规则
 */

// ==================== 时间结构 ====================

/** 每周天数 */
export const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五'] as const;
export type Weekday = typeof WEEKDAYS[number];

/** 上下午时段 */
export const TIME_PERIODS = ['上午', '下午'] as const;
export type TimePeriod = typeof TIME_PERIODS[number];

/** 节次配置 */
export interface PeriodConfig {
  /** 1-2年级上午节数 */
  lowGradeMorning: number;  // 3
  /** 3-6年级上午节数 */
  highGradeMorning: number; // 3
  /** 1-2年级周一~周四下午节数 */
  lowGradeAfternoonWeekday: number; // 2
  /** 1-2年级周五下午节数 */
  lowGradeAfternoonFriday: number; // 3
  /** 3-6年级下午节数 */
  highGradeAfternoon: number; // 3
}

export const PERIOD_CONFIG: PeriodConfig = {
  lowGradeMorning: 3,
  highGradeMorning: 3,
  lowGradeAfternoonWeekday: 2,
  lowGradeAfternoonFriday: 3,
  highGradeAfternoon: 3,
};

// ==================== 课时标准 ====================

/** 年级分组 */
export const LOW_GRADES = [1, 2];   // 低年级
export const HIGH_GRADES = [3, 4, 5, 6]; // 高年级

/** 各年级周总课时 */
export const WEEKLY_TOTAL_HOURS: Record<number, number> = {
  1: 26, 2: 26,  // 一二年级
  3: 30, 4: 30, 5: 30, 6: 30,  // 三至六年级
};

/** 学科课时标准 */
export interface SubjectHours {
  name: string;
  hours: Record<number, number>; // 每个年级的周课时
}

export const SUBJECT_HOURS_CONFIG: SubjectHours[] = [
  { name: '语文', hours: { 1: 6, 2: 6, 3: 6, 4: 6, 5: 6, 6: 6 } },
  { name: '书法', hours: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 } },
  { name: '数学', hours: { 1: 4, 2: 4, 3: 5, 4: 5, 5: 5, 6: 5 } },
  { name: '英语', hours: { 1: 0, 2: 0, 3: 2, 4: 2, 5: 2, 6: 2 } },
  { name: '道德与法治', hours: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 } },
  { name: '科学', hours: { 1: 2, 2: 2, 3: 3, 4: 3, 5: 3, 6: 3 } },
  { name: '体育', hours: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3 } },
  { name: '音乐', hours: { 1: 2, 2: 2, 3: 1, 4: 1, 5: 1, 6: 1 } },
  { name: '美术', hours: { 1: 2, 2: 2, 3: 1, 4: 1, 5: 1, 6: 1 } },
  { name: '劳动', hours: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 } },
  { name: '综合实践', hours: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 } },
  { name: '信息技术', hours: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 1, 6: 1 } },
  { name: '校本', hours: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 } },
  { name: '心育', hours: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 1, 6: 1 } },
  { name: '班会', hours: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 } },
];

/** 主科（语文、数学） */
export const MAIN_SUBJECTS = ['语文', '数学'] as const;

/** 技能科（除语数外的科目） */
export const SKILL_SUBJECTS = [
  '道德与法治', '科学', '体育', '音乐', '美术', 
  '劳动', '综合实践', '信息技术'
] as const;

/** 语文教师兼任科目 */
export const CHINESE_SECONDARY = ['道德与法治', '书法'] as const;

/** 数学教师兼任科目 */
export const MATH_SECONDARY = ['劳动', '科学'] as const;

// ==================== 硬约束 ====================

/** 硬约束类型 */
export enum HardConstraint {
  // 课时约束
  WEEKLY_HOURS_LIMIT = 'WEEKLY_HOURS_LIMIT',           // 周课时限制
  SUBJECT_HOURS_MATCH = 'SUBJECT_HOURS_MATCH',         // 学科课时匹配
  
  // 时间约束
  CLASS_MEETING_FIXED = 'CLASS_MEETING_FIXED',         // 班会固定周五下午第三节
  TEACHER_NO_CONFLICT = 'TEACHER_NO_CONFLICT',         // 同一教师同一时间只能上一节课
  MAIN_SUBJECT_MORNING = 'MAIN_SUBJECT_MORNING',       // 语数必须上午
  SKILL_SUBJECT_AFTERNOON = 'SKILL_SUBJECT_AFTERNOON', // 技能科优先下午
  
  // 年级约束
  CHINESE_NO_CROSS_GRADE = 'CHINESE_NO_CROSS_GRADE',   // 语文不跨年级
  MATH_NO_CROSS_GRADE = 'MATH_NO_CROSS_GRADE',         // 数学不跨年级
  SKILL_CROSS_GRADE_OK = 'SKILL_CROSS_GRADE_OK',       // 技能科允许跨段
  
  // 兼任约束
  CHINESE_MUST_TEACH_DAOFA = 'CHINESE_MUST_TEACH_DAOFA', // 语文教师必须兼任道法
  MATH_MUST_TEACH_LABOR = 'MATH_MUST_TEACH_LABOR',       // 数学教师必须兼任劳动
  
  // 排课约束
  SINGLE_DAY_CHINESE_LIMIT = 'SINGLE_DAY_CHINESE_LIMIT', // 单日语文≤2节
  SINGLE_DAY_MATH_LIMIT = 'SINGLE_DAY_MATH_LIMIT',       // 单日数学≤2节
  SINGLE_DAY_SKILL_LIMIT = 'SINGLE_DAY_SKILL_LIMIT',     // 其他科目单日≤1节
  
  // 轮换约束
  FIRST_PERIOD_ROTATE = 'FIRST_PERIOD_ROTATE',           // 第一节语数轮换
  NO_CONSECUTIVE_SAME_FIRST = 'NO_CONSECUTIVE_SAME_FIRST', // 连续两天第一节不同科目
  NO_THREE_CONSECUTIVE = 'NO_THREE_CONSECUTIVE',         // 不允许3节及以上连排
  
  // 教师约束
  TEACHER_WEEKLY_LIMIT = 'TEACHER_WEEKLY_LIMIT',         // 教师周课时不超过限额
  CHINESE_TUESDAY_BAN = 'CHINESE_TUESDAY_BAN',           // 语文教师周二下午第二节禁排（兼任技能科时）
  MATH_WEDNESDAY_BAN = 'MATH_WEDNESDAY_BAN',             // 数学教师周三下午第二节禁排（兼任技能科时）
}

// ==================== 软约束 ====================

/** 软约束类型及扣分权重 */
export enum SoftConstraint {
  MINIMIZE_CONSECUTIVE = 'MINIMIZE_CONSECUTIVE',     // 连堂尽量少
  SKILL_NOT_CONSECUTIVE_DAYS = 'SKILL_NOT_CONSECUTIVE_DAYS', // 技能科不连续两天
  SUBJECTS_DISPERSED = 'SUBJECTS_DISPERSED',         // 科目分散
  TEACHER_HOURS_BALANCED = 'TEACHER_HOURS_BALANCED', // 教师课时均衡
  SCIENCE_PREFER_SPECIALIST = 'SCIENCE_PREFER_SPECIALIST', // 科学优先专职
  MAIN_SUBJECT_NOT_CONSECUTIVE = 'MAIN_SUBJECT_NOT_CONSECUTIVE', // 语数不连堂
}

/** 软约束权重 */
export const SOFT_CONSTRAINT_WEIGHTS: Record<SoftConstraint, number> = {
  [SoftConstraint.MINIMIZE_CONSECUTIVE]: 10,
  [SoftConstraint.SKILL_NOT_CONSECUTIVE_DAYS]: 5,
  [SoftConstraint.SUBJECTS_DISPERSED]: 8,
  [SoftConstraint.TEACHER_HOURS_BALANCED]: 15,
  [SoftConstraint.SCIENCE_PREFER_SPECIALIST]: 5,
  [SoftConstraint.MAIN_SUBJECT_NOT_CONSECUTIVE]: 10,
};

// ==================== 特殊时段约束 ====================

/** 班会固定时段 */
export const CLASS_MEETING_SLOT = {
  weekday: '周五' as Weekday,
  period: '下午' as TimePeriod,
  periodIndex: 3, // 下午第三节
};

/** 语文教师禁排时段（周二下午第二节） */
export const CHINESE_BAN_SLOT = {
  weekday: '周二' as Weekday,
  period: '下午' as TimePeriod,
  periodIndex: 2,
};

/** 数学教师禁排时段（周三下午第二节） */
export const MATH_BAN_SLOT = {
  weekday: '周三' as Weekday,
  period: '下午' as TimePeriod,
  periodIndex: 2,
};

// ==================== 教师职务课时减免 ====================

/** 职务课时减免 */
export const POSITION_HOURS_REDUCTION: Record<string, number> = {
  principal: 13,              // 校长
  secretary: 13,              // 书记
  vice_principal: 10,         // 副校长
  academic_director: 6,       // 教务主任
  moral_director: 6,          // 德育主任
  general_director: 6,        // 总务主任
  grade_leader: 2,            // 年段长
  research_group_leader: 1,  // 教研组长
  head_teacher: 2,            // 班主任
};

// ==================== 辅助函数 ====================

/** 判断是否低年级 */
export function isLowGrade(grade: number): boolean {
  return LOW_GRADES.includes(grade);
}

/** 获取年级下午节数 */
export function getAfternoonPeriods(grade: number, weekday: Weekday): number {
  if (isLowGrade(grade)) {
    return weekday === '周五' 
      ? PERIOD_CONFIG.lowGradeAfternoonFriday 
      : PERIOD_CONFIG.lowGradeAfternoonWeekday;
  }
  return PERIOD_CONFIG.highGradeAfternoon;
}

/** 获取年级周总课时 */
export function getWeeklyTotalHours(grade: number): number {
  return WEEKLY_TOTAL_HOURS[grade] || 30;
}

/** 获取学科在某年级的周课时 */
export function getSubjectHours(subject: string, grade: number): number {
  const config = SUBJECT_HOURS_CONFIG.find(s => s.name === subject);
  return config?.hours[grade] || 0;
}

/** 判断是否主科 */
export function isMainSubject(subject: string): boolean {
  return MAIN_SUBJECTS.includes(subject as typeof MAIN_SUBJECTS[number]);
}

/** 判断是否技能科 */
export function isSkillSubject(subject: string): boolean {
  return SKILL_SUBJECTS.includes(subject as typeof SKILL_SUBJECTS[number]);
}
