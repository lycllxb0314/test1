/**
 * 安全管理 Repository
 * 
 * 处理安全演练、安全检查等数据访问
 */

import { BaseRepository, PaginatedResult } from './base.repository';

// ==================== 类型定义 ====================

export interface SafetyDrillRecord {
  id: string;
  type: string;
  title: string;
  drill_date: string;
  location: string;
  participants: number | null;
  duration: number | null;
  result: string | null;
  issues: string[] | null;
  improvements: string[] | null;
  organizer: string;
  created_at: string;
  updated_at?: string;
}

export interface SafetyInspectionRecord {
  id: string;
  inspector: string;
  inspection_date: string;
  area: string;
  type: string;
  status: string;
  issues: string[] | null;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface SafetyDrillQueryParams {
  type?: string;
  year?: string;
}

export interface SafetyInspectionQueryParams {
  status?: string;
  area?: string;
  type?: string;
  resolved?: boolean;
}

// ==================== 安全演练 Repository ====================

export class SafetyDrillRepository extends BaseRepository<SafetyDrillRecord> {
  constructor() {
    super('safety_drills');
  }

  async findByParams(params: SafetyDrillQueryParams): Promise<SafetyDrillRecord[]> {
    let query = this.client
      .from('safety_drills')
      .select('*')
      .order('drill_date', { ascending: false });

    if (params.type) query = query.eq('type', params.type);
    if (params.year) {
      query = query.gte('drill_date', `${params.year}-01-01`).lte('drill_date', `${params.year}-12-31`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[SafetyDrillRepository] findByParams error:', error.message);
      return [];
    }

    return (data || []) as SafetyDrillRecord[];
  }

  async countByType(year: string): Promise<Record<string, number>> {
    const { data, error } = await this.client
      .from('safety_drills')
      .select('type')
      .gte('drill_date', `${year}-01-01`)
      .lte('drill_date', `${year}-12-31`);

    if (error) return {};

    const counts: Record<string, number> = {};
    (data || []).forEach((item) => {
      counts[item.type] = (counts[item.type] || 0) + 1;
    });

    return counts;
  }
}

// ==================== 安全检查 Repository ====================

export class SafetyInspectionRepository extends BaseRepository<SafetyInspectionRecord> {
  constructor() {
    super('safety_inspections');
  }

  async findByParams(params: SafetyInspectionQueryParams & { page?: number; pageSize?: number }): Promise<PaginatedResult<SafetyInspectionRecord>> {
    const { page = 1, pageSize = 20 } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.client
      .from('safety_inspections')
      .select('*', { count: 'exact' })
      .order('inspection_date', { ascending: false });

    if (params.status) query = query.eq('status', params.status);
    if (params.area) query = query.eq('area', params.area);
    if (params.type) query = query.eq('type', params.type);
    if (params.resolved !== undefined) query = query.eq('resolved', params.resolved);

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error('[SafetyInspectionRepository] findByParams error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    return {
      data: (data || []) as SafetyInspectionRecord[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  async resolve(id: string, resolvedBy: string): Promise<SafetyInspectionRecord | null> {
    return this.update(id, {
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
      status: 'resolved',
    } as Partial<SafetyInspectionRecord>);
  }
}

// ==================== 导出单例 ====================

import { getSupabaseClient } from '@/storage/database/supabase-client';

export const safetyDrillRepository = new SafetyDrillRepository();
export const safetyInspectionRepository = new SafetyInspectionRepository();
