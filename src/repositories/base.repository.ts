/**
 * 基础 Repository 类
 * 
 * 提供通用的 CRUD 操作和数据访问抽象
 * 所有领域 Repository 都继承此类
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 查询选项
 */
export interface QueryOptions {
  select?: string;
  filters?: Record<string, unknown>;
  orderBy?: { column: string; ascending?: boolean };
  pagination?: { page: number; pageSize: number };
  search?: { fields: string[]; value: string };
}

/**
 * 分页结果
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 基础 Repository 抽象类
 */
export abstract class BaseRepository<T> {
  protected tableName: string;
  
  constructor(tableName: string) {
    this.tableName = tableName;
  }
  
  /**
   * 获取数据库客户端
   */
  protected get client() {
    return getSupabaseClient();
  }
  
  /**
   * 根据ID查询单条记录
   */
  async findById(id: string, select: string = '*'): Promise<T | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(select)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`[${this.tableName}] findById error:`, error.message);
      return null;
    }
    
    return data as T;
  }
  
  /**
   * 查询所有记录
   */
  async findAll(select: string = '*'): Promise<T[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(select);
    
    if (error) {
      console.error(`[${this.tableName}] findAll error:`, error.message);
      return [];
    }
    
    return (data || []) as T[];
  }
  
  /**
   * 分页查询
   */
  async findPaginated(options: QueryOptions = {}): Promise<PaginatedResult<T>> {
    const { 
      select = '*', 
      filters, 
      orderBy, 
      pagination = { page: 1, pageSize: 20 },
      search 
    } = options;
    
    const { page, pageSize } = pagination;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = this.client
      .from(this.tableName)
      .select(select, { count: 'exact' });
    
    // 应用筛选条件
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== 'all') {
          query = query.eq(key, value);
        }
      });
    }
    
    // 应用搜索
    if (search && search.value) {
      const searchConditions = search.fields
        .map(field => `${field}.ilike.%${search.value}%`)
        .join(',');
      query = query.or(searchConditions);
    }
    
    // 应用排序
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
    }
    
    // 应用分页
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error(`[${this.tableName}] findPaginated error:`, error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
    
    return {
      data: (data || []) as T[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }
  
  /**
   * 根据条件查询
   */
  async findWhere(filters: Record<string, unknown>, select: string = '*'): Promise<T[]> {
    let query = this.client
      .from(this.tableName)
      .select(select);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`[${this.tableName}] findWhere error:`, error.message);
      return [];
    }
    
    return (data || []) as T[];
  }
  
  /**
   * 创建记录
   */
  async create(data: Partial<T>): Promise<T | null> {
    const { data: result, error } = await this.client
      .from(this.tableName)
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error(`[${this.tableName}] create error:`, error.message);
      return null;
    }
    
    return result as T;
  }
  
  /**
   * 批量创建
   */
  async createMany(data: Partial<T>[]): Promise<T[]> {
    const records = data.map(item => ({
      ...item,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    
    const { data: result, error } = await this.client
      .from(this.tableName)
      .insert(records)
      .select();
    
    if (error) {
      console.error(`[${this.tableName}] createMany error:`, error.message);
      return [];
    }
    
    return (result || []) as T[];
  }
  
  /**
   * 更新记录
   */
  async update(id: string, data: Partial<T>): Promise<T | null> {
    const { data: result, error } = await this.client
      .from(this.tableName)
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`[${this.tableName}] update error:`, error.message);
      return null;
    }
    
    return result as T;
  }
  
  /**
   * 删除记录
   */
  async delete(id: string): Promise<boolean> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`[${this.tableName}] delete error:`, error.message);
      return false;
    }
    
    return true;
  }
  
  /**
   * 批量删除
   */
  async deleteWhere(filters: Record<string, unknown>): Promise<boolean> {
    let query = this.client.from(this.tableName).delete();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
    
    const { error } = await query;
    
    if (error) {
      console.error(`[${this.tableName}] deleteWhere error:`, error.message);
      return false;
    }
    
    return true;
  }
  
  /**
   * 统计记录数
   */
  async count(filters?: Record<string, unknown>): Promise<number> {
    let query = this.client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }
    
    const { count, error } = await query;
    
    if (error) {
      console.error(`[${this.tableName}] count error:`, error.message);
      return 0;
    }
    
    return count || 0;
  }
  
  /**
   * 检查记录是否存在
   */
  async exists(filters: Record<string, unknown>): Promise<boolean> {
    const count = await this.count(filters);
    return count > 0;
  }
}
