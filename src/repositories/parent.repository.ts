/**
 * 家长 Repository 层
 * 
 * 负责家长数据的数据库访问操作
 */

import { BaseRepository, PaginatedResult, QueryOptions } from './base.repository';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 家长数据类型
 */
export interface ParentRecord {
  id: string;
  name: string;
  phone: string;
  relation: string;
  relation_name?: string;
  student_id?: string;
  student_name?: string;
  class_id?: string;
  class_name?: string;
  grade?: number;
  is_primary?: boolean;
  has_account?: boolean;
  user_id?: string;
  account_id?: string;
  password?: string;
  gender?: string;
  birth_date?: string;
  id_card?: string;
  education?: string;
  political_status?: string;
  household_address?: string;
  current_address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  work_unit?: string;
  position?: string;
  occupation?: string;
  wechat?: string;
  email?: string;
  head_teacher_id?: string;
  head_teacher_name?: string;
  status?: string;
  remark?: string;
  notification_settings?: Record<string, boolean>;
  last_login_at?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * 家长查询参数
 */
export interface ParentQueryParams {
  studentId?: string;
  phone?: string;
  name?: string;
  status?: string;
  classId?: string;
  grade?: number;
  hasAccount?: boolean;
  search?: string;
  relation?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 家长 Repository 接口
 */
export interface IParentRepository {
  findById(id: string): Promise<ParentRecord | null>;
  findByPhone(phone: string): Promise<ParentRecord | null>;
  findList(params: ParentQueryParams): Promise<PaginatedResult<ParentRecord>>;
  findWithStudent(id: string): Promise<ParentRecord | null>;
  findChildrenByPhone(phone: string): Promise<ParentRecord[]>;
  create(data: Partial<ParentRecord>): Promise<ParentRecord | null>;
  update(id: string, data: Partial<ParentRecord>): Promise<ParentRecord | null>;
  delete(id: string): Promise<boolean>;
  existsByPhone(phone: string): Promise<boolean>;
}

/**
 * 家长 Repository 实现
 */
export class ParentRepository extends BaseRepository<ParentRecord> implements IParentRepository {
  constructor() {
    super('parents');
  }

  /**
   * 根据手机号查询
   */
  async findByPhone(phone: string): Promise<ParentRecord | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('phone', phone)
      .single();
    
    if (error) {
      return null;
    }
    
    return data as ParentRecord;
  }

  /**
   * 查询家长列表
   */
  async findList(params: ParentQueryParams): Promise<PaginatedResult<ParentRecord>> {
    const { page = 1, pageSize = 20 } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = this.client
      .from(this.tableName)
      .select('*', { count: 'exact' });
    
    // 应用筛选条件
    if (params.studentId) {
      query = query.eq('student_id', params.studentId);
    }
    if (params.phone) {
      query = query.ilike('phone', `%${params.phone}%`);
    }
    if (params.name) {
      query = query.ilike('name', `%${params.name}%`);
    }
    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.classId) {
      query = query.eq('class_id', params.classId);
    }
    if (params.grade) {
      query = query.eq('grade', params.grade);
    }
    if (params.hasAccount !== undefined) {
      query = query.eq('has_account', params.hasAccount);
    }
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,phone.ilike.%${params.search}%`);
    }
    
    // 排序和分页
    query = query.order('created_at', { ascending: false }).range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('[ParentRepository] findList error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
    
    return {
      data: (data || []) as ParentRecord[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * 查询家长及其学生信息
   */
  async findWithStudent(id: string): Promise<ParentRecord | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(`
        *,
        students (id, name, student_no, class_id, class_name, gender, birth_date)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      return null;
    }
    
    return data as ParentRecord;
  }

  /**
   * 根据手机号查询子女
   */
  async findChildrenByPhone(phone: string): Promise<ParentRecord[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('student_id, students (*)')
      .eq('phone', phone)
      .eq('status', 'active');
    
    if (error) {
      return [];
    }
    
    const children: ParentRecord[] = [];
    data?.forEach(p => {
      if (p.students && !Array.isArray(p.students)) {
        children.push(p.students as ParentRecord);
      }
    });
    
    return children;
  }

  /**
   * 检查手机号是否已存在
   */
  async existsByPhone(phone: string): Promise<boolean> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('id')
      .eq('phone', phone)
      .single();
    
    return !error && !!data;
  }

  /**
   * 批量查询家长（用于统计）
   */
  async findAllForStats(params: Partial<ParentQueryParams>): Promise<ParentRecord[]> {
    let query = this.client.from(this.tableName).select('has_account, is_primary, relation, class_id');
    
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,phone.ilike.%${params.search}%`);
    }
    if (params.classId) {
      query = query.eq('class_id', params.classId);
    }
    if (params.studentId) {
      query = query.eq('student_id', params.studentId);
    }
    if (params.relation) {
      query = query.eq('relation', params.relation);
    }
    if (params.hasAccount !== undefined) {
      query = query.eq('has_account', params.hasAccount);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return [];
    }
    
    return (data || []) as ParentRecord[];
  }

  /**
   * 查询其他家长
   */
  async findOtherParents(studentId: string, excludeId: string): Promise<ParentRecord[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('id, name, relation, relation_name, phone, is_primary')
      .eq('student_id', studentId)
      .neq('id', excludeId);
    
    if (error) {
      return [];
    }
    
    return (data || []) as ParentRecord[];
  }
}

// 导出单例
export const parentRepository = new ParentRepository();
