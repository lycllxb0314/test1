/**
 * 经费 Repository 层
 * 
 * 负责班级经费数据的数据库访问操作
 */

import { BaseRepository, PaginatedResult } from './base.repository';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 经费记录类型
 */
export interface ExpenseRecord {
  id: string;
  class_id: string;
  expense_no?: string;
  title?: string;
  type: string;
  amount: number;
  description?: string;
  applicant_id: string;
  applicant_name: string;
  department?: string;
  phone?: string;
  category?: string;
  items?: Record<string, unknown>[];
  total_amount?: number;
  attachments?: string[];
  status: string;
  approval_flow?: Record<string, unknown>[];
  current_step?: number;
  approval_records?: Record<string, unknown>[];
  approver_id?: string;
  approver_name?: string;
  approval_comment?: string;
  approved_at?: string;
  processor_id?: string;
  processor_name?: string;
  process_note?: string;
  processed_at?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * 经费查询参数
 */
export interface ExpenseQueryParams {
  classId?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  applicantId?: string;
  department?: string;
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 经费 Repository 接口
 */
export interface IExpenseRepository {
  findById(id: string): Promise<ExpenseRecord | null>;
  findList(params: ExpenseQueryParams): Promise<PaginatedResult<ExpenseRecord>>;
  create(data: Partial<ExpenseRecord>): Promise<ExpenseRecord | null>;
  update(id: string, data: Partial<ExpenseRecord>): Promise<ExpenseRecord | null>;
  delete(id: string): Promise<boolean>;
  findAllForStats(classId?: string): Promise<ExpenseRecord[]>;
  findCompletedByClass(classId: string, type: string): Promise<ExpenseRecord[]>;
}

/**
 * 经费 Repository 实现
 */
export class ExpenseRepository extends BaseRepository<ExpenseRecord> implements IExpenseRepository {
  constructor() {
    super('class_expenses');
  }

  /**
   * 查询经费列表
   */
  async findList(params: ExpenseQueryParams): Promise<PaginatedResult<ExpenseRecord>> {
    const { page = 1, pageSize = 20 } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = this.client
      .from(this.tableName)
      .select('*', { count: 'exact' });
    
    // 应用筛选条件
    if (params.classId) {
      query = query.eq('class_id', params.classId);
    }
    if (params.type) {
      query = query.eq('type', params.type);
    }
    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.startDate) {
      query = query.gte('created_at', params.startDate);
    }
    if (params.endDate) {
      query = query.lte('created_at', params.endDate);
    }
    if (params.applicantId) {
      query = query.eq('applicant_id', params.applicantId);
    }
    if (params.department) {
      query = query.eq('department', params.department);
    }
    if (params.category) {
      query = query.eq('category', params.category);
    }
    if (params.search) {
      query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    }
    
    // 排序和分页
    query = query.order('created_at', { ascending: false }).range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('[ExpenseRepository] findList error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
    
    return {
      data: (data || []) as ExpenseRecord[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * 查询所有记录用于统计
   */
  async findAllForStats(classId?: string): Promise<ExpenseRecord[]> {
    let query = this.client.from(this.tableName).select('*');
    
    if (classId) {
      query = query.eq('class_id', classId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return [];
    }
    
    return (data || []) as ExpenseRecord[];
  }

  /**
   * 查询班级已完成的收入/支出
   */
  async findCompletedByClass(classId: string, type: string): Promise<ExpenseRecord[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('amount')
      .eq('class_id', classId)
      .eq('type', type)
      .eq('status', 'completed');
    
    if (error) {
      return [];
    }
    
    return (data || []) as ExpenseRecord[];
  }

  /**
   * 更新状态
   */
  async updateStatus(id: string, status: string, extraData?: Partial<ExpenseRecord>): Promise<ExpenseRecord | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({
        status,
        ...extraData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('[ExpenseRepository] updateStatus error:', error.message);
      return null;
    }
    
    return data as ExpenseRecord;
  }
}

// 导出单例
export const expenseRepository = new ExpenseRepository();
