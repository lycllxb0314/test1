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
  diet_taboo_reasons: string[] | null;
  meal_suggestions: Record<string, unknown> | null;
  exercise_type: string | null;
  exercise_frequency: number | null;
  exercise_duration_min: number | null;
  exercise_intensity: string | null;
  exercise_plan: Record<string, unknown> | null;
  exercise_notes: string | null;
  ai_model: string | null;
  ai_prompt_version: string | null;
  ai_summary: string | null;
  expected_outcomes: string | null;
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

  /** 按学生ID列表统计处方数 */
  async countByStudentIds(studentIds: string[]): Promise<number> {
    if (studentIds.length === 0) return 0;
    const { count, error } = await this.client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .in('student_id', studentIds);

    if (error) return 0;
    return count || 0;
  }

  /** 获取所有处方（管理端分页，含学生信息，可按学生ID列表筛选） */
  async findAllWithStudentInfo(
    page = 1,
    pageSize = 20,
    filterStudentIds?: string[] | null,
    status?: string | null,
  ): Promise<{ prescriptions: (HealthPrescription & { studentName?: string; className?: string })[]; total: number }> {
    let query = this.client
      .from(this.tableName)
      .select('*, students!inner(id, name, class_id, class_name)', { count: 'exact' });

    if (Array.isArray(filterStudentIds) && filterStudentIds.length > 0) {
      query = query.in('student_id', filterStudentIds);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const from = (page - 1) * pageSize;
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('[HealthPrescriptionRepository] findAllWithStudentInfo error:', error.message);
      return { prescriptions: [], total: 0 };
    }

    const prescriptions = (data || []).map(row => ({
      ...this.mapFromRow(row),
      studentName: (row.students as Record<string, unknown>)?.name as string,
      className: ((row.students as Record<string, unknown>)?.class_name || (row.students as Record<string, unknown>)?.class_id) as string,
    }));

    return { prescriptions, total: count || 0 };
  }

  /** 将旧处方置为已替代 */
  async supersedeByStudentId(studentId: string): Promise<number> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({ status: 'superseded', updated_at: new Date().toISOString() })
      .eq('student_id', studentId)
      .eq('status', 'active')
      .select();

    if (error) {
      console.error('[HealthPrescriptionRepository] supersedeByStudentId error:', error.message);
      return 0;
    }
    return (data || []).length;
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
      dietTabooReasons: row.diet_taboo_reasons ?? undefined,
      mealSuggestions: (row.meal_suggestions as HealthPrescription['mealSuggestions']) ?? undefined,
      exerciseType: row.exercise_type ?? undefined,
      exerciseFrequency: row.exercise_frequency ?? undefined,
      exerciseDurationMin: row.exercise_duration_min ?? undefined,
      exerciseIntensity: (row.exercise_intensity as HealthPrescription['exerciseIntensity']) ?? undefined,
      exercisePlan: (row.exercise_plan as HealthPrescription['exercisePlan']) ?? undefined,
      exerciseNotes: row.exercise_notes ?? undefined,
      aiModel: row.ai_model ?? undefined,
      aiPromptVersion: row.ai_prompt_version ?? undefined,
      aiSummary: row.ai_summary ?? undefined,
      expectedOutcomes: row.expected_outcomes ?? undefined,
      status: row.status as HealthPrescription['status'],
      confirmedBy: row.confirmed_by ?? undefined,
      confirmedAt: row.confirmed_at ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const healthPrescriptionRepository = new HealthPrescriptionRepository();
