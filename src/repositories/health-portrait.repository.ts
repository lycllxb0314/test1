/**
 * 健康画像 Repository
 */
import { BaseRepository } from './base.repository';
import type { StudentHealthPortrait } from '@/types/health-management';

type HealthPortraitRow = {
  id: string;
  student_id: string;
  bmi_status: string | null;
  bmi_trend: string | null;
  fitness_level: string | null;
  fitness_trend: string | null;
  exercise_habit_score: number | null;
  exercise_frequency: string | null;
  sleep_score: number | null;
  sleep_pattern: string | null;
  diet_score: number | null;
  diet_pattern: string | null;
  overall_health_score: number | null;
  overall_status: string | null;
  ai_summary: string | null;
  risk_factors: string[] | null;
  strengths: string[] | null;
  last_assessment_date: string | null;
  last_observation_date: string | null;
  data_sources: string[] | null;
  computed_at: string;
  updated_at: string;
};

export class HealthPortraitRepository extends BaseRepository<HealthPortraitRow> {
  constructor() {
    super('student_health_portraits');
  }

  async findByStudentId(studentId: string): Promise<StudentHealthPortrait | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) {
      console.error('[HealthPortraitRepository] findByStudentId error:', error.message);
      return null;
    }
    return data ? this.mapFromRow(data) : null;
  }

  async upsertByStudentId(studentId: string, portrait: Partial<StudentHealthPortrait>): Promise<StudentHealthPortrait | null> {
    const row = this.mapToRow(portrait);
    const { data, error } = await this.client
      .from(this.tableName)
      .upsert({
        student_id: studentId,
        ...row,
        computed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[HealthPortraitRepository] upsertByStudentId error:', error.message);
      return null;
    }
    return data ? this.mapFromRow(data) : null;
  }

  /** 获取所有画像概览（分页） */
  async findAllWithStudentInfo(page = 1, pageSize = 20, status?: string): Promise<{ portraits: (StudentHealthPortrait & { studentName?: string; className?: string })[]; total: number }> {
    let query = this.client
      .from(this.tableName)
      .select('*, students!inner(id, name, class_id)', { count: 'exact' });

    if (status) {
      query = query.eq('overall_status', status);
    }

    const from = (page - 1) * pageSize;
    const { data, error, count } = await query
      .order('overall_health_score', { ascending: true, nullsFirst: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('[HealthPortraitRepository] findAllWithStudentInfo error:', error.message);
      return { portraits: [], total: 0 };
    }

    const portraits = (data || []).map(row => ({
      ...this.mapFromRow(row),
      studentName: (row.students as Record<string, unknown>)?.name as string,
      className: (row.students as Record<string, unknown>)?.class_id as string,
    }));

    return { portraits, total: count || 0 };
  }

  private mapFromRow(row: HealthPortraitRow): StudentHealthPortrait {
    return {
      id: row.id,
      studentId: row.student_id,
      bmiStatus: (row.bmi_status as StudentHealthPortrait['bmiStatus']) ?? undefined,
      bmiTrend: (row.bmi_trend as StudentHealthPortrait['bmiTrend']) ?? undefined,
      fitnessLevel: (row.fitness_level as StudentHealthPortrait['fitnessLevel']) ?? undefined,
      fitnessTrend: (row.fitness_trend as StudentHealthPortrait['fitnessTrend']) ?? undefined,
      exerciseHabitScore: row.exercise_habit_score ?? undefined,
      exerciseFrequency: (row.exercise_frequency as StudentHealthPortrait['exerciseFrequency']) ?? undefined,
      sleepScore: row.sleep_score ?? undefined,
      sleepPattern: row.sleep_pattern ?? undefined,
      dietScore: row.diet_score ?? undefined,
      dietPattern: row.diet_pattern ?? undefined,
      overallHealthScore: row.overall_health_score ?? undefined,
      overallStatus: (row.overall_status as StudentHealthPortrait['overallStatus']) ?? undefined,
      aiSummary: row.ai_summary ?? undefined,
      riskFactors: row.risk_factors ?? undefined,
      strengths: row.strengths ?? undefined,
      lastAssessmentDate: row.last_assessment_date ?? undefined,
      lastObservationDate: row.last_observation_date ?? undefined,
      dataSources: row.data_sources ?? undefined,
      computedAt: row.computed_at,
      updatedAt: row.updated_at,
    };
  }

  private mapToRow(portrait: Partial<StudentHealthPortrait>): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    if (portrait.bmiStatus !== undefined) row.bmi_status = portrait.bmiStatus;
    if (portrait.bmiTrend !== undefined) row.bmi_trend = portrait.bmiTrend;
    if (portrait.fitnessLevel !== undefined) row.fitness_level = portrait.fitnessLevel;
    if (portrait.fitnessTrend !== undefined) row.fitness_trend = portrait.fitnessTrend;
    if (portrait.exerciseHabitScore !== undefined) row.exercise_habit_score = portrait.exerciseHabitScore;
    if (portrait.exerciseFrequency !== undefined) row.exercise_frequency = portrait.exerciseFrequency;
    if (portrait.sleepScore !== undefined) row.sleep_score = portrait.sleepScore;
    if (portrait.sleepPattern !== undefined) row.sleep_pattern = portrait.sleepPattern;
    if (portrait.dietScore !== undefined) row.diet_score = portrait.dietScore;
    if (portrait.dietPattern !== undefined) row.diet_pattern = portrait.dietPattern;
    if (portrait.overallHealthScore !== undefined) row.overall_health_score = portrait.overallHealthScore;
    if (portrait.overallStatus !== undefined) row.overall_status = portrait.overallStatus;
    if (portrait.aiSummary !== undefined) row.ai_summary = portrait.aiSummary;
    if (portrait.riskFactors !== undefined) row.risk_factors = portrait.riskFactors;
    if (portrait.strengths !== undefined) row.strengths = portrait.strengths;
    if (portrait.lastAssessmentDate !== undefined) row.last_assessment_date = portrait.lastAssessmentDate;
    if (portrait.lastObservationDate !== undefined) row.last_observation_date = portrait.lastObservationDate;
    if (portrait.dataSources !== undefined) row.data_sources = portrait.dataSources;
    return row;
  }
}

export const healthPortraitRepository = new HealthPortraitRepository();
