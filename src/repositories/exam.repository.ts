/**
 * 考试 Repository
 * 
 * 提供考试数据访问
 * 
 * @module repositories/exam.repository
 */

import { BaseRepository, QueryOptions, PaginatedResult } from './base.repository';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 考试类型
 */
export type ExamType = 'midterm' | 'final' | 'unit' | 'mock';

/**
 * 考试状态
 */
export type ExamStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'archived';

/**
 * 考试信息
 */
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

/**
 * 考试成绩
 */
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

/**
 * 考试查询选项
 */
export interface ExamQueryOptions extends QueryOptions {
  type?: ExamType;
  status?: ExamStatus;
  semester?: string;
  grade?: number;
}

/**
 * 考试 Repository 类
 */
export class ExamRepository extends BaseRepository<Exam> {
  constructor() {
    super('exams');
  }

  /**
   * 根据学期查询考试
   */
  async findBySemester(semester: string): Promise<Exam[]> {
    return this.findWhere({ semester });
  }

  /**
   * 根据状态查询考试
   */
  async findByStatus(status: ExamStatus): Promise<Exam[]> {
    return this.findWhere({ status });
  }

  /**
   * 查询进行中的考试
   */
  async findOngoing(): Promise<Exam[]> {
    return this.findByStatus('ongoing');
  }

  /**
   * 分页查询考试
   */
  async findPaginated(options: ExamQueryOptions = {}): Promise<PaginatedResult<Exam>> {
    const { type, status, semester, grade, ...baseOptions } = options;

    const filters: Record<string, unknown> = {
      ...baseOptions.filters,
    };

    if (type) filters.type = type;
    if (status) filters.status = status;
    if (semester) filters.semester = semester;
    if (grade) filters.grade = grade;

    return super.findPaginated({
      ...baseOptions,
      filters,
    });
  }

  /**
   * 更新考试状态
   */
  async updateStatus(id: string, status: ExamStatus): Promise<Exam | null> {
    return this.update(id, { status } as Partial<Exam>);
  }

  /**
   * 获取考试统计
   */
  async getStatistics(examId: string): Promise<{
    participantCount: number;
    avgScore: number;
    maxScore: number;
    minScore: number;
    passRate: number;
    excellentRate: number;
  }> {
    const client = this.client;
    const { data, error } = await client
      .from('exam_scores')
      .select('score')
      .eq('exam_id', examId);

    if (error || !data || data.length === 0) {
      return {
        participantCount: 0,
        avgScore: 0,
        maxScore: 0,
        minScore: 0,
        passRate: 0,
        excellentRate: 0,
      };
    }

    const scores = data.map((s) => s.score);
    const sum = scores.reduce((a, b) => a + b, 0);
    const avgScore = sum / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const passCount = scores.filter((s) => s >= 60).length;
    const excellentCount = scores.filter((s) => s >= 90).length;

    return {
      participantCount: scores.length,
      avgScore: Math.round(avgScore * 100) / 100,
      maxScore,
      minScore,
      passRate: Math.round((passCount / scores.length) * 100),
      excellentRate: Math.round((excellentCount / scores.length) * 100),
    };
  }
}

/**
 * 考试成绩 Repository
 */
export class ExamScoreRepository extends BaseRepository<ExamScore> {
  constructor() {
    super('exam_scores');
  }

  /**
   * 根据考试ID查询成绩
   */
  async findByExamId(examId: string): Promise<ExamScore[]> {
    return this.findWhere({ exam_id: examId });
  }

  /**
   * 根据学生ID查询成绩
   */
  async findByStudentId(studentId: string): Promise<ExamScore[]> {
    return this.findWhere({ student_id: studentId });
  }

  /**
   * 批量导入成绩
   */
  async importScores(scores: Partial<ExamScore>[]): Promise<ExamScore[]> {
    const records = scores.map((s) => ({
      ...s,
      created_at: new Date().toISOString(),
    }));

    const client = this.client;
    const { data, error } = await client
      .from(this.tableName)
      .upsert(records, { onConflict: 'exam_id,student_id' })
      .select();

    if (error) {
      console.error(`[${this.tableName}] importScores error:`, error.message);
      return [];
    }

    return (data || []) as ExamScore[];
  }

  /**
   * 获取班级成绩统计
   */
  async getClassStatistics(examId: string, classId: string): Promise<{
    count: number;
    avgScore: number;
    maxScore: number;
    minScore: number;
  }> {
    const client = this.client;
    const { data, error } = await client
      .from(this.tableName)
      .select('score')
      .eq('exam_id', examId)
      .eq('class_id', classId);

    if (error || !data || data.length === 0) {
      return { count: 0, avgScore: 0, maxScore: 0, minScore: 0 };
    }

    const scores = data.map((s) => s.score);
    return {
      count: scores.length,
      avgScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100,
      maxScore: Math.max(...scores),
      minScore: Math.min(...scores),
    };
  }
}

// 导出单例
export const examRepository = new ExamRepository();
export const examScoreRepository = new ExamScoreRepository();
