/**
 * 教室/场地管理 Repository
 * 
 * 处理教室、场地预约等数据访问
 */

import { BaseRepository, PaginatedResult } from './base.repository';

// ==================== 类型定义 ====================

export interface RoomRecord {
  id: string;
  name: string;
  code: string | null;
  type: string;
  building: string | null;
  floor: number | null;
  location: string | null;
  capacity: number | null;
  area: number | null;
  facilities: Record<string, unknown>;
  status: string;
  manager_id: string | null;
  manager_name: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at?: string;
}

export interface SpaceReservationRecord {
  id: string;
  space_id: string;
  space_name: string;
  applicant_id: string;
  applicant_name: string;
  purpose: string;
  start_time: string;
  end_time: string;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at?: string;
}

export interface RoomQueryParams {
  type?: string;
  status?: string;
  building?: string;
  page?: number;
  pageSize?: number;
}

export interface SpaceReservationQueryParams {
  spaceId?: string;
  applicantId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

// ==================== 教室 Repository ====================

export class RoomRepository extends BaseRepository<RoomRecord> {
  constructor() {
    super('rooms');
  }

  async findByParams(params: RoomQueryParams): Promise<RoomRecord[]> {
    let query = this.client
      .from('rooms')
      .select('*')
      .order('name');

    if (params.type) query = query.eq('type', params.type);
    if (params.status) query = query.eq('status', params.status);
    if (params.building) query = query.eq('building', params.building);

    const { data, error } = await query;
    if (error) {
      console.error('[RoomRepository] findByParams error:', error.message);
      return [];
    }

    return (data || []) as RoomRecord[];
  }

  async updateStatus(id: string, status: string): Promise<RoomRecord | null> {
    return this.update(id, { status } as Partial<RoomRecord>);
  }

  async findByBuilding(building: string): Promise<RoomRecord[]> {
    return this.findWhere({ building });
  }

  async findAvailable(): Promise<RoomRecord[]> {
    return this.findWhere({ status: 'available' });
  }
}

// ==================== 场地预约 Repository ====================

export class SpaceReservationRepository extends BaseRepository<SpaceReservationRecord> {
  constructor() {
    super('space_reservations');
  }

  async findByParams(params: SpaceReservationQueryParams): Promise<PaginatedResult<SpaceReservationRecord>> {
    const { page = 1, pageSize = 20 } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.client
      .from('space_reservations')
      .select('*', { count: 'exact' })
      .order('start_time', { ascending: false });

    if (params.spaceId) query = query.eq('space_id', params.spaceId);
    if (params.applicantId) query = query.eq('applicant_id', params.applicantId);
    if (params.status) query = query.eq('status', params.status);
    if (params.startDate) query = query.gte('start_time', params.startDate);
    if (params.endDate) query = query.lte('end_time', params.endDate);

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error('[SpaceReservationRepository] findByParams error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    return {
      data: (data || []) as SpaceReservationRecord[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  async checkConflict(spaceId: string, startTime: string, endTime: string, excludeId?: string): Promise<boolean> {
    let query = this.client
      .from('space_reservations')
      .select('id')
      .eq('space_id', spaceId)
      .eq('status', 'approved')
      .or(`start_time.lt.${endTime},end_time.gt.${startTime}`);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;
    if (error) return false;

    return (data || []).length > 0;
  }

  async approve(id: string, approvedBy: string): Promise<SpaceReservationRecord | null> {
    return this.update(id, {
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    } as Partial<SpaceReservationRecord>);
  }

  async reject(id: string, rejectedBy: string, reason?: string): Promise<SpaceReservationRecord | null> {
    return this.update(id, {
      status: 'rejected',
      approved_by: rejectedBy,
      approved_at: new Date().toISOString(),
      notes: reason,
    } as Partial<SpaceReservationRecord>);
  }
}

// ==================== 导出单例 ====================

import { getSupabaseClient } from '@/storage/database/supabase-client';

export const roomRepository = new RoomRepository();
export const spaceReservationRepository = new SpaceReservationRepository();
