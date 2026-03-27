/**
 * 作业 Repository
 * 
 * 提供作业数据访问
 * 
 * @module repositories/homework.repository
 */

import { BaseRepository, QueryOptions, PaginatedResult } from './base.repository';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 作业类型
 */
export type HomeworkType = 'daily' | 'weekly' | 'project' | 'practice';

/**
 * 作业状态
 */
export type HomeworkStatus = 'draft' | 'published' | 'closed' | 'archived';

/**
 * 作业信息
 */
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

/**
 * 作业提交
 */
export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  classId: string;
  content?: string;
  attachments?: string[];
  submittedAt?: string;
  status: 'pending' | 'submitted' | 'late' | 'graded';
  score?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
  createdAt: string;
}

/**
 * 作业查询选项
 */
export interface HomeworkQueryOptions extends QueryOptions {
  type?: HomeworkType;
  status?: HomeworkStatus;
  subject?: string;
  classId?: string;
  teacherId?: string;
}

/**
 * 作业 Repository 类
 */
export class HomeworkRepository extends BaseRepository<Homework> {
  constructor() {
    super('homeworks');
  }

  /**
   * 根据班级查询作业
   */
  async findByClass(classId: string): Promise<Homework[]> {
    return this.findWhere({ class_id: classId });
  }

  /**
   * 根据教师查询作业
   */
  async findByTeacher(teacherId: string): Promise<Homework[]> {
    return this.findWhere({ teacher_id: teacherId });
  }

  /**
   * 查询即将到期的作业
   */
  async findUpcoming(days: number = 7): Promise<Homework[]> {
    const client = this.client;
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('status', 'published')
      .gte('due_date', now.toISOString())
      .lte('due_date', futureDate.toISOString())
      .order('due_date', { ascending: true });

    if (error) {
      console.error(`[${this.tableName}] findUpcoming error:`, error.message);
      return [];
    }

    return (data || []) as Homework[];
  }

  /**
   * 分页查询作业
   */
  async findPaginated(options: HomeworkQueryOptions = {}): Promise<PaginatedResult<Homework>> {
    const { type, status, subject, classId, teacherId, ...baseOptions } = options;

    const filters: Record<string, unknown> = {
      ...baseOptions.filters,
    };

    if (type) filters.type = type;
    if (status) filters.status = status;
    if (subject) filters.subject = subject;
    if (classId) filters.class_id = classId;
    if (teacherId) filters.teacher_id = teacherId;

    return super.findPaginated({
      ...baseOptions,
      filters,
    });
  }

  /**
   * 获取作业统计
   */
  async getStatistics(homeworkId: string): Promise<{
    totalCount: number;
    submittedCount: number;
    lateCount: number;
    pendingCount: number;
    gradedCount: number;
    avgScore: number | null;
  }> {
    const client = this.client;
    const { data, error } = await client
      .from('homework_submissions')
      .select('status, score')
      .eq('homework_id', homeworkId);

    if (error || !data) {
      return {
        totalCount: 0,
        submittedCount: 0,
        lateCount: 0,
        pendingCount: 0,
        gradedCount: 0,
        avgScore: null,
      };
    }

    const submissions = data;
    const gradedSubmissions = submissions.filter((s) => s.status === 'graded');
    const scores = gradedSubmissions
      .map((s) => s.score)
      .filter((s): s is number => s !== null && s !== undefined);

    return {
      totalCount: submissions.length,
      submittedCount: submissions.filter((s) => s.status === 'submitted').length,
      lateCount: submissions.filter((s) => s.status === 'late').length,
      pendingCount: submissions.filter((s) => s.status === 'pending').length,
      gradedCount: gradedSubmissions.length,
      avgScore: scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : null,
    };
  }
}

/**
 * 作业提交 Repository
 */
export class HomeworkSubmissionRepository extends BaseRepository<HomeworkSubmission> {
  constructor() {
    super('homework_submissions');
  }

  /**
   * 根据作业ID查询提交
   */
  async findByHomework(homeworkId: string): Promise<HomeworkSubmission[]> {
    return this.findWhere({ homework_id: homeworkId });
  }

  /**
   * 根据学生ID查询提交
   */
  async findByStudent(studentId: string): Promise<HomeworkSubmission[]> {
    return this.findWhere({ student_id: studentId });
  }

  /**
   * 获取学生某作业的提交
   */
  async findByHomeworkAndStudent(
    homeworkId: string,
    studentId: string
  ): Promise<HomeworkSubmission | null> {
    const results = await this.findWhere({
      homework_id: homeworkId,
      student_id: studentId,
    });
    return results[0] || null;
  }

  /**
   * 批量评分
   */
  async batchGrade(
    submissions: Array<{ id: string; score: number; feedback?: string }>,
    gradedBy: string
  ): Promise<HomeworkSubmission[]> {
    const client = this.client;
    const now = new Date().toISOString();

    const updates = submissions.map((s) => ({
      id: s.id,
      score: s.score,
      feedback: s.feedback,
      status: 'graded',
      graded_by: gradedBy,
      graded_at: now,
    }));

    const { data, error } = await client
      .from(this.tableName)
      .upsert(updates)
      .select();

    if (error) {
      console.error(`[${this.tableName}] batchGrade error:`, error.message);
      return [];
    }

    return (data || []) as HomeworkSubmission[];
  }
}

// 导出单例
export const homeworkRepository = new HomeworkRepository();
export const homeworkSubmissionRepository = new HomeworkSubmissionRepository();
