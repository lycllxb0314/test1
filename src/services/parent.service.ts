/**
 * 家长服务层
 * 
 * 处理家长相关的业务逻辑
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import bcrypt from 'bcryptjs';

/**
 * 家长查询参数
 */
export interface ParentQueryParams {
  studentId?: string;
  phone?: string;
  name?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 创建家长参数
 */
export interface CreateParentParams {
  name: string;
  phone: string;
  studentId: string;
  relation: string;
  relationName?: string;
  isPrimary?: boolean;
  [key: string]: unknown;
}

/**
 * 家长服务
 */
export class ParentService extends BaseService {
  /**
   * 获取家长列表
   */
  async getList(params: ParentQueryParams): Promise<PaginatedServiceResult<Record<string, unknown>[]>> {
    try {
      const client = getSupabaseClient();
      const { page = 1, pageSize = 20, studentId, phone, name, status } = params;

      let query = client
        .from('parents')
        .select('*', { count: 'exact' });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }
      if (phone) {
        query = query.ilike('phone', `%${phone}%`);
      }
      if (name) {
        query = query.ilike('name', `%${name}%`);
      }
      if (status) {
        query = query.eq('status', status);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        return { success: false, error: '获取家长列表失败' };
      }

      return {
        success: true,
        data: data || [],
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      };
    } catch (err) {
      console.error('Get parent list error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 根据ID获取家长详情
   */
  async getById(id: string): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('parents')
        .select(`
          *,
          students (id, name, student_no, class_id, class_name, gender, birth_date)
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        return { success: false, error: '家长不存在', code: 'NOT_FOUND' };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Get parent by id error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 根据手机号获取家长信息
   */
  async getByPhone(phone: string): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('parents')
        .select('*')
        .eq('phone', phone)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        return { success: false, error: '家长不存在', code: 'NOT_FOUND' };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Get parent by phone error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 获取当前登录家长信息
   */
  async getMyInfo(phone: string): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const client = getSupabaseClient();
      
      const { data: parent, error } = await client
        .from('parents')
        .select('*')
        .eq('phone', phone)
        .eq('status', 'active')
        .single();

      if (error || !parent) {
        return { success: false, error: '家长信息不存在', code: 'NOT_FOUND' };
      }

      // 获取学生信息
      const { data: studentInfo } = await client
        .from('students')
        .select('id, name, student_no, class_id, class_name, gender, birth_date')
        .eq('id', parent.student_id)
        .single();

      // 获取该学生的其他家长
      const { data: otherParents } = await client
        .from('parents')
        .select('id, name, relation, relation_name, phone, is_primary')
        .eq('student_id', parent.student_id)
        .neq('id', parent.id);

      return {
        success: true,
        data: {
          ...parent,
          student: studentInfo,
          otherParents: otherParents || [],
        },
      };
    } catch (err) {
      console.error('Get my info error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 更新当前登录家长信息
   */
  async updateMyInfo(phone: string, body: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const client = getSupabaseClient();

      // 查询家长
      const { data: existingParent, error: fetchError } = await client
        .from('parents')
        .select('id, phone')
        .eq('phone', phone)
        .single();

      if (fetchError || !existingParent) {
        return { success: false, error: '家长信息不存在', code: 'NOT_FOUND' };
      }

      // 允许修改的字段
      const allowedFields = [
        'wechat', 'email', 'education', 'political_status',
        'household_address', 'current_address',
        'emergency_contact', 'emergency_phone',
        'occupation', 'work_unit', 'remark'
      ];

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateData[field] = body[field] || null;
        }
      }

      // 执行更新
      const { error: updateError } = await client
        .from('parents')
        .update(updateData)
        .eq('id', existingParent.id);

      if (updateError) {
        return { success: false, error: '更新失败: ' + updateError.message };
      }

      // 如果包含密码修改
      if (body.newPassword && body.oldPassword) {
        const { data: userData } = await client
          .from('users')
          .select('password_hash')
          .eq('phone', phone)
          .eq('role', 'parent')
          .single();

        if (userData?.password_hash) {
          const isValid = await bcrypt.compare(body.oldPassword as string, userData.password_hash);
          if (!isValid) {
            return { success: false, error: '旧密码错误', code: 'VALIDATION_ERROR' };
          }

          const newPasswordHash = await bcrypt.hash(body.newPassword as string, 10);
          await client
            .from('users')
            .update({ password_hash: newPasswordHash, updated_at: new Date().toISOString() })
            .eq('phone', phone)
            .eq('role', 'parent');

          await client
            .from('parents')
            .update({ password: body.newPassword })
            .eq('id', existingParent.id);
        }
      }

      // 获取更新后的数据
      const { data: updatedParent } = await client
        .from('parents')
        .select('*')
        .eq('id', existingParent.id)
        .single();

      return { success: true, data: updatedParent };
    } catch (err) {
      console.error('Update my info error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 创建家长
   */
  async create(params: CreateParentParams): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const client = getSupabaseClient();

      // 检查手机号是否已存在
      const { data: existing } = await client
        .from('parents')
        .select('id')
        .eq('phone', params.phone)
        .single();

      if (existing) {
        return { success: false, error: '该手机号已注册', code: 'DUPLICATE_PHONE' };
      }

      const parentId = `parent-${Date.now()}`;

      const { data, error } = await client
        .from('parents')
        .insert({
          id: parentId,
          name: params.name,
          phone: params.phone,
          student_id: params.studentId,
          relation: params.relation,
          relation_name: params.relationName || params.relation,
          is_primary: params.isPrimary || false,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: '创建失败: ' + error.message };
      }

      // 同步创建用户账号
      const defaultPassword = '123456';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      await client
        .from('users')
        .insert({
          id: `user-parent-${Date.now()}`,
          phone: params.phone,
          name: params.name,
          role: 'parent',
          password_hash: passwordHash,
          status: 'active',
        });

      return { success: true, data };
    } catch (err) {
      console.error('Create parent error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 更新家长
   */
  async update(id: string, params: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const client = getSupabaseClient();

      const { data, error } = await client
        .from('parents')
        .update({
          ...params,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: '更新失败' };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Update parent error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 删除家长
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    try {
      const client = getSupabaseClient();

      const { error } = await client
        .from('parents')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: '删除失败' };
      }

      return { success: true };
    } catch (err) {
      console.error('Delete parent error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 批量创建家长
   */
  async batchCreate(parents: CreateParentParams[]): Promise<ServiceResult<{ success: number; failed: number; errors: string[] }>> {
    try {
      const client = getSupabaseClient();
      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const parent of parents) {
        const result = await this.create(parent);
        if (result.success) {
          success++;
        } else {
          failed++;
          errors.push(`${parent.name}: ${result.error}`);
        }
      }

      return { success: true, data: { success, failed, errors } };
    } catch (err) {
      console.error('Batch create parents error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 修改密码
   */
  async changePassword(id: string, newPassword: string): Promise<ServiceResult<void>> {
    try {
      const client = getSupabaseClient();

      const { data: parent } = await client
        .from('parents')
        .select('phone')
        .eq('id', id)
        .single();

      if (!parent) {
        return { success: false, error: '家长不存在', code: 'NOT_FOUND' };
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await client
        .from('users')
        .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
        .eq('phone', parent.phone)
        .eq('role', 'parent');

      await client
        .from('parents')
        .update({ password: newPassword, updated_at: new Date().toISOString() })
        .eq('id', id);

      return { success: true };
    } catch (err) {
      console.error('Change password error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 获取用户的子女
   */
  async getChildrenByUser(userId: string): Promise<ServiceResult<Record<string, unknown>[]>> {
    try {
      const client = getSupabaseClient();

      // 先获取用户的手机号
      const { data: user } = await client
        .from('users')
        .select('phone')
        .eq('id', userId)
        .single();

      if (!user) {
        return { success: false, error: '用户不存在' };
      }

      // 获取该手机号关联的所有学生
      const { data: parents } = await client
        .from('parents')
        .select('student_id, students (*)')
        .eq('phone', user.phone)
        .eq('status', 'active');

      const children: Record<string, unknown>[] = [];
      parents?.forEach(p => {
        if (p.students && !Array.isArray(p.students)) {
          children.push(p.students as Record<string, unknown>);
        }
      });

      return { success: true, data: children };
    } catch (err) {
      console.error('Get children by user error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 迁移家长数据
   */
  async migrate(): Promise<ServiceResult<{ migrated: number }>> {
    try {
      const client = getSupabaseClient();

      // 获取所有没有对应用户账号的家长
      const { data: parents } = await client
        .from('parents')
        .select('id, phone, name, password')
        .is('user_id', null);

      let migrated = 0;

      for (const parent of parents || []) {
        // 检查用户是否已存在
        const { data: existingUser } = await client
          .from('users')
          .select('id')
          .eq('phone', parent.phone)
          .single();

        if (existingUser) {
          // 更新家长记录
          await client
            .from('parents')
            .update({ user_id: existingUser.id })
            .eq('id', parent.id);
        } else {
          // 创建新用户
          const passwordHash = await bcrypt.hash(parent.password || '123456', 10);
          const userId = `user-parent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          await client
            .from('users')
            .insert({
              id: userId,
              phone: parent.phone,
              name: parent.name,
              role: 'parent',
              password_hash: passwordHash,
              status: 'active',
            });

          await client
            .from('parents')
            .update({ user_id: userId })
            .eq('id', parent.id);
        }

        migrated++;
      }

      return { success: true, data: { migrated } };
    } catch (err) {
      console.error('Migrate parents error:', err);
      return { success: false, error: '服务器错误' };
    }
  }
}

// 导出单例
export const parentService = new ParentService();
