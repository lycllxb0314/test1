/**
 * 健康档案 Repository
 */
import { BaseRepository } from './base.repository';
import type { HealthProfile } from '@/types/health-management';

export class HealthProfileRepository extends BaseRepository<HealthProfile> {
  constructor() {
    super('health_profiles');
  }

  async findByStudentId(studentId: string): Promise<HealthProfile | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) {
      console.error('[HealthProfileRepository] findByStudentId error:', error.message);
      return null;
    }
    return data as HealthProfile | null;
  }

  async upsertByStudentId(studentId: string, profile: Partial<HealthProfile>): Promise<HealthProfile | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .upsert({
        student_id: studentId,
        ...profile,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[HealthProfileRepository] upsertByStudentId error:', error.message);
      return null;
    }
    return data as HealthProfile | null;
  }
}

export const healthProfileRepository = new HealthProfileRepository();
