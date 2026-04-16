/**
 * 命题任务 Repository
 *
 * 数据访问层：命题任务的 CRUD 操作
 *
 * @module repositories/exam-task.repository
 */

import { BaseRepository } from './base.repository';
import type { ExamTask, ExamTaskStatus, CellProgress } from '@/types/smart-homework';

export type ExamTaskRow = {
  id: string;
  title: string;
  subject: string;
  grade: number;
  semester: string;
  exam_type: string;
  total_score: number;
  duration: number;
  specification: unknown;
  status: string;
  creator_id: string;
  creator_name: string;
  cell_progress: unknown;
  questions: unknown;
  paper_html: string | null;
  paper_docx_url: string | null;
  final_paper_id: string | null;
  progress: number;
  current_step: string | null;
  error_message: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export class ExamTaskRepository extends BaseRepository<ExamTaskRow> {
  constructor() {
    super('exam_tasks');
  }

  /**
   * 按创建者查询任务
   */
  async findByCreator(creatorId: string, options?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: ExamTaskRow[]; total: number }> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const from = (page - 1) * pageSize;

    let qb = this.client
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .eq('creator_id', creatorId);

    if (options?.status) qb = qb.eq('status', options.status);

    const { data, error, count } = await qb
      .order('updated_at', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('[ExamTaskRepo] findByCreator error:', error.message);
      return { items: [], total: 0 };
    }

    return { items: (data || []) as ExamTaskRow[], total: count || 0 };
  }

  /**
   * 查询所有任务（管理员）- 分页版
   */
  async findAllPaginated(options?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: ExamTaskRow[]; total: number }> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const from = (page - 1) * pageSize;

    let qb = this.client
      .from(this.tableName)
      .select('*', { count: 'exact' });

    if (options?.status) qb = qb.eq('status', options.status);

    const { data, error, count } = await qb
      .order('updated_at', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('[ExamTaskRepo] findAll error:', error.message);
      return { items: [], total: 0 };
    }

    return { items: (data || []) as ExamTaskRow[], total: count || 0 };
  }

  /**
   * 更新任务状态和进度
   */
  async updateStatus(id: string, status: ExamTaskStatus, updates?: Partial<{
    progress: number;
    currentStep: string;
    errorMessage: string;
    cellProgress: CellProgress[];
    questions: unknown[];
    paperHtml: string;
    paperDocxUrl: string;
    finalPaperId: string;
  }>): Promise<ExamTaskRow | null> {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (updates?.progress !== undefined) updateData.progress = updates.progress;
    if (updates?.currentStep !== undefined) updateData.current_step = updates.currentStep;
    if (updates?.errorMessage !== undefined) updateData.error_message = updates.errorMessage;
    if (updates?.cellProgress !== undefined) updateData.cell_progress = updates.cellProgress as unknown;
    if (updates?.questions !== undefined) updateData.questions = updates.questions as unknown;
    if (updates?.paperHtml !== undefined) updateData.paper_html = updates.paperHtml;
    if (updates?.paperDocxUrl !== undefined) updateData.paper_docx_url = updates.paperDocxUrl;
    if (updates?.finalPaperId !== undefined) updateData.final_paper_id = updates.finalPaperId;

    const { data, error } = await this.client
      .from(this.tableName)
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[ExamTaskRepo] updateStatus error:', error.message);
      return null;
    }

    return data as ExamTaskRow;
  }

  /**
   * 数据库行转 ExamTask 业务对象
   */
  toExamTask(row: ExamTaskRow): ExamTask {
    return {
      id: row.id,
      title: row.title,
      subject: row.subject,
      grade: row.grade,
      semester: row.semester,
      examType: row.exam_type as ExamTask['examType'],
      totalScore: row.total_score,
      duration: row.duration,
      specification: row.specification as ExamTask['specification'],
      status: row.status as ExamTaskStatus,
      creatorId: row.creator_id,
      creatorName: row.creator_name,
      cellProgress: (row.cell_progress as CellProgress[]) || [],
      questions: (row.questions as ExamTask['questions']) || [],
      paperHtml: row.paper_html || undefined,
      paperDocxUrl: row.paper_docx_url || undefined,
      finalPaperId: row.final_paper_id || undefined,
      progress: row.progress,
      currentStep: row.current_step || undefined,
      errorMessage: row.error_message || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const examTaskRepository = new ExamTaskRepository();
