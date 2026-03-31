/**
 * 门禁管理 Repository
 * 
 * 处理门禁设备、访问记录、访客管理等数据访问
 */

import { BaseRepository, QueryOptions, PaginatedResult } from './base.repository';

// ==================== 类型定义 ====================

export interface AccessDeviceRecord {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  location: string | null;
  ip_address: string | null;
  last_online_at: string | null;
  created_at: string;
  updated_at?: string;
}

export interface AccessRecordRecord {
  id: string;
  device_id: string;
  person_id: string;
  person_name: string;
  person_type: string;
  direction: string;
  occurred_at: string;
  image_url?: string;
  temperature?: number;
  created_at: string;
}

export interface AccessStatistics {
  totalDevices: number;
  onlineDevices: number;
  todayRecords: number;
  todayVisitors: number;
}

export interface AccessDeviceQueryParams {
  status?: string;
  type?: string;
}

export interface AccessRecordQueryParams {
  deviceId?: string;
  personType?: string;
  direction?: string;
  startDate?: string;
  endDate?: string;
}

// ==================== 门禁设备 Repository ====================

export class AccessDeviceRepository extends BaseRepository<AccessDeviceRecord> {
  constructor() {
    super('access_devices');
  }

  async findWithTodayCount(params: AccessDeviceQueryParams): Promise<(AccessDeviceRecord & { todayCount: number })[]> {
    let query = this.client
      .from('access_devices')
      .select('*')
      .order('name');

    if (params.status) query = query.eq('status', params.status);
    if (params.type) query = query.eq('type', params.type);

    const { data, error } = await query;
    if (error) {
      console.error('[AccessDeviceRepository] findWithTodayCount error:', error.message);
      return [];
    }

    // 获取今日通行次数
    const today = new Date().toISOString().split('T')[0];
    const results = await Promise.all((data || []).map(async (device) => {
      const { count } = await this.client
        .from('access_records')
        .select('id', { count: 'exact', head: true })
        .eq('device_id', device.id)
        .gte('occurred_at', `${today}T00:00:00`)
        .lt('occurred_at', `${today}T23:59:59`);

      return {
        ...device,
        todayCount: count || 0,
      };
    }));

    return results;
  }

  async updateStatus(id: string, status: string): Promise<AccessDeviceRecord | null> {
    const updateData: Record<string, unknown> = { status };
    if (status === 'online') {
      updateData.last_online_at = new Date().toISOString();
    }

    return this.update(id, updateData);
  }
}

// ==================== 访问记录 Repository ====================

export class AccessRecordRepository extends BaseRepository<AccessRecordRecord> {
  constructor() {
    super('access_records');
  }

  async findByDateRange(params: AccessRecordQueryParams & { page?: number; pageSize?: number }): Promise<PaginatedResult<AccessRecordRecord>> {
    const { page = 1, pageSize = 20 } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.client
      .from('access_records')
      .select('*', { count: 'exact' })
      .order('occurred_at', { ascending: false });

    if (params.deviceId) query = query.eq('device_id', params.deviceId);
    if (params.personType) query = query.eq('person_type', params.personType);
    if (params.direction) query = query.eq('direction', params.direction);
    if (params.startDate) query = query.gte('occurred_at', params.startDate);
    if (params.endDate) query = query.lte('occurred_at', params.endDate);

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error('[AccessRecordRepository] findByDateRange error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    return {
      data: (data || []) as AccessRecordRecord[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  async countToday(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const { count, error } = await this.client
      .from('access_records')
      .select('*', { count: 'exact', head: true })
      .gte('occurred_at', `${today}T00:00:00`)
      .lt('occurred_at', `${today}T23:59:59`);

    if (error) return 0;
    return count || 0;
  }

  async countTodayVisitors(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const { count, error } = await this.client
      .from('access_records')
      .select('*', { count: 'exact', head: true })
      .eq('person_type', 'visitor')
      .gte('occurred_at', `${today}T00:00:00`)
      .lt('occurred_at', `${today}T23:59:59`);

    if (error) return 0;
    return count || 0;
  }
}

// ==================== 统计 Repository ====================

export class AccessStatisticsRepository {
  protected get client() {
    return getSupabaseClient();
  }

  async getStatistics(): Promise<AccessStatistics> {
    const [deviceCount, onlineCount, todayRecords, todayVisitors] = await Promise.all([
      this.client.from('access_devices').select('*', { count: 'exact', head: true }),
      this.client.from('access_devices').select('*', { count: 'exact', head: true }).eq('status', 'online'),
      new AccessRecordRepository().countToday(),
      new AccessRecordRepository().countTodayVisitors(),
    ]);

    return {
      totalDevices: deviceCount.count || 0,
      onlineDevices: onlineCount.count || 0,
      todayRecords,
      todayVisitors,
    };
  }
}

// ==================== 导出单例 ====================

import { getSupabaseClient } from '@/storage/database/supabase-client';

export const accessDeviceRepository = new AccessDeviceRepository();
export const accessRecordRepository = new AccessRecordRepository();
export const accessStatisticsRepository = new AccessStatisticsRepository();
