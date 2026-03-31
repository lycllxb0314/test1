/**
 * 教务管理 Repository 层
 * 
 * 包含教室、预订、课表等数据的数据库访问操作
 */

import { BaseRepository, PaginatedResult } from './base.repository';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// ==================== 教室 Repository ====================

/**
 * 教室记录类型
 */
export interface RoomRecord {
  id: string;
  name: string;
  code: string;
  type: string;
  building: string;
  floor?: number;
  location?: string;
  capacity: number;
  area?: number;
  facilities?: Record<string, boolean>;
  extra_facilities?: string;
  status: string;
  manager_id?: string;
  manager_name?: string;
  department_id?: string;
  remark?: string;
  usage_stats?: Record<string, number>;
  created_at: string;
  updated_at?: string;
}

/**
 * 教室查询参数
 */
export interface RoomQueryParams {
  id?: string;
  type?: string;
  status?: string;
  building?: string;
  search?: string;
}

export interface IRoomRepository {
  findById(id: string): Promise<RoomRecord | null>;
  findList(params: RoomQueryParams): Promise<RoomRecord[]>;
  create(data: Partial<RoomRecord>): Promise<RoomRecord | null>;
  update(id: string, data: Partial<RoomRecord>): Promise<RoomRecord | null>;
  delete(id: string): Promise<boolean>;
  findAllForStats(): Promise<RoomRecord[]>;
}

export class RoomRepository extends BaseRepository<RoomRecord> implements IRoomRepository {
  constructor() {
    super('rooms');
  }

  async findList(params: RoomQueryParams): Promise<RoomRecord[]> {
    // 单个查询
    if (params.id) {
      const item = await this.findById(params.id);
      return item ? [item] : [];
    }
    
    let query = this.client
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (params.type && params.type !== 'all') {
      query = query.eq('type', params.type);
    }
    if (params.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }
    if (params.building && params.building !== 'all') {
      query = query.eq('building', params.building);
    }
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,code.ilike.%${params.search}%,location.ilike.%${params.search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return [];
    }
    
    return (data || []) as RoomRecord[];
  }

  async findAllForStats(): Promise<RoomRecord[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('type, status, building, capacity, usage_stats');
    
    if (error) {
      return [];
    }
    
    return (data || []) as RoomRecord[];
  }
}

// ==================== 教室预订 Repository ====================

/**
 * 预订记录类型
 */
export interface RoomBookingRecord {
  id: string;
  room_id: string;
  room_name?: string;
  title: string;
  purpose: string;
  applicant_id: string;
  applicant_name: string;
  applicant_department?: string;
  start_time: string;
  end_time: string;
  status: string;
  attendees: number;
  equipment_needed?: string[];
  remark?: string;
  approval_info?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

/**
 * 预订查询参数
 */
export interface RoomBookingQueryParams {
  roomId?: string;
  status?: string;
  applicantId?: string;
  date?: string;
}

export interface IRoomBookingRepository {
  findById(id: string): Promise<RoomBookingRecord | null>;
  findList(params: RoomBookingQueryParams): Promise<RoomBookingRecord[]>;
  create(data: Partial<RoomBookingRecord>): Promise<RoomBookingRecord | null>;
  update(id: string, data: Partial<RoomBookingRecord>): Promise<RoomBookingRecord | null>;
  delete(id: string): Promise<boolean>;
}

export class RoomBookingRepository extends BaseRepository<RoomBookingRecord> implements IRoomBookingRepository {
  constructor() {
    super('room_bookings');
  }

  async findList(params: RoomBookingQueryParams): Promise<RoomBookingRecord[]> {
    let query = this.client
      .from(this.tableName)
      .select(`
        *,
        rooms(name)
      `)
      .order('created_at', { ascending: false });
    
    if (params.roomId) {
      query = query.eq('room_id', params.roomId);
    }
    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.applicantId) {
      query = query.eq('applicant_id', params.applicantId);
    }
    if (params.date) {
      query = query.gte('start_time', params.date).lt('start_time', `${params.date}T23:59:59`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return [];
    }
    
    // 格式化数据
    return (data || []).map(b => ({
      ...b,
      room_name: b.rooms?.name,
    })) as RoomBookingRecord[];
  }
}

// ==================== 课表格子 Repository ====================

/**
 * 课表格子记录类型
 */
export interface ScheduleSlotRecord {
  id: string;
  class_id: string;
  class_name: string;
  grade: number;
  week_day: number;
  period_index: number;
  period_name?: string;
  subject: string;
  teacher_id?: string;
  teacher_name?: string;
  employee_id?: string;
  draft_id?: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

/**
 * 课表查询参数
 */
export interface ScheduleSlotQueryParams {
  classId?: string;
  teacherId?: string;
  grade?: number;
  draftId?: string | null;
  weekDay?: number;
  periodIndex?: number;
}

export interface IScheduleSlotRepository {
  findById(id: string): Promise<ScheduleSlotRecord | null>;
  findList(params: ScheduleSlotQueryParams): Promise<ScheduleSlotRecord[]>;
  findByClassAndTime(classId: string, weekDay: number, periodIndex: number, draftId?: string): Promise<ScheduleSlotRecord | null>;
  create(data: Partial<ScheduleSlotRecord>): Promise<ScheduleSlotRecord | null>;
  update(id: string, data: Partial<ScheduleSlotRecord>): Promise<ScheduleSlotRecord | null>;
  delete(id: string): Promise<boolean>;
  deleteByFilter(params: ScheduleSlotQueryParams): Promise<boolean>;
  countByTeacher(teacherId: string, draftId?: string | null): Promise<number>;
}

export class ScheduleSlotRepository extends BaseRepository<ScheduleSlotRecord> implements IScheduleSlotRepository {
  constructor() {
    super('schedule_slots');
  }

  async findList(params: ScheduleSlotQueryParams): Promise<ScheduleSlotRecord[]> {
    // 处理大批量数据
    const allSlots: ScheduleSlotRecord[] = [];
    const batchSize = 1000;
    let offset = 0;
    
    while (true) {
      let query = this.client
        .from(this.tableName)
        .select('*')
        .range(offset, offset + batchSize - 1);
      
      if (params.classId) {
        query = query.eq('class_id', params.classId);
      }
      if (params.teacherId) {
        query = query.eq('teacher_id', params.teacherId);
      }
      if (params.grade) {
        query = query.eq('grade', params.grade);
      }
      if (params.draftId !== undefined) {
        if (params.draftId === null) {
          query = query.is('draft_id', null);
        } else {
          query = query.eq('draft_id', params.draftId);
        }
      }
      
      const { data: batch, error } = await query;
      
      if (error) {
        break;
      }
      
      if (batch && batch.length > 0) {
        allSlots.push(...(batch as ScheduleSlotRecord[]));
      }
      
      if (!batch || batch.length < batchSize) {
        break;
      }
      
      offset += batchSize;
    }
    
    return allSlots;
  }

  async findByClassAndTime(classId: string, weekDay: number, periodIndex: number, draftId?: string): Promise<ScheduleSlotRecord | null> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .eq('class_id', classId)
      .eq('week_day', weekDay)
      .eq('period_index', periodIndex);
    
    if (draftId) {
      query = query.eq('draft_id', draftId);
    } else {
      query = query.is('draft_id', null);
    }
    
    const { data, error } = await query.single();
    
    if (error) {
      return null;
    }
    
    return data as ScheduleSlotRecord;
  }

  async deleteByFilter(params: ScheduleSlotQueryParams): Promise<boolean> {
    let query = this.client.from(this.tableName).delete();
    
    if (params.classId) {
      query = query.eq('class_id', params.classId);
    }
    if (params.weekDay !== undefined) {
      query = query.eq('week_day', params.weekDay);
    }
    if (params.periodIndex !== undefined) {
      query = query.eq('period_index', params.periodIndex);
    }
    if (params.draftId !== undefined) {
      if (params.draftId === null) {
        query = query.is('draft_id', null);
      } else {
        query = query.eq('draft_id', params.draftId);
      }
    }
    
    const { error } = await query;
    
    return !error;
  }

  async countByTeacher(teacherId: string, draftId?: string | null): Promise<number> {
    let query = this.client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', teacherId);
    
    if (draftId === null) {
      query = query.is('draft_id', null);
    } else if (draftId) {
      query = query.eq('draft_id', draftId);
    }
    
    const { count, error } = await query;
    
    return error ? 0 : (count || 0);
  }
}

// ==================== 课表草稿 Repository ====================

/**
 * 草稿记录类型
 */
export interface ScheduleDraftRecord {
  id: string;
  name: string;
  semester: string;
  status: string;
  creator_id?: string;
  creator_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface IScheduleDraftRepository {
  findById(id: string): Promise<ScheduleDraftRecord | null>;
  findAll(): Promise<ScheduleDraftRecord[]>;
  create(data: Partial<ScheduleDraftRecord>): Promise<ScheduleDraftRecord | null>;
  update(id: string, data: Partial<ScheduleDraftRecord>): Promise<ScheduleDraftRecord | null>;
  delete(id: string): Promise<boolean>;
}

export class ScheduleDraftRepository extends BaseRepository<ScheduleDraftRecord> implements IScheduleDraftRepository {
  constructor() {
    super('schedule_drafts');
  }

  async findAll(): Promise<ScheduleDraftRecord[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      return [];
    }
    
    return (data || []) as ScheduleDraftRecord[];
  }
}

// ==================== 导出单例 ====================

export const roomRepository = new RoomRepository();
export const roomBookingRepository = new RoomBookingRepository();
export const scheduleSlotRepository = new ScheduleSlotRepository();
export const scheduleDraftRepository = new ScheduleDraftRepository();
