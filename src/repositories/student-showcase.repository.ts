/**
 * 附小少年 Repository
 *
 * 统一处理五大类别的学生展示数据
 */

import { BaseRepository } from './base.repository';
import type { StudentShowcaseRow, ShowcaseCategory } from '@/types/student-showcase';

export class StudentShowcaseRepository extends BaseRepository<StudentShowcaseRow> {
  constructor() {
    super('student_showcases');
  }

  async findByCategory(category: ShowcaseCategory, limit: number = 50): Promise<StudentShowcaseRow[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[StudentShowcaseRepository] findByCategory error:', error.message);
      return [];
    }

    return (data || []) as StudentShowcaseRow[];
  }

  async findActive(limit: number = 50): Promise<StudentShowcaseRow[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[StudentShowcaseRepository] findActive error:', error.message);
      return [];
    }

    return (data || []) as StudentShowcaseRow[];
  }

  async findAllForAdmin(includeInactive: boolean = false, limit: number = 200): Promise<StudentShowcaseRow[]> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[StudentShowcaseRepository] findAllForAdmin error:', error.message);
      return [];
    }

    return (data || []) as StudentShowcaseRow[];
  }
}

export const studentShowcaseRepository = new StudentShowcaseRepository();
