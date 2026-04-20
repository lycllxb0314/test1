/**
 * 卓越教师 Repository
 *
 * 处理名师风采、教师团队、教师获奖数据的访问
 */

import { BaseRepository } from './base.repository';
import type {
  TeacherProfileRow,
  TeacherTeamRow,
  TeacherAwardRow,
} from '@/types/teacher-excellence';

// ==================== 名师风采 ====================

export class TeacherProfileRepository extends BaseRepository<TeacherProfileRow> {
  constructor() {
    super('teacher_profiles');
  }

  async findActive(limit: number = 50): Promise<TeacherProfileRow[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[TeacherProfileRepository] findActive error:', error.message);
      return [];
    }

    return (data || []) as TeacherProfileRow[];
  }

  async findAllForAdmin(includeInactive: boolean = false, limit: number = 100): Promise<TeacherProfileRow[]> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[TeacherProfileRepository] findAllForAdmin error:', error.message);
      return [];
    }

    return (data || []) as TeacherProfileRow[];
  }
}

// ==================== 教师团队 ====================

export class TeacherTeamRepository extends BaseRepository<TeacherTeamRow> {
  constructor() {
    super('teacher_teams');
  }

  async findActive(limit: number = 50): Promise<TeacherTeamRow[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[TeacherTeamRepository] findActive error:', error.message);
      return [];
    }

    return (data || []) as TeacherTeamRow[];
  }

  async findAllForAdmin(includeInactive: boolean = false, limit: number = 100): Promise<TeacherTeamRow[]> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[TeacherTeamRepository] findAllForAdmin error:', error.message);
      return [];
    }

    return (data || []) as TeacherTeamRow[];
  }
}

// ==================== 教师获奖 ====================

export class TeacherAwardRepository extends BaseRepository<TeacherAwardRow> {
  constructor() {
    super('teacher_awards');
  }

  async findActive(limit: number = 50): Promise<TeacherAwardRow[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[TeacherAwardRepository] findActive error:', error.message);
      return [];
    }

    return (data || []) as TeacherAwardRow[];
  }

  async findAllForAdmin(includeInactive: boolean = false, limit: number = 100): Promise<TeacherAwardRow[]> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[TeacherAwardRepository] findAllForAdmin error:', error.message);
      return [];
    }

    return (data || []) as TeacherAwardRow[];
  }
}

// 单例导出
export const teacherProfileRepository = new TeacherProfileRepository();
export const teacherTeamRepository = new TeacherTeamRepository();
export const teacherAwardRepository = new TeacherAwardRepository();
