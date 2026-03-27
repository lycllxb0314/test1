/**
 * 习惯培养类型定义
 * 
 * @module types/habit
 */

// ==================== 习惯培养类型 ====================

/** 习惯类别 */
export type HabitCategory =
  | 'study'       // 学习习惯
  | 'life'        // 生活习惯
  | 'social'      // 社交习惯
  | 'health';     // 健康习惯

/** 习惯目标类型 */
export type HabitGoalType = 'daily' | 'weekly' | 'monthly';

/** 习惯目标 */
export interface HabitGoal {
  id: string;
  name: string;
  description?: string;
  category: HabitCategory;
  type: HabitGoalType;
  targetValue: number;
  unit?: string;
  icon?: string;
  color?: string;
  points: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 学生习惯目标状态 */
export type StudentGoalStatus = 'active' | 'completed' | 'failed';

/** 学生习惯目标（月度） */
export interface StudentHabitGoal {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  goalId: string;
  goalName: string;
  month: string; // YYYY-MM
  targetValue: number;
  currentValue: number;
  status: StudentGoalStatus;
  createdAt: string;
  updatedAt: string;
}

/** 习惯记录 */
export interface HabitRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  goalId: string;
  goalName: string;
  date: string; // YYYY-MM-DD
  value: number;
  note?: string;
  recordedBy: string;
  recordedByName: string;
  createdAt: string;
}

/** 习惯星星记录 */
export interface HabitStar {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  month: string;
  totalStars: number;
  level: number;
  rank?: number;
  createdAt: string;
  updatedAt: string;
}

/** 习惯目标查询参数 */
export interface HabitGoalQueryParams {
  page?: number;
  pageSize?: number;
  category?: HabitCategory;
  type?: HabitGoalType;
  isActive?: boolean;
  search?: string;
}

/** 记录习惯参数 */
export interface RecordHabitParams {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  goalId: string;
  date: string;
  value: number;
  note?: string;
  recordedBy: string;
  recordedByName: string;
}
