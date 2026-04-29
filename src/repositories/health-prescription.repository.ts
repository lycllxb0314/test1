/**
 * 健康处方 Repository
 */
import { BaseRepository } from './base.repository';
import type { HealthPrescription } from '@/types/health-management';

type HealthPrescriptionRow = {
  id: string;
  student_id: string;
  portrait_id: string | null;
  prescription_type: string;
  period_type: string;
  period_start: string;
  period_end: string;
  daily_calories_target: number | null;
  nutrition_advice: Record<string, unknown> | null;
  diet_taboos: string[] | null;
  meal_suggestions: Record<string, unknown> | null;
  exercise_type: string | null;
  exercise_frequency: number | null;
  exercise_duration_min: number | null;
  exercise_intensity: string | null;
  exercise_notes: string | null;
  ai_model: string | null;
  ai_prompt_version: string | null;
  status: string;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
};

export class HealthPrescriptionRepository extends BaseRepository<HealthPrescriptionRow> {
  constructor() {
    super('health_prescriptions');
  }

  async findByStudentId(studentId: string, status?: string): Promise<HealthPrescription[]> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[HealthPrescriptionRepository] findByStudentId error:', error.message);
      return [];
    }
    return (data || []).map(this.mapFromRow);
  }

  async findActiveByStudentId(studentId: string): Promise<HealthPrescription | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[HealthPrescriptionRepository] findActiveByStudentId error:', error.message);
      return null;
    }
    return data ? this.mapFromRow(data) : null;
  }

  async countActive(): Promise<number> {
    const { count, error } = await this.client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (error) return 0;
    return count || 0;
  }

  private mapFromRow(row: HealthPrescriptionRow): HealthPrescription {
    return {
      id: row.id,
      studentId: row.student_id,
      portraitId: row.portrait_id ?? undefined,
      prescriptionType: row.prescription_type as HealthPrescription['prescriptionType'],
      periodType: row.period_type as HealthPrescription['periodType'],
      periodStart: row.period_start,
      periodEnd: row.period_end,
      dailyCaloriesTarget: row.daily_calories_target ?? undefined,
      nutritionAdvice: (row.nutrition_advice as HealthPrescription['nutritionAdvice']) ?? undefined,
      dietTaboos: row.diet_taboos ?? undefined,
      mealSuggestions: (row.meal_suggestions as HealthPrescription['mealSuggestions']) ?? undefined,
      exerciseType: row.exercise_type ?? undefined,
      exerciseFrequency: row.exercise_frequency ?? undefined,
      exerciseDurationMin: row.exercise_duration_min ?? undefined,
      exerciseIntensity: (row.exercise_intensity as HealthPrescription['exerciseIntensity']) ?? undefined,
      exerciseNotes: row.exercise_notes ?? undefined,
      aiModel: row.ai_model ?? undefined,
      aiPromptVersion: row.ai_prompt_version ?? undefined,
      status: row.status as HealthPrescription['status'],
      confirmedBy: row.confirmed_by ?? undefined,
      confirmedAt: row.confirmed_at ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const healthPrescriptionRepository = new HealthPrescriptionRepository();
