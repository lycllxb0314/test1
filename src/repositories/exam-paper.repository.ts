/**
 * 试卷 Repository
 *
 * 数据访问层：试卷的 CRUD 操作
 *
 * @module repositories/exam-paper.repository
 */

import { BaseRepository } from './base.repository';

type ExamPaperRow = {
  id: string;
  title: string;
  subject: string;
  grade: number;
  semester: string;
  exam_type: string;
  total_score: number;
  duration: number;
  specification: unknown;
  questions: unknown;
  layout_config: unknown;
  paper_html: string;
  status: string;
  created_by: string;
  created_by_name: string;
  is_shared: boolean;
  use_count: number;
  created_at: string;
  updated_at: string;
};

export class ExamPaperRepository extends BaseRepository<ExamPaperRow> {
  constructor() {
    super('exam_papers');
  }

  /**
   * 按创建者查询试卷
   */
  async findByCreator(createdBy: string, options?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: ExamPaperRow[]; total: number }> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const from = (page - 1) * pageSize;

    let qb = this.client
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .eq('created_by', createdBy);

    if (options?.status) qb = qb.eq('status', options.status);

    const { data, error, count } = await qb
      .order('updated_at', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('[ExamPaperRepo] findByCreator error:', error.message);
      return { items: [], total: 0 };
    }

    return { items: (data || []) as ExamPaperRow[], total: count || 0 };
  }

  /**
   * 更新试卷状态
   */
  async updateStatus(id: string, status: string): Promise<ExamPaperRow | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({ status, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[ExamPaperRepo] updateStatus error:', error.message);
      return null;
    }
    return data as ExamPaperRow;
  }

  /**
   * 更新试卷排版HTML
   */
  async updatePaperHtml(id: string, paperHtml: string): Promise<ExamPaperRow | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({ paper_html: paperHtml, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[ExamPaperRepo] updatePaperHtml error:', error.message);
      return null;
    }
    return data as ExamPaperRow;
  }
}

export const examPaperRepository = new ExamPaperRepository();
