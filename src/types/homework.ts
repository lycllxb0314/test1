/**
 * 作业管理类型定义
 * 
 * @module types/homework
 */

// ==================== 作业类型 ====================

/** 作业类型 */
export type HomeworkType = 'daily' | 'weekly' | 'project' | 'practice';

/** 作业状态 */
export type HomeworkStatus = 'draft' | 'published' | 'closed' | 'archived';

/** 作业信息 */
export interface Homework {
  id: string;
  title: string;
  description: string;
  type: HomeworkType;
  subject: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  grade: number;
  dueDate: string;
  status: HomeworkStatus;
  attachments?: string[];
  requireSubmission: boolean;
  allowLateSubmission: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 提交状态 */
export type SubmissionStatus = 'pending' | 'submitted' | 'late' | 'graded';

/** 作业提交 */
export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  classId: string;
  content?: string;
  attachments?: string[];
  submittedAt?: string;
  status: SubmissionStatus;
  score?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
  createdAt: string;
}

/** 作业统计 */
export interface HomeworkStatistics {
  totalCount: number;
  submittedCount: number;
  lateCount: number;
  pendingCount: number;
  gradedCount: number;
  avgScore: number | null;
}

/** 作业查询参数 */
export interface HomeworkQueryParams {
  page?: number;
  pageSize?: number;
  type?: HomeworkType;
  status?: HomeworkStatus;
  subject?: string;
  classId?: string;
  teacherId?: string;
  search?: string;
}

/** 创建作业参数 */
export interface CreateHomeworkParams {
  title: string;
  description: string;
  type: HomeworkType;
  subject: string;
  classId: string;
  teacherId: string;
  teacherName: string;
  className: string;
  grade: number;
  dueDate: string;
  attachments?: string[];
  requireSubmission?: boolean;
  allowLateSubmission?: boolean;
}

/** 提交作业参数 */
export interface SubmitHomeworkParams {
  homeworkId: string;
  studentId: string;
  studentName: string;
  content?: string;
  attachments?: string[];
}
