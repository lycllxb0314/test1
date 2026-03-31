/**
 * 通讯录服务
 * 
 * 处理通讯录条目业务逻辑
 */

import { BaseService, ServiceResult } from './base.service';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// ==================== 类型定义 ====================

export interface ContactRecord {
  id: string;
  name: string;
  type: string;
  phone: string;
  email?: string;
  department?: string;
  position?: string;
  created_at: string;
  updated_at?: string;
}

export interface ContactQueryParams {
  keyword?: string;
  type?: string;
  department?: string;
}

// ==================== 通讯录服务 ====================

export class ContactService extends BaseService {
  /**
   * 获取通讯录列表
   */
  async getList(params: ContactQueryParams): Promise<ServiceResult<ContactRecord[]>> {
    try {
      const client = getSupabaseClient();
      let query = client.from('contacts').select('*').order('name');

      if (params.keyword) {
        query = query.or(
          `name.ilike.%${params.keyword}%,phone.ilike.%${params.keyword}%,department.ilike.%${params.keyword}%`
        );
      }
      if (params.type) {
        query = query.eq('type', params.type);
      }
      if (params.department) {
        query = query.eq('department', params.department);
      }

      const { data, error } = await query;

      if (error) {
        return this.fail('获取通讯录列表失败');
      }

      return this.ok((data || []) as ContactRecord[]);
    } catch (error) {
      console.error('[ContactService] getList error:', error);
      return this.fail('获取通讯录列表失败');
    }
  }

  /**
   * 创建通讯录条目
   */
  async create(data: Partial<ContactRecord>): Promise<ServiceResult<ContactRecord>> {
    try {
      if (!data.name || !data.phone) {
        return this.fail('姓名和电话不能为空');
      }

      const client = getSupabaseClient();
      const { data: result, error } = await client
        .from('contacts')
        .insert({
          name: data.name,
          type: data.type || 'other',
          phone: data.phone,
          email: data.email,
          department: data.department,
          position: data.position,
        })
        .select()
        .single();

      if (error || !result) {
        return this.fail('创建通讯录条目失败');
      }

      return this.ok(result as ContactRecord);
    } catch (error) {
      console.error('[ContactService] create error:', error);
      return this.fail('创建通讯录条目失败');
    }
  }

  /**
   * 更新通讯录条目
   */
  async update(id: string, data: Partial<ContactRecord>): Promise<ServiceResult<ContactRecord>> {
    try {
      const client = getSupabaseClient();
      const { data: result, error } = await client
        .from('contacts')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error || !result) {
        return this.fail('更新通讯录条目失败');
      }

      return this.ok(result as ContactRecord);
    } catch (error) {
      console.error('[ContactService] update error:', error);
      return this.fail('更新通讯录条目失败');
    }
  }

  /**
   * 删除通讯录条目
   */
  async delete(id: string): Promise<ServiceResult<boolean>> {
    try {
      const client = getSupabaseClient();
      const { error } = await client.from('contacts').delete().eq('id', id);

      if (error) {
        return this.fail('删除通讯录条目失败');
      }

      return this.ok(true);
    } catch (error) {
      console.error('[ContactService] delete error:', error);
      return this.fail('删除通讯录条目失败');
    }
  }
}

// ==================== 导出单例 ====================

export const contactService = new ContactService();
