/**
 * 家长每日观察 Repository
 */
import { BaseRepository } from './base.repository';
import type { ParentDailyObservationRow } from '@/types/health-management';

export class ParentObservationRepository extends BaseRepository<ParentDailyObservationRow> {
  constructor() {
    super('parent_daily_observations');
  }

  async findByStudentId(studentId: string, days = 30): Promise<ParentDailyObservationRow[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('student_id', studentId)
      .gte('observation_date', startDate.toISOString().split('T')[0])
      .order('observation_date', { ascending: false });

    if (error) {
      console.error('[ParentObservationRepository] findByStudentId error:', error.message);
      return [];
    }
    return (data || []) as ParentDailyObservationRow[];
  }

  async findByParentId(parentId: string, days = 30): Promise<ParentDailyObservationRow[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('parent_id', parentId)
      .gte('observation_date', startDate.toISOString().split('T')[0])
      .order('observation_date', { ascending: false });

    if (error) {
      console.error('[ParentObservationRepository] findByParentId error:', error.message);
      return [];
    }
    return (data || []) as ParentDailyObservationRow[];
  }

  async upsertByParentDate(record: Partial<ParentDailyObservationRow> & { parent_id: string; observation_date: string }): Promise<ParentDailyObservationRow | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .upsert({
        ...record,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'parent_id,observation_date' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[ParentObservationRepository] upsertByParentDate error:', error.message);
      return null;
    }
    return data as ParentDailyObservationRow | null;
  }

  /** 获取学生最近N天的观察统计 */
  async getStudentObservationStats(studentId: string, days = 30): Promise<{
    total: number;
    sleepSufficient: number;
    sleepInsufficient: number;
    dietBalanced: number;
    energyEnergetic: number;
    energyTired: number;
  }> {
    const records = await this.findByStudentId(studentId, days);
    const stats = {
      total: records.length,
      sleepSufficient: 0,
      sleepInsufficient: 0,
      dietBalanced: 0,
      energyEnergetic: 0,
      energyTired: 0,
    };
    for (const r of records) {
      if (r.sleep_quality === 'sufficient') stats.sleepSufficient++;
      if (r.sleep_quality === 'insufficient') stats.sleepInsufficient++;
      if (r.diet_quality === 'balanced') stats.dietBalanced++;
      if (r.energy_level === 'energetic') stats.energyEnergetic++;
      if (r.energy_level === 'tired') stats.energyTired++;
    }
    return stats;
  }
}

export const parentObservationRepository = new ParentObservationRepository();
