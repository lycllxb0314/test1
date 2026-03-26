/**
 * 成绩类型定义
 * 
 * @module types/grade
 */

// ==================== 成绩等级 ====================

/** 成绩等级 */
export type GradeLevel = 
  | 'excellent'  // 优秀
  | 'good'       // 良好
  | 'pass'       // 及格
  | 'fail';      // 不及格

/** 成绩等级标签 */
export const GRADE_LEVEL_LABELS: Record<GradeLevel, string> = {
  excellent: '优秀',
  good: '良好',
  pass: '及格',
  fail: '不及格',
};

// ==================== 成绩记录 ====================

/** 学生成绩记录 */
export interface StudentGrade {
  id: string;
  studentId: string;
  studentName: string;
  studentNo: string;
  classId: string;
  className: string;
  grade: number;
  courseId: string;
  courseName: string;
  examType: 'midterm' | 'final' | 'quiz' | 'other';
  examName: string;
  semester: string;
  score: number;
  level?: GradeLevel;
  classRank?: number;
  classTotal?: number;
  gradeRank?: number;
  gradeTotal?: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

/** 成绩录入请求 */
export interface CreateGradeRequest {
  studentId: string;
  courseId: string;
  examType: 'midterm' | 'final' | 'quiz' | 'other';
  examName: string;
  semester: string;
  score: number;
  note?: string;
}

// ==================== 成绩统计 ====================

/** 班级成绩统计 */
export interface ClassGradeStatistics {
  classId: string;
  className: string;
  courseId: string;
  courseName: string;
  examType: string;
  examName: string;
  semester: string;
  totalStudents: number;
  avgScore: number;
  maxScore: number;
  minScore: number;
  medianScore: number;
  standardDeviation: number;
  excellentCount: number;
  goodCount: number;
  passCount: number;
  failCount: number;
  excellentRate: number;
  passRate: number;
  scoreDistribution: ScoreDistribution;
}

/** 分数段分布 */
export interface ScoreDistribution {
  '0-59': number;
  '60-69': number;
  '70-79': number;
  '80-89': number;
  '90-100': number;
}

/** 学生学期成绩汇总 */
export interface StudentSemesterGrades {
  studentId: string;
  studentName: string;
  studentNo: string;
  classId: string;
  className: string;
  grade: number;
  semester: string;
  courses: StudentCourseGrade[];
  totalScore: number;
  avgScore: number;
  classRank?: number;
  gradeRank?: number;
}

/** 学生单科成绩 */
export interface StudentCourseGrade {
  courseId: string;
  courseName: string;
  midtermScore?: number;
  finalScore?: number;
  quizScores: { examName: string; score: number }[];
  avgScore: number;
}

// ==================== 考试管理 ====================

/** 考试类型 */
export type ExamType = 'midterm' | 'final' | 'quiz' | 'mock';

/** 考试信息 */
export interface Exam {
  id: string;
  name: string;
  type: ExamType | '期中考试' | '期末考试' | '单元测试' | '模拟考试' | '其他';
  semester: string;
  startDate: string;
  endDate: string;
  grades: number[];
  subjects?: string[];                  // 考试科目（兼容字段）
  courses: ExamCourse[];
  status: 'planned' | 'ongoing' | 'grading' | 'completed';
  createdAt: string;
  updatedAt: string;
}

/** 考试科目 */
export interface ExamCourse {
  courseId: string;
  courseName: string;
  examDate: string;
  startTime: string;
  endTime: string;
  totalScore: number;
  passingScore: number;
  duration: number; // 分钟
}

// ==================== 成绩筛选 ====================

/** 成绩筛选条件 */
export interface GradeFilters {
  classId?: string;
  grade?: number | 'all';
  courseId?: string;
  examType?: 'midterm' | 'final' | 'quiz' | 'all';
  semester?: string;
}
