/**
 * 班级周评比 Repository
 * 
 * 负责班级周评比数据的数据访问
 * 
 * @module repositories/weekly-evaluation.repository
 */

import { BaseRepository } from './base.repository';
import type {
  ClassWeeklyEvaluation,
  ClassWeeklyEvaluationRow,
  WeeklyEvaluationQueryParams,
  RoutineScoreCategory,
  WeeklyEvaluationLevel,
  EVALUATION_LEVEL_THRESHOLDS,
} from '@/types/class-routine';

/**
 * 班级周评比 Repository
 */
export class WeeklyEvaluationRepository extends BaseRepository<ClassWeeklyEvaluation> {
  constructor() {
    super('class_weekly_evaluations');
  }

  // ==================== 查询方法 ====================

  /**
   * 查询周评比记录
   */
  async queryEvaluations(params: WeeklyEvaluationQueryParams): Promise<ClassWeeklyEvaluation[]> {
    let query = this.client
      .from(this.tableName)
      .select('*');

    if (params.classId) {
      query = query.eq('class_id', params.classId);
    }
    if (params.grade !== undefined) {
      query = query.eq('grade', params.grade);
    }
    if (params.academicYear) {
      query = query.eq('academic_year', params.academicYear);
    }
    if (params.weekNumber !== undefined) {
      query = query.eq('week_number', params.weekNumber);
    }

    query = query.order('academic_year', { ascending: false });
    query = query.order('week_number', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('[WeeklyEvaluationRepository] queryEvaluations error:', error.message);
      return [];
    }

    return (data || []).map(this.toBusinessModel);
  }

  /**
   * 获取班级某周的评比
   */
  async getClassWeeklyEvaluation(
    classId: string,
    academicYear: string,
    weekNumber: number
  ): Promise<ClassWeeklyEvaluation | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('class_id', classId)
      .eq('academic_year', academicYear)
      .eq('week_number', weekNumber)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('[WeeklyEvaluationRepository] getClassWeeklyEvaluation error:', error.message);
      }
      return null;
    }

    return this.toBusinessModel(data);
  }

  /**
   * 获取年级某周的评比排名
   */
  async getGradeWeeklyRankings(
    grade: number,
    academicYear: string,
    weekNumber: number
  ): Promise<ClassWeeklyEvaluation[]> {
    const evaluations = await this.queryEvaluations({ grade, academicYear, weekNumber });

    // 按总分降序排列
    return evaluations.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * 获取班级最新周评比
   */
  async getLatestEvaluation(classId: string): Promise<ClassWeeklyEvaluation | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('class_id', classId)
      .order('academic_year', { ascending: false })
      .order('week_number', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('[WeeklyEvaluationRepository] getLatestEvaluation error:', error.message);
      }
      return null;
    }

    return this.toBusinessModel(data);
  }

  // ==================== 创建/更新方法 ====================

  /**
   * 创建或更新周评比
   */
  async upsertEvaluation(params: {
    classId: string;
    grade: number;
    academicYear: string;
    weekNumber: number;
    weekStartDate: string;
    weekEndDate: string;
    categoryScores: Record<RoutineScoreCategory, number>;
    totalScore: number;
  }): Promise<ClassWeeklyEvaluation | null> {
    const level = this.calculateLevel(params.totalScore);

    const rowData: ClassWeeklyEvaluationRow = {
      id: crypto.randomUUID(),
      class_id: params.classId,
      grade: params.grade,
      academic_year: params.academicYear,
      week_number: params.weekNumber,
      week_start_date: params.weekStartDate,
      week_end_date: params.weekEndDate,
      category_scores: params.categoryScores,
      total_score: params.totalScore,
      rank_in_grade: null,
      level,
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 使用 upsert 避免重复
    const { data, error } = await this.client
      .from(this.tableName)
      .upsert(rowData, {
        onConflict: 'class_id,academic_year,week_number',
      })
      .select()
      .single();

    if (error) {
      console.error('[WeeklyEvaluationRepository] upsertEvaluation error:', error.message);
      return null;
    }

    return this.toBusinessModel(data);
  }

  /**
   * 批量更新年级排名
   */
  async updateGradeRankings(
    grade: number,
    academicYear: string,
    weekNumber: number,
    rankings: Array<{ classId: string; rank: number }>
  ): Promise<boolean> {
    const updates = rankings.map(r => ({
      class_id: r.classId,
      rank_in_grade: r.rank,
      updated_at: new Date().toISOString(),
    }));

    // 逐个更新
    for (const update of updates) {
      const { error } = await this.client
        .from(this.tableName)
        .update({ rank_in_grade: update.rank_in_grade, updated_at: update.updated_at })
        .eq('class_id', update.class_id)
        .eq('academic_year', academicYear)
        .eq('week_number', weekNumber);

      if (error) {
        console.error('[WeeklyEvaluationRepository] updateGradeRankings error:', error.message);
        return false;
      }
    }

    return true;
  }

  // ==================== 私有方法 ====================

  /**
   * 计算等级
   */
  private calculateLevel(totalScore: number): WeeklyEvaluationLevel {
    const rate = totalScore / 60 * 100; // 总分60分（6个维度各10分）
    
    if (rate >= 90) return '优秀';
    if (rate >= 75) return '良好';
    if (rate >= 60) return '合格';
    return '待提高';
  }

  /**
   * 数据库行转业务模型
   */
  private toBusinessModel(row: ClassWeeklyEvaluationRow): ClassWeeklyEvaluation {
    return {
      id: row.id,
      classId: row.class_id,
      grade: row.grade,
      academicYear: row.academic_year,
      weekNumber: row.week_number,
      weekStartDate: row.week_start_date,
      weekEndDate: row.week_end_date,
      categoryScores: row.category_scores,
      totalScore: row.total_score,
      rankInGrade: row.rank_in_grade,
      level: row.level,
      generatedAt: row.generated_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// 导出单例实例
export const weeklyEvaluationRepository = new WeeklyEvaluationRepository();
