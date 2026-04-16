/**
 * 校本题库 Repository
 *
 * 数据访问层：试题的 CRUD 操作
 *
 * @module repositories/question-bank.repository
 */

import { BaseRepository } from './base.repository';
import type { QuestionBankQuery } from '@/types/smart-homework';

type QuestionRow = {
  id: string;
  title: string;
  content: string;
  question_type: string;
  subject: string;
  grade: number;
  semester: string;
  knowledge_points: string[];
  difficulty: string;
  difficulty_score: number;
  discrimination_score: number;
  cognitive_level: string;
  options: unknown;
  answer: string;
  answer_explanation: string;
  score: number;
  tags: string[];
  source: string;
  source_info: Record<string, unknown>;
  created_by: string;
  created_by_name: string;
  is_shared: boolean;
  use_count: number;
  created_at: string;
  updated_at: string;
};

export class QuestionBankRepository extends BaseRepository<QuestionRow> {
  constructor() {
    super('school_question_bank');
  }

  /**
   * 按条件查询题目
   */
  async findByQuery(query: QuestionBankQuery): Promise<{ items: QuestionRow[]; total: number }> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const from = (page - 1) * pageSize;

    let qb = this.client
      .from(this.tableName)
      .select('*', { count: 'exact' });

    if (query.subject) qb = qb.eq('subject', query.subject);
    if (query.grade) qb = qb.eq('grade', query.grade);
    if (query.semester) qb = qb.eq('semester', query.semester);
    if (query.questionType) qb = qb.eq('question_type', query.questionType);
    if (query.difficulty) qb = qb.eq('difficulty', query.difficulty);
    if (query.knowledgePoint) qb = qb.contains('knowledge_points', [query.knowledgePoint]);
    if (query.keyword) qb = qb.or(`title.ilike.%${query.keyword}%,content.ilike.%${query.keyword}%`);

    const { data, error, count } = await qb
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('[QuestionBankRepo] findByQuery error:', error.message);
      return { items: [], total: 0 };
    }

    return { items: (data || []) as QuestionRow[], total: count || 0 };
  }

  /**
   * 根据ID列表获取题目
   */
  async findByIds(ids: string[]): Promise<QuestionRow[]> {
    if (ids.length === 0) return [];
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .in('id', ids);

    if (error) {
      console.error('[QuestionBankRepo] findByIds error:', error.message);
      return [];
    }
    return (data || []) as QuestionRow[];
  }

  /**
   * 增加使用次数
   */
  async incrementUseCount(id: string): Promise<void> {
    const { error } = await this.client.rpc('increment_use_count', {
      table_name: 'school_question_bank',
      row_id: id,
    });
    if (error) {
      // fallback: 手动更新
      await this.client
        .from(this.tableName)
        .update({ use_count: this.client.rpc('coalesce', { val: 0 }) } as never)
        .eq('id', id);
    }
  }

  /**
   * 获取知识点列表（去重）
   */
  async getKnowledgePoints(subject: string, grade: number): Promise<string[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('knowledge_points')
      .eq('subject', subject)
      .eq('grade', grade);

    if (error || !data) return [];

    const allPoints = new Set<string>();
    for (const row of data) {
      const points = row.knowledge_points as string[];
      if (Array.isArray(points)) {
        points.forEach(p => allPoints.add(p));
      }
    }
    return Array.from(allPoints).sort();
  }
}

export const questionBankRepository = new QuestionBankRepository();
