/**
 * 智能分工与排课系统 - 类型定义
 * 
 * 核心理念：
 * 1. 教务主任只需配置"基础信息"，系统自动生成"最佳实践"分工方案
 * 2. 分工算法与排课算法一体化，分工方案直接输入排课算法
 * 3. 提供清晰的指导和建议，而非让教务主任手动配置一切
 */

// ==================== 基础配置 ====================

/** 年级课程配置 */
export interface GradeCourseConfig {
  grade: number;          // 年级 (1-6)
  gradeName: string;      // 年级名称
  
  // 各科每周课时
  courses: {
    chinese: number;      // 语文
    math: number;         // 数学
    pe: number;           // 体育
    music: number;        // 音乐
    art: number;          // 美术
    moral: number;        // 道德与法治
    science: number;      // 科学
    english: number;      // 英语
    labor: number;        // 劳动
    meeting: number;      // 班会
  };
  
  // 每天课时数
  periodsPerDay: number;
}

/** 学校基础配置 */
export interface SchoolBaseConfig {
  name: string;
  classCount: number;           // 总班级数
  classesPerGrade: number;      // 每年级班级数
  
  // 教师配置
  teacherCount: number;
  chineseTeachers: number;
  mathTeachers: number;
  skillTeachers: {
    pe: number;
    music: number;
    art: number;
    moral: number;
    science: number;
    english: number;
  };
  
  // 年级课程配置
  gradeConfigs: GradeCourseConfig[];
}

// ==================== 分工方案 ====================

/** 教学任务（最小分配单元） */
export interface TeachingTask {
  id: string;
  classId: string;
  className: string;
  grade: number;
  subject: string;
  periodsPerWeek: number;
}

/** 教师分配结果 */
export interface TeacherAssignment {
  teacherId: string;
  teacherName: string;
  subject: string;
  
  // 分配的教学任务
  tasks: Array<{
    classId: string;
    className: string;
    grade: number;
    subject: string;
    periodsPerWeek: number;
  }>;
  
  // 统计
  totalPeriods: number;       // 总课时
  classCount: number;         // 涉及班级数
  gradeCount: number;         // 涉及年级数
  
  // 约束检查
  isCrossGrade: boolean;      // 是否跨年级
  isHeadTeacher: boolean;     // 是否班主任
  headTeacherClassId?: string; // 班主任班级
}

/** 分工方案 */
export interface DivisionPlan {
  id: string;
  name: string;
  createdAt: string;
  
  // 学校配置
  config: SchoolBaseConfig;
  
  // 所有教学任务
  allTasks: TeachingTask[];
  
  // 教师分配结果
  assignments: TeacherAssignment[];
  
  // 质量指标
  quality: {
    coverage: number;           // 任务覆盖率
    balanceScore: number;       // 工作量均衡度 (0-100)
    crossGradeRatio: number;    // 跨年级比例
    headTeacherMatch: number;   // 班主任匹配率
  };
  
  // 最佳实践建议
  recommendations: string[];
  
  // 警告信息
  warnings: string[];
}

// ==================== 排课输入 ====================

/** 排课任务（从分工方案生成） */
export interface ScheduleTask {
  id: string;
  classId: string;
  className: string;
  grade: number;
  subject: string;
  teacherId: string;
  teacherName: string;
  periodsPerWeek: number;
}

/** 排课约束 */
export interface ScheduleConstraints {
  // 硬约束
  meetingDay: number;           // 班会固定日期 (1-5, 周一到周五)
  meetingPeriod: number;        // 班会固定节次
  
  mainSubjectMorningOnly: boolean;  // 主科只在上午
  
  // 软约束权重
  weights: {
    alternation: number;        // 科目交替得分权重
    rotation: number;           // 时段轮换得分权重
    balance: number;            // 教师工作量均衡权重
  };
}

/** 排课结果 */
export interface ScheduleResult {
  id: string;
  divisionPlanId: string;
  createdAt: string;
  
  // 完整课表
  slots: ScheduleSlot[];
  
  // 质量指标
  quality: {
    coverage: number;
    conflictCount: number;
    alternationScore: number;
    rotationScore: number;
    teacherBalanceScore: number;
  };
  
  // 各班级课表
  classSchedules: Map<string, ClassSchedule>;
  
  // 各教师课表
  teacherSchedules: Map<string, TeacherSchedule>;
}

/** 单个课表位置 */
export interface ScheduleSlot {
  id: string;
  classId: string;
  className: string;
  grade: number;
  
  weekDay: number;        // 1-5
  periodIndex: number;    // 1-6
  
  subject: string;
  teacherId: string;
  teacherName: string;
}

/** 班级课表 */
export interface ClassSchedule {
  classId: string;
  className: string;
  grade: number;
  
  // 按天组织
  days: Array<{
    weekDay: number;
    periods: ScheduleSlot[];
  }>;
}

/** 教师课表 */
export interface TeacherSchedule {
  teacherId: string;
  teacherName: string;
  
  // 所有教学位置
  slots: ScheduleSlot[];
  
  // 按天组织
  days: Array<{
    weekDay: number;
    periods: ScheduleSlot[];
  }>;
}

// ==================== 最佳实践指导 ====================

/** 最佳实践建议 */
export interface BestPractice {
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'teacher' | 'class' | 'schedule' | 'constraint';
  title: string;
  description: string;
  action?: {
    label: string;
    target?: string;
  };
}

/** 智能分工指导 */
export interface DivisionGuidance {
  // 当前状态评估
  currentStatus: {
    teacherCount: number;
    classCount: number;
    avgPeriodsPerTeacher: number;
    maxPeriodsPerTeacher: number;
    minPeriodsPerTeacher: number;
  };
  
  // 最佳实践建议
  practices: BestPractice[];
  
  // 推荐配置
  recommendedConfig?: {
    chineseTeachers: number;
    mathTeachers: number;
    skillTeachers: Record<string, number>;
    reason: string;
  };
}
