/**
 * 体质测评 Repository
 */
import { BaseRepository } from './base.repository';
import type { FitnessAssessment, FitnessAssessmentRow } from '@/types/health-management';

export class FitnessAssessmentRepository extends BaseRepository<FitnessAssessmentRow> {
  constructor() {
    super('fitness_assessments');
  }

  async findByStudentId(studentId: string): Promise<FitnessAssessmentRow[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('student_id', studentId)
      .order('academic_year', { ascending: false })
      .order('semester', { ascending: false });

    if (error) {
      console.error('[FitnessAssessmentRepository] findByStudentId error:', error.message);
      return [];
    }
    return (data || []) as FitnessAssessmentRow[];
  }

  async findByYearSemester(academicYear: string, semester: string): Promise<FitnessAssessmentRow[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('academic_year', academicYear)
      .eq('semester', semester)
      .order('student_id');

    if (error) {
      console.error('[FitnessAssessmentRepository] findByYearSemester error:', error.message);
      return [];
    }
    return (data || []) as FitnessAssessmentRow[];
  }

  async findByStudentYearSemester(studentId: string, academicYear: string, semester: string): Promise<FitnessAssessmentRow | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('student_id', studentId)
      .eq('academic_year', academicYear)
      .eq('semester', semester)
      .maybeSingle();

    if (error) {
      console.error('[FitnessAssessmentRepository] findByStudentYearSemester error:', error.message);
      return null;
    }
    return data as FitnessAssessmentRow | null;
  }

  async bulkInsert(records: FitnessAssessmentRow[]): Promise<number> {
    const { data, error } = await this.client
      .from(this.tableName)
      .upsert(records, { onConflict: 'student_id,academic_year,semester' });

    if (error) {
      console.error('[FitnessAssessmentRepository] bulkInsert error:', error.message);
      return 0;
    }
    return records.length;
  }

  /** 获取最近一次测评的学年学期 */
  async getLatestSemester(): Promise<{ academicYear: string; semester: string } | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('academic_year, semester')
      .order('academic_year', { ascending: false })
      .order('semester', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return { academicYear: data.academic_year, semester: data.semester };
  }

  /** 获取年级统计（可按学生ID列表筛选） */
  async getGradeStats(academicYear: string, semester: string, filterStudentIds?: string[] | null): Promise<{
    total: number;
    excellent: number;
    good: number;
    pass: number;
    fail: number;
  }> {
    let query = this.client
      .from(this.tableName)
      .select('grade_level')
      .eq('academic_year', academicYear)
      .eq('semester', semester);

    if (filterStudentIds && filterStudentIds.length > 0) {
      query = query.in('student_id', filterStudentIds);
    }

    const { data, error } = await query;

    if (error || !data) return { total: 0, excellent: 0, good: 0, pass: 0, fail: 0 };

    const stats = { total: data.length, excellent: 0, good: 0, pass: 0, fail: 0 };
    for (const row of data) {
      if (row.grade_level === '优秀') stats.excellent++;
      else if (row.grade_level === '良好') stats.good++;
      else if (row.grade_level === '及格') stats.pass++;
      else stats.fail++;
    }
    return stats;
  }
}

export const fitnessAssessmentRepository = new FitnessAssessmentRepository();
