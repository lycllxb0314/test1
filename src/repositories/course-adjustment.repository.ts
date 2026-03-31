/**
 * 调课记录 Repository
 * 
 * 处理调课处理相关的数据访问
 */

import { BaseRepository, PaginatedResult } from './base.repository';

/**
 * 调课记录类型
 */
export interface CourseAdjustmentRecord {
  id: string;
  leave_request_id?: string;
  workflow_instance_id?: string;
  applicant_id: string;
  applicant_name: string;
  adjuster_id?: string;
  adjuster_name?: string;
  adjust_type?: string;
  original_slot?: Record<string, unknown>;
  adjust_result?: Record<string, unknown>;
  reason?: string;
  reason_type?: string;
  status: string;
  grade?: number;
  class_id?: string;
  class_name?: string;
  subject?: string;
  week_day?: number;
  period_index?: number;
  period_name?: string;
  effective_week_number?: number;
  effective_week?: string;
  effective_year?: number;
  substitute_employee_id?: string;
  substitute_name?: string;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  sync_status?: Record<string, boolean>;
  notify_status?: Record<string, boolean>;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
}

/**
 * 调课查询参数
 */
export interface CourseAdjustmentQueryParams {
  status?: string;
  applicantId?: string;
  effectiveWeek?: number;
  grade?: number;
  classId?: string;
}

/**
 * 调课 Repository 接口
 */
export interface ICourseAdjustmentRepository {
  findById(id: string): Promise<CourseAdjustmentRecord | null>;
  findList(params: CourseAdjustmentQueryParams): Promise<CourseAdjustmentRecord[]>;
  findPaginatedAdjustments(params: CourseAdjustmentQueryParams & { page?: number; pageSize?: number }): Promise<PaginatedResult<CourseAdjustmentRecord>>;
  create(data: Partial<CourseAdjustmentRecord>): Promise<CourseAdjustmentRecord | null>;
  update(id: string, data: Partial<CourseAdjustmentRecord>): Promise<CourseAdjustmentRecord | null>;
  delete(id: string): Promise<boolean>;
  countPendingByLeave(leaveRequestId: string): Promise<number>;
}

/**
 * 调课 Repository 实现
 */
export class CourseAdjustmentRepository extends BaseRepository<CourseAdjustmentRecord> implements ICourseAdjustmentRepository {
  constructor() {
    super('course_adjustments');
  }

  async findList(params: CourseAdjustmentQueryParams): Promise<CourseAdjustmentRecord[]> {
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
    if (params.effectiveWeek) {
      query = query.eq('effective_week_number', params.effectiveWeek);
    }
    if (params.grade) {
      query = query.eq('grade', params.grade);
    }
    if (params.classId) {
      query = query.eq('class_id', params.classId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[CourseAdjustmentRepository] findList error:', error.message);
      return [];
    }

    return (data || []) as CourseAdjustmentRecord[];
  }

  async findPaginatedAdjustments(params: CourseAdjustmentQueryParams & { page?: number; pageSize?: number }): Promise<PaginatedResult<CourseAdjustmentRecord>> {
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
    if (params.effectiveWeek) {
      query = query.eq('effective_week_number', params.effectiveWeek);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error('[CourseAdjustmentRepository] findPaginatedAdjustments error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    return {
      data: (data || []) as CourseAdjustmentRecord[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  async countPendingByLeave(leaveRequestId: string): Promise<number> {
    const { count, error } = await this.client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('leave_request_id', leaveRequestId)
      .eq('status', 'pending');

    if (error) {
      console.error('[CourseAdjustmentRepository] countPendingByLeave error:', error.message);
      return 0;
    }

    return count || 0;
  }
}

// 导出单例
export const courseAdjustmentRepository = new CourseAdjustmentRepository();
