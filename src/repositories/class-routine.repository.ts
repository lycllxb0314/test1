/**
 * 班级常规评分 Repository
 * 
 * 负责班级常规评分记录的数据访问
 * 
 * @module repositories/class-routine.repository
 */

import { BaseRepository, type QueryOptions, type PaginatedResult } from './base.repository';
import type {
  ClassRoutineScore,
  ClassRoutineScoreRow,
  RoutineScoreQueryParams,
  CreateRoutineScoreParams,
  BatchCreateRoutineScoresParams,
  RoutineScoreCategory,
  ClassDailyScoreSummary,
  ROUTINE_SCORE_CATEGORIES,
} from '@/types/class-routine';

/**
 * 班级常规评分 Repository
 */
export class ClassRoutineRepository extends BaseRepository<ClassRoutineScore> {
  constructor() {
    super('class_routine_scores');
  }

  // ==================== 查询方法 ====================

  /**
   * 查询评分记录
   */
  async queryScores(params: RoutineScoreQueryParams): Promise<ClassRoutineScore[]> {
    let query = this.client
      .from(this.tableName)
      .select('*');

    if (params.classId) {
      query = query.eq('class_id', params.classId);
    }
    if (params.grade !== undefined) {
      query = query.eq('grade', params.grade);
    }
    if (params.date) {
      query = query.eq('date', params.date);
    }
    if (params.startDate) {
      query = query.gte('date', params.startDate);
    }
    if (params.endDate) {
      query = query.lte('date', params.endDate);
    }
    if (params.category) {
      query = query.eq('category', params.category);
    }
    if (params.teacherId) {
      query = query.eq('teacher_id', params.teacherId);
    }

    query = query.order('date', { ascending: false });
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('[ClassRoutineRepository] queryScores error:', error.message);
      return [];
    }

    return (data || []).map(this.toBusinessModel);
  }

  /**
   * 获取班级某日评分
   */
  async getClassDailyScores(classId: string, date: string): Promise<ClassRoutineScore[]> {
    return this.queryScores({ classId, date });
  }

  /**
   * 获取班级日期范围内的评分
   */
  async getClassScoresInRange(
    classId: string,
    startDate: string,
    endDate: string
  ): Promise<ClassRoutineScore[]> {
    return this.queryScores({ classId, startDate, endDate });
  }

  /**
   * 获取年级某日评分
   */
  async getGradeDailyScores(grade: number, date: string): Promise<ClassRoutineScore[]> {
    return this.queryScores({ grade, date });
  }

  /**
   * 获取班级日评分汇总
   */
  async getClassDailySummary(
    classId: string,
    date: string
  ): Promise<ClassDailyScoreSummary | null> {
    const scores = await this.getClassDailyScores(classId, date);

    if (scores.length === 0) {
      return null;
    }

    const categoryScores: ClassDailyScoreSummary['categoryScores'] = [];
    let totalScore = 0;
    let maxTotalScore = 0;

    // 按维度汇总
    const categoryMap = new Map<RoutineScoreCategory, { score: number; maxScore: number; count: number }>();

    for (const score of scores) {
      const existing = categoryMap.get(score.category) || { score: 0, maxScore: 0, count: 0 };
      existing.score += score.score;
      existing.maxScore += score.maxScore;
      existing.count += 1;
      categoryMap.set(score.category, existing);
    }

    for (const [category, data] of categoryMap) {
      categoryScores.push({
        category,
        score: data.score,
        maxScore: data.maxScore,
        recordCount: data.count,
      });
      totalScore += data.score;
      maxTotalScore += data.maxScore;
    }

    return {
      classId,
      className: scores[0]?.className || '',
      grade: scores[0].grade,
      date,
      categoryScores,
      totalScore,
      maxTotalScore,
      scoreRate: maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0,
    };
  }

  /**
   * 获取多个班级的日评分汇总
   */
  async getClassesDailySummaries(
    classIds: string[],
    date: string
  ): Promise<ClassDailyScoreSummary[]> {
    const results: ClassDailyScoreSummary[] = [];

    for (const classId of classIds) {
      const summary = await this.getClassDailySummary(classId, date);
      if (summary) {
        results.push(summary);
      }
    }

    return results;
  }

  // ==================== 创建方法 ====================

  /**
   * 创建评分记录
   */
  async createScore(params: CreateRoutineScoreParams): Promise<ClassRoutineScore | null> {
    const rowData: ClassRoutineScoreRow = {
      id: crypto.randomUUID(),
      class_id: params.classId,
      grade: params.grade,
      date: params.date,
      category: params.category,
      score: params.score,
      max_score: params.maxScore ?? 10,
      teacher_id: params.teacherId,
      teacher_name: params.teacherName,
      remark: params.remark ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.client
      .from(this.tableName)
      .insert(rowData)
      .select()
      .single();

    if (error) {
      console.error('[ClassRoutineRepository] createScore error:', error.message);
      return null;
    }

    return this.toBusinessModel(data);
  }

  /**
   * 批量创建评分记录
   */
  async batchCreateScores(params: BatchCreateRoutineScoresParams): Promise<ClassRoutineScore[]> {
    const rows: ClassRoutineScoreRow[] = params.scores.map(s => ({
      id: crypto.randomUUID(),
      class_id: params.classId,
      grade: params.grade,
      date: params.date,
      category: s.category,
      score: s.score,
      max_score: s.maxScore ?? 10,
      teacher_id: params.teacherId,
      teacher_name: params.teacherName,
      remark: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await this.client
      .from(this.tableName)
      .insert(rows)
      .select();

    if (error) {
      console.error('[ClassRoutineRepository] batchCreateScores error:', error.message);
      return [];
    }

    return (data || []).map(this.toBusinessModel);
  }

  /**
   * 删除评分记录
   */
  async deleteScore(id: string): Promise<boolean> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[ClassRoutineRepository] deleteScore error:', error.message);
      return false;
    }

    return true;
  }

  // ==================== 统计方法 ====================

  /**
   * 获取评分统计
   */
  async getStatistics(params: RoutineScoreQueryParams): Promise<{
    totalRecords: number;
    totalScore: number;
    avgScore: number;
    byCategory: Record<string, { totalScore: number; count: number; avgScore: number }>;
  }> {
    const scores = await this.queryScores(params);

    const byCategory: Record<string, { totalScore: number; count: number; avgScore: number }> = {};
    let totalScore = 0;

    for (const score of scores) {
      if (!byCategory[score.category]) {
        byCategory[score.category] = { totalScore: 0, count: 0, avgScore: 0 };
      }
      byCategory[score.category].totalScore += score.score;
      byCategory[score.category].count += 1;
      totalScore += score.score;
    }

    // 计算平均分
    for (const category of Object.keys(byCategory)) {
      const cat = byCategory[category];
      cat.avgScore = cat.count > 0 ? cat.totalScore / cat.count : 0;
    }

    return {
      totalRecords: scores.length,
      totalScore,
      avgScore: scores.length > 0 ? totalScore / scores.length : 0,
      byCategory,
    };
  }

  // ==================== 私有方法 ====================

  /**
   * 数据库行转业务模型
   */
  private toBusinessModel(row: ClassRoutineScoreRow): ClassRoutineScore {
    return {
      id: row.id,
      classId: row.class_id,
      grade: row.grade,
      date: row.date,
      category: row.category,
      score: row.score,
      maxScore: row.max_score,
      teacherId: row.teacher_id,
      teacherName: row.teacher_name,
      remark: row.remark ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// 导出单例实例
export const classRoutineRepository = new ClassRoutineRepository();
