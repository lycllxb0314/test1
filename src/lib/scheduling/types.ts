/**
 * 智能排课系统 - 类型定义
 * 
 * ==================== 架构设计 ====================
 * 数据来源：从班级Hook（聚合根）和教师Hook获取数据
 * 排课规则：基于教师角色、课时配置、学段配置、任教学科
 * 
 * ==================== 排课规则核心 ====================
 * 1. 领导层（校长、书记、副校长）不排课
 * 2. 班主任/科任教师：
 *    - 有兼任职务：只上1个班的主科目课
 *    - 无兼任职务：带2个班的主科目课
 *    - 兼任本班：德法（语文老师）、劳动（数学老师）、综合实践、校本课
 *    - 班主任班队课：1课时/周
 * 3. 技能科教师：优先本年级，师资不足跨段上课
 * 4. 每天必须有语文和数学课
 * 
 * ==================== 时间安排 ====================
 * - 上午3节主科，下午综合科
 * - 第一节语数轮换
 * - 低年级（1-2）下午2节，中高年级（3-6）下午3节
 * 
 * ==================== 科目课时标准 ====================
 * （根据龙岩师范附属小学实际情况配置）
 * 
 * 语文：低年级7节，中高年级6节
 * 数学：低年级6节，中高年级5节
 * 英语：3-6年级，每周2节
 * 体育：一二年级4-5节，三至六年级3-4节
 * 音乐：一到四年级2节，五六年级1节
 * 美术：一到四年级2节，五六年级1节
 * 科学：低年级1节，三至六年级2节
 * 道德与法治：所有年级2节
 * 劳动：每周1节
 * 信息技术：三年级开始，每周1节
 * 校本课：3-6年级，每周1-2节（班主任上）
 * 综合实践：每周1节（班主任上）
 */

// ==================== 基础类型 ====================

/** 星期 */
export type WeekDay = 1 | 2 | 3 | 4 | 5;

/** 节次类型 */
export type PeriodType = 'morning' | 'afternoon';

/** 科目类型 */
export type SubjectType = 'main' | 'skill';

/** 课程分类 */
export type CourseCategory = 
  // === 主科 ===
  | '语文' 
  | '数学' 
  // === 技能科 ===
  | '英语'
  | '体育'
  | '音乐'
  | '美术'
  | '科学'
  | '道德与法治'
  | '劳动'
  | '班会'
  | '信息技术'
  | '校本课'
  | '综合实践';

/** 教师主要角色 */
export type TeacherPrimaryRole = 
  | 'principal'           // 校长 - 不排课
  | 'secretary'           // 书记 - 不排课
  | 'vice_principal'      // 副校长 - 不排课
  | 'head_teacher'        // 班主任
  | 'subject_teacher'     // 科任教师（语文、数学）
  | 'skill_teacher';      // 技能课教师

/** 行政兼任职务 */
export type AdministrativeRole = 
  | 'academic_director'         // 教务主任
  | 'moral_director'            // 德育主任
  | 'general_director'          // 总务主任
  | 'grade_leader'              // 年段长
  | 'research_group_leader'     // 教研组组长
  | 'research_group_deputy_leader'
  | 'young_pioneer_counselor';

/** 年级段 */
export type GradeSegment = 'low' | 'middle' | 'high';

// ==================== 科目配置 ====================

/** 科目信息 */
export interface SubjectConfig {
  name: CourseCategory;
  type: SubjectType;
  weeklyHours: {
    low: number;      // 低年级（1-2）
    middle: number;   // 中年级（3-4）
    high: number;     // 高年级（5-6）
  };
  applicableGrades: number[];  // 适用年级
  preferredPeriod: PeriodType; // 优先安排时段
  requiresSpecialRoom?: boolean;
  roomType?: string;
  // 固定时间槽（如班会固定周五下午最后一节）
  fixedSlot?: {
    weekDay: WeekDay;           // 固定星期
    periodType: 'last_afternoon' | 'first_morning' | 'specific_period';
    periodIndex?: number;       // 具体节次（periodType为specific_period时使用）
  };
}

/** 标准科目配置（根据龙岩师范附属小学实际情况） */
export const STANDARD_SUBJECTS: SubjectConfig[] = [
  // === 主科 ===
  {
    name: '语文',
    type: 'main',
    // 低年级略多，每天至少1节
    weeklyHours: { low: 7, middle: 6, high: 6 },
    applicableGrades: [1, 2, 3, 4, 5, 6],
    preferredPeriod: 'morning',
  },
  {
    name: '数学',
    type: 'main',
    // 每天至少1节
    weeklyHours: { low: 6, middle: 5, high: 5 },
    applicableGrades: [1, 2, 3, 4, 5, 6],
    preferredPeriod: 'morning',
  },
  // === 技能科 ===
  {
    name: '英语',
    type: 'skill',
    // 只有3-6年级有英语，每周2节
    weeklyHours: { low: 0, middle: 2, high: 2 },
    applicableGrades: [3, 4, 5, 6],
    preferredPeriod: 'afternoon',
  },
  {
    name: '道德与法治',
    type: 'skill',
    // 所有年级每周2节，语文老师兼任
    weeklyHours: { low: 2, middle: 2, high: 2 },
    applicableGrades: [1, 2, 3, 4, 5, 6],
    preferredPeriod: 'afternoon',
  },
  {
    name: '劳动',
    type: 'skill',
    // 每周1节，数学老师兼任
    weeklyHours: { low: 1, middle: 1, high: 1 },
    applicableGrades: [1, 2, 3, 4, 5, 6],
    preferredPeriod: 'afternoon',
  },
  {
    name: '科学',
    type: 'skill',
    // 低年级1节，三至六年级2节
    weeklyHours: { low: 1, middle: 2, high: 2 },
    applicableGrades: [1, 2, 3, 4, 5, 6],
    preferredPeriod: 'afternoon',
  },
  {
    name: '班会',
    type: 'skill',
    // 每周1节
    weeklyHours: { low: 1, middle: 1, high: 1 },
    applicableGrades: [1, 2, 3, 4, 5, 6],
    preferredPeriod: 'afternoon',
    // 班会固定在周五下午最后一节
    fixedSlot: { weekDay: 5, periodType: 'last_afternoon' },
  },
  {
    name: '体育',
    type: 'skill',
    // 一二年级4-5节，三至六年级3-4节
    weeklyHours: { low: 4, middle: 3, high: 3 },
    applicableGrades: [1, 2, 3, 4, 5, 6],
    preferredPeriod: 'afternoon',
  },
  {
    name: '音乐',
    type: 'skill',
    // 一到四年级2节，五六年级1节
    weeklyHours: { low: 2, middle: 2, high: 1 },
    applicableGrades: [1, 2, 3, 4, 5, 6],
    preferredPeriod: 'afternoon',
  },
  {
    name: '美术',
    type: 'skill',
    // 一到四年级2节，五六年级1节
    weeklyHours: { low: 2, middle: 2, high: 1 },
    applicableGrades: [1, 2, 3, 4, 5, 6],
    preferredPeriod: 'afternoon',
  },
  {
    name: '信息技术',
    type: 'skill',
    // 三年级开始，每周1节
    weeklyHours: { low: 0, middle: 1, high: 1 },
    applicableGrades: [3, 4, 5, 6],
    preferredPeriod: 'afternoon',
    requiresSpecialRoom: true,
    roomType: 'computer_room',
  },
  {
    name: '校本课',
    type: 'skill',
    // 3-6年级开设，每周1-2节，班主任上
    weeklyHours: { low: 0, middle: 1, high: 2 },
    applicableGrades: [3, 4, 5, 6],
    preferredPeriod: 'afternoon',
  },
  {
    name: '综合实践',
    type: 'skill',
    // 每周1节，班主任上
    weeklyHours: { low: 1, middle: 1, high: 1 },
    applicableGrades: [1, 2, 3, 4, 5, 6],
    preferredPeriod: 'afternoon',
  },
];

/**
 * 每周课时验证（龙岩师范附属小学）：
 * 
 * 低年级（1-2）：5节/天 × 5天 = 25节/周
 * - 语文7 + 数学6 + 德法2 + 劳动1 + 体育4 + 音乐2 + 美术2 + 科学1 + 班会1 + 综合实践1 = 27
 * - 注：体育可安排5节，实际可能需要调整
 * 
 * 中年级（3-4）：6节/天 × 5天 = 30节/周
 * - 语文6 + 数学5 + 英语2 + 德法2 + 劳动1 + 体育3 + 音乐2 + 美术2 + 科学2 + 班会1 + 信息技术1 + 校本课1 + 综合实践1 = 29
 * 
 * 高年级（5-6）：6节/天 × 5天 = 30节/周
 * - 语文6 + 数学5 + 英语2 + 德法2 + 劳动1 + 体育3 + 音乐1 + 美术1 + 科学2 + 班会1 + 信息技术1 + 校本课2 + 综合实践1 = 28
 */

// ==================== 节次配置 ====================

/** 节次信息 */
export interface PeriodConfig {
  index: number;
  name: string;
  startTime: string;
  endTime: string;
  type: PeriodType;
}

/** 上午节次（固定3节） */
export const MORNING_PERIODS: PeriodConfig[] = [
  { index: 1, name: '第一节', startTime: '08:00', endTime: '08:40', type: 'morning' },
  { index: 2, name: '第二节', startTime: '08:50', endTime: '09:30', type: 'morning' },
  { index: 3, name: '第三节', startTime: '10:00', endTime: '10:40', type: 'morning' },
];

/** 下午节次（低年级2节） */
export const AFTERNOON_PERIODS_LOW: PeriodConfig[] = [
  { index: 4, name: '第四节', startTime: '14:00', endTime: '14:40', type: 'afternoon' },
  { index: 5, name: '第五节', startTime: '14:50', endTime: '15:30', type: 'afternoon' },
];

/** 下午节次（中高年级3节） */
export const AFTERNOON_PERIODS_HIGH: PeriodConfig[] = [
  { index: 4, name: '第四节', startTime: '14:00', endTime: '14:40', type: 'afternoon' },
  { index: 5, name: '第五节', startTime: '14:50', endTime: '15:30', type: 'afternoon' },
  { index: 6, name: '第六节', startTime: '15:40', endTime: '16:20', type: 'afternoon' },
];

/** 获取年级对应的节次配置 */
export function getPeriodsByGrade(grade: number): PeriodConfig[] {
  const afternoonPeriods = grade <= 2 ? AFTERNOON_PERIODS_LOW : AFTERNOON_PERIODS_HIGH;
  return [...MORNING_PERIODS, ...afternoonPeriods];
}

/** 获取每日课时数 */
export function getDailyPeriods(grade: number): number {
  return grade <= 2 ? 5 : 6;
}

/** 获取每周课时数 */
export function getWeeklyPeriods(grade: number): number {
  return getDailyPeriods(grade) * 5;
}

/** 获取年级段 */
export function getGradeSegment(grade: number): GradeSegment {
  if (grade <= 2) return 'low';
  if (grade <= 4) return 'middle';
  return 'high';
}

/** 获取周五下午最后一节的节次索引 */
export function getFridayLastPeriodIndex(grade: number): number {
  // 低年级下午2节，最后一节是第5节
  // 中高年级下午3节，最后一节是第6节
  return grade <= 2 ? 5 : 6;
}

// ==================== 排课数据模型 ====================

/** 排课教师信息（从教师Hook获取） */
export interface SchedulingTeacher {
  // === 基本信息 ===
  id: string;
  name: string;
  gender?: string;
  department?: string;           // 教研组
  
  // === 角色信息（决定排课规则） ===
  primaryRole: TeacherPrimaryRole;         // 主要角色
  additionalRoles: AdministrativeRole[];   // 兼任职务（教务主任、德育主任等）
  hasAdministrativeRole: boolean;          // 是否有兼任职务
  
  // === 任课设置（教务主任配置） ===
  primarySubject: CourseCategory;          // 主教学科
  secondarySubjects: CourseCategory[];     // 兼任学科
  teachableSubjects: CourseCategory[];     // 可任教科目列表
  
  // === 学段设置（教务主任配置） ===
  teachableGrades: number[];               // 可任教年级（如[1,2,3]表示可教1-3年级）
  
  // === 课时配置（教务主任预设，核心输入） ===
  baseWeeklyHours: number;       // 基准周课时（教务主任配置，如14节）
  minWeeklyHours: number;        // 最小周课时（base - 2，如12节）
  maxWeeklyHours: number;        // 最大周课时（base + 2，如16节）
  currentWeeklyHours: number;    // 当前已排课时（初始为0）
  
  // === 班级关联 ===
  isHeadTeacher: boolean;        // 是否班主任
  headTeacherClassId?: string;   // 班主任班级ID
  headTeacherClassName?: string; // 班主任班级名称
  subTeacherClassId?: string;    // 科任班级ID
  subTeacherClassName?: string;  // 科任班级名称
  assignedClasses: string[];     // 已分配班级ID列表
  
  // === 排课状态 ===
  canTeachMainSubject: boolean;   // 是否可上主科（语/数）
  mainSubjectClassCount: number;  // 主科带班数（有兼任=1，无兼任=2）
  
  // === 排课结果 ===
  adjustedWeeklyHours?: number;   // 调整后的周课时
  adjustment?: number;            // 调整幅度（正/负，范围[-2,+2]）
  assignmentDetails?: TeacherAssignmentDetail[]; // 具体分配详情
}

/** 教师分配详情 */
export interface TeacherAssignmentDetail {
  classId: string;
  className: string;
  grade: number;
  subject: CourseCategory;
  weeklyHours: number;
  slots: TimeSlot[];
}

/** 排课班级信息 */
export interface SchedulingClass {
  id: string;
  name: string;
  grade: number;
  segment: GradeSegment;
  classNumber: number;
  
  // 教师关联
  headTeacherId?: string;
  headTeacherName?: string;
  subTeacherId?: string;
  subTeacherName?: string;
  
  // 课时需求
  weeklyPeriods: number;         // 每周总课时
  subjectRequirements: Map<CourseCategory, number>; // 各科目课时需求
  
  // 学生信息
  studentCount?: number;
  
  // 已安排
  arrangedSlots: SlotAssignment[];
}

/** 时间槽 */
export interface TimeSlot {
  weekDay: WeekDay;
  periodIndex: number;
  periodName: string;
  periodType: PeriodType;
}

/** 槽位分配 */
export interface SlotAssignment {
  slotId: string;
  classId: string;
  className: string;
  grade: number;
  timeSlot: TimeSlot;
  subject: CourseCategory;
  teacherId: string;
  teacherName: string;
}

/** 教师课时分配 */
export interface TeacherAssignment {
  teacherId: string;
  teacherName: string;
  subject: CourseCategory;
  classId: string;
  className: string;
  weeklyHours: number;
  assignedSlots: TimeSlot[];
}

// ==================== 排课规则 ====================

/** 排课约束 */
export interface SchedulingConstraint {
  type: 'hard' | 'soft';
  name: string;
  description: string;
  check: (context: SchedulingContext) => boolean;
}

/** 排课上下文 */
export interface SchedulingContext {
  teachers: SchedulingTeacher[];
  classes: SchedulingClass[];
  assignments: SlotAssignment[];
  rules: SchedulingRule[];
}

/** 排课规则 */
export interface SchedulingRule {
  id: string;
  name: string;
  priority: number;
  enabled: boolean;
  description: string;
}

/** 预设规则 */
export const DEFAULT_SCHEDULING_RULES: SchedulingRule[] = [
  {
    id: 'leader_no_teaching',
    name: '领导层不排课',
    priority: 100,
    enabled: true,
    description: '校长、书记、副校长不安排课程',
  },
  {
    id: 'admin_single_class',
    name: '兼任职务单班主科',
    priority: 90,
    enabled: true,
    description: '有兼任职务的班主任/科任只上1个班的主科目课',
  },
  {
    id: 'no_admin_double_class',
    name: '无兼任双班主科',
    priority: 85,
    enabled: true,
    description: '无兼任职务的科任教师带2个班的主科目课',
  },
  {
    id: 'morning_main_subject',
    name: '上午主科',
    priority: 80,
    enabled: true,
    description: '上午安排主科（语文、数学）',
  },
  {
    id: 'afternoon_skill',
    name: '下午技能科',
    priority: 75,
    enabled: true,
    description: '下午安排技能科（英语、体育、音乐、美术、科学、德法、劳动等）',
  },
  {
    id: 'first_period_rotation',
    name: '第一节语数轮换',
    priority: 70,
    enabled: true,
    description: '每天第一节语文数学轮换，不能连续相同',
  },
  {
    id: 'chinese_moral',
    name: '语文兼任德法',
    priority: 65,
    enabled: true,
    description: '语文老师兼任本班道德与法治课',
  },
  {
    id: 'math_labor',
    name: '数学兼任劳动',
    priority: 65,
    enabled: true,
    description: '数学老师兼任本班劳动课',
  },
  {
    id: 'homeroom_class_meeting',
    name: '班主任班队课',
    priority: 95,
    enabled: true,
    description: '班队课固定在周五下午最后一节，由班主任负责',
  },
  {
    id: 'skill_grade_priority',
    name: '技能科年级优先',
    priority: 55,
    enabled: true,
    description: '技能科教师优先安排本年级课程，师资不足时跨段上课',
  },
  {
    id: 'fill_all_slots',
    name: '课表填满',
    priority: 100,
    enabled: true,
    description: '所有时间槽必须填满，无空课',
  },
];

// ==================== 排课结果 ====================

/** 排课结果 */
export interface SchedulingResult {
  success: boolean;
  assignments: SlotAssignment[];
  teacherWorkloads: TeacherWorkloadSummary[];
  classSchedules: ClassScheduleSummary[];
  adjustments: WorkloadAdjustment[];
  warnings: SchedulingWarning[];
  errors: SchedulingError[];
  statistics: SchedulingStatistics;
}

/** 教师工作量汇总 */
export interface TeacherWorkloadSummary {
  teacherId: string;
  teacherName: string;
  primarySubject: CourseCategory;
  originalHours: number;
  adjustedHours: number;
  actualHours: number;
  classes: { classId: string; className: string; subject: CourseCategory; hours: number }[];
  adjustments: WorkloadAdjustment[];
}

/** 班级课表汇总 */
export interface ClassScheduleSummary {
  classId: string;
  className: string;
  grade: number;
  totalSlots: number;
  filledSlots: number;
  subjectHours: Map<CourseCategory, number>;
  teachers: { teacherId: string; teacherName: string; subject: CourseCategory; hours: number }[];
}

/** 课时调整 */
export interface WorkloadAdjustment {
  teacherId: string;
  teacherName: string;
  subject: CourseCategory;
  originalHours: number;
  adjustedHours: number;
  adjustment: number;
  reason: string;
}

/** 排课警告 */
export interface SchedulingWarning {
  type: 'teacher_overload' | 'cross_grade' | 'schedule_conflict' | 'unusual_arrangement';
  message: string;
  details: Record<string, unknown>;
}

/** 排课错误 */
export interface SchedulingError {
  type: 'no_teacher_available' | 'conflict' | 'constraint_violation' | 'data_missing';
  message: string;
  details: Record<string, unknown>;
}

/** 排课统计 */
export interface SchedulingStatistics {
  totalClasses: number;
  totalTeachers: number;
  totalSlots: number;
  filledSlots: number;
  unfilledSlots: number;
  averageTeacherHours: number;
  maxTeacherHours: number;
  minTeacherHours: number;
  crossGradeAssignments: number;
  adjustmentsCount: number;
}

// ==================== 草稿与发布 ====================

/** 排课草稿 */
export interface ScheduleDraft {
  id: string;
  name: string;
  semester: string;
  status: 'draft' | 'reviewing' | 'confirmed';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  // 排课输入数据
  teachers: SchedulingTeacher[];
  classes: SchedulingClass[];
  // 排课结果
  result: SchedulingResult;
  // 手动调整记录
  manualAdjustments: ManualAdjustment[];
}

/** 手动调整记录 */
export interface ManualAdjustment {
  id: string;
  slotId: string;
  type: 'change_teacher' | 'change_subject' | 'swap_slots';
  before: Partial<SlotAssignment>;
  after: Partial<SlotAssignment>;
  reason: string;
  adjustedBy: string;
  adjustedAt: string;
}

/** 发布结果 */
export interface PublishResult {
  success: boolean;
  publishedAt: string;
  affectedClasses: string[];
  affectedTeachers: string[];
  syncedToDatabase: boolean;
}
