/**
 * 资产管理 Repository
 * 
 * 处理资产、维修请求等数据访问
 */

import { BaseRepository, PaginatedResult, QueryOptions } from './base.repository';

// ==================== 类型定义 ====================

export interface AssetRecord {
  id: string;
  name: string;
  asset_number: string | null;
  category: string;
  brand: string | null;
  model: string | null;
  specification?: string | null;
  quantity?: number;
  unit?: string | null;
  purchase_price: number | null;
  purchase_date: string | null;
  location: string | null;
  department?: string | null;
  manager: string | null;
  status: string;
  warranty_expiry?: string | null;
  last_maintenance: string | null;
  next_maintenance: string | null;
  created_at: string;
  updated_at?: string;
}

export interface RepairRequestRecord {
  id: string;
  asset_id: string | null;
  asset_name: string;
  location: string;
  reporter: string;
  reporter_id: string | null;
  description: string;
  urgency: string;
  status: string;
  assigned_to: string | null;
  assigned_at: string | null;
  completed_at: string | null;
  cost: number | null;
  notes: string | null;
  created_at: string;
  updated_at?: string;
}

export interface AssetQueryParams {
  category?: string;
  status?: string;
  location?: string;
  page?: number;
  pageSize?: number;
}

export interface RepairRequestQueryParams {
  status?: string;
  urgency?: string;
  reporter?: string;
  page?: number;
  pageSize?: number;
}

// ==================== 资产 Repository ====================

export class AssetRepository extends BaseRepository<AssetRecord> {
  constructor() {
    super('assets');
  }

  async findByParams(params: AssetQueryParams): Promise<AssetRecord[]> {
    let query = this.client
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (params.category) query = query.eq('category', params.category);
    if (params.status) query = query.eq('status', params.status);
    if (params.location) query = query.ilike('location', `%${params.location}%`);

    const { data, error } = await query;
    if (error) {
      console.error('[AssetRepository] findByParams error:', error.message);
      return [];
    }

    return (data || []) as AssetRecord[];
  }

  async countByCategory(): Promise<Record<string, number>> {
    const { data, error } = await this.client
      .from('assets')
      .select('category');

    if (error) return {};

    const counts: Record<string, number> = {};
    (data || []).forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });

    return counts;
  }

  async countByStatus(): Promise<Record<string, number>> {
    const { data, error } = await this.client
      .from('assets')
      .select('status');

    if (error) return {};

    const counts: Record<string, number> = {};
    (data || []).forEach((item) => {
      counts[item.status] = (counts[item.status] || 0) + 1;
    });

    return counts;
  }
}

// ==================== 维修请求 Repository ====================

export class RepairRequestRepository extends BaseRepository<RepairRequestRecord> {
  constructor() {
    super('repair_requests');
  }

  async findByParams(params: RepairRequestQueryParams): Promise<PaginatedResult<RepairRequestRecord>> {
    const { page = 1, pageSize = 20 } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.client
      .from('repair_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params.status) query = query.eq('status', params.status);
    if (params.urgency) query = query.eq('urgency', params.urgency);
    if (params.reporter) query = query.eq('reporter', params.reporter);

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error('[RepairRequestRepository] findByParams error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    return {
      data: (data || []) as RepairRequestRecord[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  async assign(id: string, assignedTo: string): Promise<RepairRequestRecord | null> {
    return this.update(id, {
      assigned_to: assignedTo,
      assigned_at: new Date().toISOString(),
      status: 'assigned',
    } as Partial<RepairRequestRecord>);
  }

  async complete(id: string, cost?: number, notes?: string): Promise<RepairRequestRecord | null> {
    return this.update(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      cost,
      notes,
    } as Partial<RepairRequestRecord>);
  }
}

// ==================== 导出单例 ====================

import { getSupabaseClient } from '@/storage/database/supabase-client';

export const assetRepository = new AssetRepository();
export const repairRequestRepository = new RepairRequestRepository();
