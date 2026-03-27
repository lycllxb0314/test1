/**
 * 班级常规评比类型定义
 * 
 * 业务逻辑：
 * 1. 值日老师每日按维度给班级打分
 * 2. 当天分数实时显示在班级详情页、班主任工作台
 * 3. 每周汇总生成周评比结果
 * 
 * @module types/class-routine
 */

// ==================== 枚举类型 ====================

/** 评分维度 */
export type RoutineScoreCategory =
  | '文明礼仪'
  | '遵守纪律'
  | '班容班貌'
  | '环境卫生'
  | '文体活动'
  | '学习习惯';

/** 周评比等级 */
export type WeeklyEvaluationLevel = '优秀' | '良好' | '合格' | '待提高';

// ==================== 数据库行类型 ====================

/** 班级常规评分记录 - 数据库行 */
export type ClassRoutineScoreRow = {
  id: string;
  class_id: string;
  grade: number;
  date: string;
  category: RoutineScoreCategory;
  score: number;
  max_score: number;
  teacher_id: string;
  teacher_name: string;
  remark: string | null;
  created_at: string;
  updated_at: string;
};

/** 班级周评比 - 数据库行 */
export type ClassWeeklyEvaluationRow = {
  id: string;
  class_id: string;
  grade: number;
  academic_year: string;
  week_number: number;
  week_start_date: string;
  week_end_date: string;
  category_scores: Record<RoutineScoreCategory, number>;
  total_score: number;
  rank_in_grade: number | null;
  level: WeeklyEvaluationLevel;
  generated_at: string;
  created_at: string;
  updated_at: string;
};

/** 值日教师安排 - 数据库行 */
export type DutyTeacherRow = {
  id: string;
  teacher_id: string;
  teacher_name: string;
  grade: number;
  week_day: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
};

// ==================== 业务类型 ====================

/** 班级常规评分记录 */
export type ClassRoutineScore = {
  id: string;
  classId: string;
  className?: string;
  grade: number;
  date: string;
  category: RoutineScoreCategory;
  score: number;
  maxScore: number;
  teacherId: string;
  teacherName: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
};

/** 班级周评比 */
export type ClassWeeklyEvaluation = {
  id: string;
  classId: string;
  className?: string;
  grade: number;
  academicYear: string;
  weekNumber: number;
  weekStartDate: string;
  weekEndDate: string;
  categoryScores: Record<RoutineScoreCategory, number>;
  totalScore: number;
  rankInGrade: number | null;
  level: WeeklyEvaluationLevel;
  evaluationGrade?: WeeklyEvaluationLevel; // 别名，与 level 保持一致
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
};

/** 值日教师安排 */
export type DutyTeacher = {
  id: string;
  teacherId: string;
  teacherName: string;
  grade: number;
  weekDay: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
};

// ==================== 统计类型 ====================

/** 班级日评分汇总 */
export type ClassDailyScoreSummary = {
  classId: string;
  className: string;
  grade: number;
  date: string;
  categoryScores: Array<{
    category: RoutineScoreCategory;
    score: number;
    maxScore: number;
    recordCount: number;
  }>;
  totalScore: number;
  maxTotalScore: number;
  scoreRate: number;
};

/** 班级周评分汇总 */
export type ClassWeeklyScoreSummary = {
  classId: string;
  className: string;
  grade: number;
  weekNumber: number;
  weekStartDate: string;
  weekEndDate: string;
  dailyScores: Array<{
    date: string;
    totalScore: number;
  }>;
  categoryScores: Record<RoutineScoreCategory, number>;
  totalScore: number;
  avgScore: number;
  rankInGrade?: number;
  level?: WeeklyEvaluationLevel;
};

/** 年级周评比排名 */
export type GradeWeeklyRanking = {
  grade: number;
  weekNumber: number;
  rankings: Array<{
    rank: number;
    classId: string;
    className: string;
    totalScore: number;
    level: WeeklyEvaluationLevel;
  }>;
};

// ==================== 查询参数类型 ====================

/** 评分记录查询参数 */
export type RoutineScoreQueryParams = {
  classId?: string;
  grade?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
  category?: RoutineScoreCategory;
  teacherId?: string;
};

/** 周评比查询参数 */
export type WeeklyEvaluationQueryParams = {
  classId?: string;
  grade?: number;
  academicYear?: string;
  weekNumber?: number;
};

/** 值日教师查询参数 */
export type DutyTeacherQueryParams = {
  teacherId?: string;
  grade?: number;
  weekDay?: number;
  isActive?: boolean;
};

// ==================== 创建/更新参数类型 ====================

/** 创建评分记录参数 */
export type CreateRoutineScoreParams = {
  classId: string;
  grade: number;
  date: string;
  category: RoutineScoreCategory;
  score: number;
  maxScore?: number;
  teacherId: string;
  teacherName: string;
  remark?: string;
};

/** 批量创建评分记录参数 */
export type BatchCreateRoutineScoresParams = {
  classId: string;
  grade: number;
  date: string;
  scores: Array<{
    category: RoutineScoreCategory;
    score: number;
    maxScore?: number;
  }>;
  teacherId: string;
  teacherName: string;
};

/** 创建值日教师参数 */
export type CreateDutyTeacherParams = {
  teacherId: string;
  teacherName: string;
  grade: number;
  weekDay: number;
  isActive?: boolean;
};

/** 更新值日教师参数 */
export type UpdateDutyTeacherParams = {
  id: string;
  teacherId?: string;
  teacherName?: string;
  grade?: number;
  weekDay?: number;
  isActive?: boolean;
};

// ==================== 常量配置 ====================

/** 评分维度列表 */
export const ROUTINE_SCORE_CATEGORIES: RoutineScoreCategory[] = [
  '文明礼仪',
  '遵守纪律',
  '班容班貌',
  '环境卫生',
  '文体活动',
  '学习习惯',
];

/** 各维度默认满分 */
export const ROUTINE_CATEGORY_MAX_SCORES: Record<RoutineScoreCategory, number> = {
  '文明礼仪': 10,
  '遵守纪律': 10,
  '班容班貌': 10,
  '环境卫生': 10,
  '文体活动': 10,
  '学习习惯': 10,
};

/** 维度颜色配置 */
export const ROUTINE_CATEGORY_COLORS: Record<RoutineScoreCategory, string> = {
  '文明礼仪': '#f43f5e',
  '遵守纪律': '#f97316',
  '班容班貌': '#eab308',
  '环境卫生': '#22c55e',
  '文体活动': '#3b82f6',
  '学习习惯': '#8b5cf6',
};

/** 维度标签配置（用于显示） */
export const ROUTINE_CATEGORY_LABELS: Record<RoutineScoreCategory, string> = {
  '文明礼仪': '文明礼仪',
  '遵守纪律': '遵守纪律',
  '班容班貌': '班容班貌',
  '环境卫生': '环境卫生',
  '文体活动': '文体活动',
  '学习习惯': '学习习惯',
};

/** 等级分数阈值 */
export const EVALUATION_LEVEL_THRESHOLDS = {
  '优秀': 90,
  '良好': 75,
  '合格': 60,
  '待提高': 0,
};

/** 星期映射 */
export const WEEK_DAY_LABELS: Record<number, string> = {
  0: '每天',
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
};
