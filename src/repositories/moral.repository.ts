/**
 * 德育活动 Repository
 * 
 * 提供德育活动数据访问
 * 
 * @module repositories/moral.repository
 */

import { BaseRepository, QueryOptions, PaginatedResult } from './base.repository';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type {
  MoralActivity,
  MoralActivitySubmission,
  MoralActivityType,
  MoralActivityStatus,
} from '@/types/moral';

// 导出类型供外部使用
export type { MoralActivity, MoralActivitySubmission, MoralActivityType, MoralActivityStatus };

/**
 * 德育查询选项
 */
export interface MoralQueryOptions extends QueryOptions {
  type?: MoralActivityType;
  status?: MoralActivityStatus;
  organizerId?: string;
}

/**
 * 德育活动 Repository
 */
export class MoralActivityRepository extends BaseRepository<MoralActivity> {
  constructor() {
    super('moral_activities');
  }

  /**
   * 根据类型查询
   */
  async findByType(type: MoralActivityType): Promise<MoralActivity[]> {
    return this.findWhere({ type });
  }

  /**
   * 根据状态查询
   */
  async findByStatus(status: MoralActivityStatus): Promise<MoralActivity[]> {
    return this.findWhere({ status });
  }

  /**
   * 根据组织者查询
   */
  async findByOrganizer(organizerId: string): Promise<MoralActivity[]> {
    return this.findWhere({ organizer_id: organizerId });
  }

  /**
   * 分页查询
   */
  async findPaginated(options: MoralQueryOptions = {}): Promise<PaginatedResult<MoralActivity>> {
    const { type, status, organizerId, ...baseOptions } = options;

    const filters: Record<string, unknown> = {
      ...baseOptions.filters,
    };

    if (type) filters.type = type;
    if (status) filters.status = status;
    if (organizerId) filters.organizer_id = organizerId;

    return super.findPaginated({
      ...baseOptions,
      filters,
    });
  }

  /**
   * 获取最近活动
   */
  async findRecent(limit: number = 10): Promise<MoralActivity[]> {
    const client = this.client;
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error(`[${this.tableName}] findRecent error:`, error.message);
      return [];
    }

    return (data || []) as MoralActivity[];
  }

  /**
   * 获取统计数据
   */
  async getStatistics(): Promise<{
    total: number;
    byType: Record<MoralActivityType, number>;
    byStatus: Record<MoralActivityStatus, number>;
    thisMonth: number;
  }> {
    const client = this.client;
    const { data, error } = await client
      .from(this.tableName)
      .select('type, status, created_at');

    if (error || !data) {
      return { total: 0, byType: {} as any, byStatus: {} as any, thisMonth: 0 };
    }

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let thisMonth = 0;
    data.forEach((item) => {
      byType[item.type] = (byType[item.type] || 0) + 1;
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;
      if (new Date(item.created_at) >= thisMonthStart) {
        thisMonth++;
      }
    });

    return {
      total: data.length,
      byType: byType as Record<MoralActivityType, number>,
      byStatus: byStatus as Record<MoralActivityStatus, number>,
      thisMonth,
    };
  }
}

/**
 * 德育活动提交 Repository
 */
export class MoralActivitySubmissionRepository extends BaseRepository<MoralActivitySubmission> {
  constructor() {
    super('moral_activity_submissions');
  }

  /**
   * 根据活动ID查询
   */
  async findByActivity(activityId: string): Promise<MoralActivitySubmission[]> {
    return this.findWhere({ activity_id: activityId });
  }

  /**
   * 根据班级ID查询
   */
  async findByClass(classId: string): Promise<MoralActivitySubmission[]> {
    return this.findWhere({ class_id: classId });
  }

  /**
   * 获取活动的班级提交统计
   */
  async getActivitySubmissionStats(
    activityId: string
  ): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    const client = this.client;
    const { data, error } = await client
      .from(this.tableName)
      .select('status')
      .eq('activity_id', activityId);

    if (error || !data) {
      return { total: 0, pending: 0, approved: 0, rejected: 0 };
    }

    return {
      total: data.length,
      pending: data.filter((d) => d.status === 'pending').length,
      approved: data.filter((d) => d.status === 'approved').length,
      rejected: data.filter((d) => d.status === 'rejected').length,
    };
  }
}

// 导出单例
export const moralActivityRepository = new MoralActivityRepository();
export const moralActivitySubmissionRepository = new MoralActivitySubmissionRepository();
