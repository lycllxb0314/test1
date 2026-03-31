/**
 * 调课记录 Repository
 * 
 * 处理调课申请相关的数据访问
 */

import { BaseRepository, PaginatedResult } from './base.repository';

/**
 * 调课记录类型
 */
export interface ScheduleChangeRecord {
  id: string;
  applicant_id: string;
  applicant_name: string;
  original_schedule_id?: string;
  new_schedule_id?: string;
  change_type: string; // 'swap' | 'substitute' | 'cancel' | 'adjust'
  reason?: string;
  status: string; // 'pending' | 'approved' | 'rejected' | 'cancelled'
  approver_id?: string;
  approver_name?: string;
  approved_at?: string;
  remark?: string;
  created_at: string;
  updated_at?: string;
  
  // 原始课表信息
  original_class_id?: string;
  original_class_name?: string;
  original_subject?: string;
  original_teacher_id?: string;
  original_teacher_name?: string;
  original_day_of_week?: number;
  original_period?: number;
  
  // 新课表信息
  new_class_id?: string;
  new_class_name?: string;
  new_subject?: string;
  new_teacher_id?: string;
  new_teacher_name?: string;
  new_day_of_week?: number;
  new_period?: number;
}

/**
 * 调课查询参数
 */
export interface ScheduleChangeQueryParams {
  status?: string;
  applicantId?: string;
  approverId?: string;
  changeType?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * 调课 Repository 接口
 */
export interface IScheduleChangeRepository {
  findById(id: string): Promise<ScheduleChangeRecord | null>;
  findList(params: ScheduleChangeQueryParams): Promise<ScheduleChangeRecord[]>;
  findPaginatedChanges(params: ScheduleChangeQueryParams & { page?: number; pageSize?: number }): Promise<PaginatedResult<ScheduleChangeRecord>>;
  create(data: Partial<ScheduleChangeRecord>): Promise<ScheduleChangeRecord | null>;
  update(id: string, data: Partial<ScheduleChangeRecord>): Promise<ScheduleChangeRecord | null>;
  delete(id: string): Promise<boolean>;
  findByTeacher(teacherId: string, status?: string): Promise<ScheduleChangeRecord[]>;
}

/**
 * 调课 Repository 实现
 */
export class ScheduleChangeRepository extends BaseRepository<ScheduleChangeRecord> implements IScheduleChangeRepository {
  constructor() {
    super('schedule_changes');
  }

  /**
   * 查询调课列表
   */
  async findList(params: ScheduleChangeQueryParams): Promise<ScheduleChangeRecord[]> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.applicantId) {
      query = query.eq('applicant_id', params.applicantId);
    }
    if (params.approverId) {
      query = query.eq('approver_id', params.approverId);
    }
    if (params.changeType) {
      query = query.eq('change_type', params.changeType);
    }
    if (params.startDate) {
      query = query.gte('created_at', params.startDate);
    }
    if (params.endDate) {
      query = query.lte('created_at', params.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ScheduleChangeRepository] findList error:', error.message);
      return [];
    }

    return (data || []) as ScheduleChangeRecord[];
  }

  /**
   * 分页查询
   */
  async findPaginatedChanges(params: ScheduleChangeQueryParams & { page?: number; pageSize?: number }): Promise<PaginatedResult<ScheduleChangeRecord>> {
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
    if (params.applicantId) {
      query = query.eq('applicant_id', params.applicantId);
    }
    if (params.approverId) {
      query = query.eq('approver_id', params.approverId);
    }
    if (params.changeType) {
      query = query.eq('change_type', params.changeType);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error('[ScheduleChangeRepository] findPaginated error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    return {
      data: (data || []) as ScheduleChangeRecord[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * 查询教师的调课记录
   */
  async findByTeacher(teacherId: string, status?: string): Promise<ScheduleChangeRecord[]> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .or(`applicant_id.eq.${teacherId},original_teacher_id.eq.${teacherId},new_teacher_id.eq.${teacherId}`)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ScheduleChangeRepository] findByTeacher error:', error.message);
      return [];
    }

    return (data || []) as ScheduleChangeRecord[];
  }
}

// 导出单例
export const scheduleChangeRepository = new ScheduleChangeRepository();
