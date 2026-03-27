/**
 * 考试管理类型定义
 * 
 * @module types/exam
 */

// ==================== 考试类型 ====================

/** 考试类型 */
export type ExamType = 'midterm' | 'final' | 'unit' | 'mock';

/** 考试状态 */
export type ExamStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'archived';

/** 考试信息 */
export interface Exam {
  id: string;
  name: string;
  type: ExamType;
  semester: string;
  grade?: number;
  subject?: string;
  startTime: string;
  endTime: string;
  status: ExamStatus;
  totalScore?: number;
  passingScore?: number;
  participantCount?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/** 考试成绩 */
export interface ExamScore {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  score: number;
  rank?: number;
  grade?: string;
  remarks?: string;
  createdAt: string;
}

/** 考试统计 */
export interface ExamStatistics {
  participantCount: number;
  avgScore: number;
  maxScore: number;
  minScore: number;
  passRate: number;
  excellentRate: number;
}

/** 考试查询参数 */
export interface ExamQueryParams {
  page?: number;
  pageSize?: number;
  type?: ExamType;
  status?: ExamStatus;
  semester?: string;
  grade?: number;
  search?: string;
}

/** 创建考试参数 */
export interface CreateExamParams {
  name: string;
  type: ExamType;
  semester: string;
  grade?: number;
  subject?: string;
  startTime: string;
  endTime: string;
  totalScore?: number;
  passingScore?: number;
  description?: string;
}

/** 更新考试参数 */
export interface UpdateExamParams extends Partial<CreateExamParams> {
  status?: ExamStatus;
}
