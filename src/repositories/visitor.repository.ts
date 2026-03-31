/**
 * 访客管理 Repository
 * 
 * 处理访客预约和访问记录相关的数据访问
 */

import { BaseRepository, PaginatedResult } from './base.repository';

/**
 * 访客记录类型
 */
export interface VisitorRecord {
  id: string;
  name: string;
  phone?: string;
  id_card?: string;
  purpose: string;
  host_id: string;
  host_name: string;
  host_department?: string;
  expected_arrival_time: string;
  actual_arrival_time?: string;
  actual_leave_time?: string;
  status: string; // 'pending' | 'approved' | 'rejected' | 'visiting' | 'left'
  temperature?: number;
  remark?: string;
  approver_id?: string;
  approver_name?: string;
  approved_at?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * 访客查询参数
 */
export interface VisitorQueryParams {
  status?: string;
  hostId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

/**
 * 访客 Repository 接口
 */
export interface IVisitorRepository {
  findById(id: string): Promise<VisitorRecord | null>;
  findList(params: VisitorQueryParams): Promise<VisitorRecord[]>;
  findPaginatedVisitors(params: VisitorQueryParams & { page?: number; pageSize?: number }): Promise<PaginatedResult<VisitorRecord>>;
  create(data: Partial<VisitorRecord>): Promise<VisitorRecord | null>;
  update(id: string, data: Partial<VisitorRecord>): Promise<VisitorRecord | null>;
  delete(id: string): Promise<boolean>;
  countByStatus(status: string): Promise<number>;
  countToday(): Promise<number>;
}

/**
 * 访客 Repository 实现
 */
export class VisitorRepository extends BaseRepository<VisitorRecord> implements IVisitorRepository {
  constructor() {
    super('visitors');
  }

  /**
   * 查询访客列表
   */
  async findList(params: VisitorQueryParams): Promise<VisitorRecord[]> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.hostId) {
      query = query.eq('host_id', params.hostId);
    }
    if (params.startDate) {
      query = query.gte('expected_arrival_time', params.startDate);
    }
    if (params.endDate) {
      query = query.lte('expected_arrival_time', params.endDate);
    }
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,phone.ilike.%${params.search}%,host_name.ilike.%${params.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[VisitorRepository] findList error:', error.message);
      return [];
    }

    return (data || []) as VisitorRecord[];
  }

  /**
   * 分页查询
   */
  async findPaginatedVisitors(params: VisitorQueryParams & { page?: number; pageSize?: number }): Promise<PaginatedResult<VisitorRecord>> {
    const { page = 1, pageSize = 20 } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.client
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.hostId) {
      query = query.eq('host_id', params.hostId);
    }
    if (params.startDate) {
      query = query.gte('expected_arrival_time', params.startDate);
    }
    if (params.endDate) {
      query = query.lte('expected_arrival_time', params.endDate);
    }
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,phone.ilike.%${params.search}%,host_name.ilike.%${params.search}%`);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error('[VisitorRepository] findPaginated error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    return {
      data: (data || []) as VisitorRecord[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * 按状态统计数量
   */
  async countByStatus(status: string): Promise<number> {
    const { count, error } = await this.client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    if (error) {
      console.error('[VisitorRepository] countByStatus error:', error.message);
      return 0;
    }

    return count || 0;
  }

  /**
   * 统计今日访客数量
   */
  async countToday(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    
    const { count, error } = await this.client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .gte('expected_arrival_time', `${today}T00:00:00`)
      .lte('expected_arrival_time', `${today}T23:59:59`);

    if (error) {
      console.error('[VisitorRepository] countToday error:', error.message);
      return 0;
    }

    return count || 0;
  }
}

// 导出单例
export const visitorRepository = new VisitorRepository();
