/**
 * 家长服务层
 * 
 * 架构：API Route → Service → Repository
 * 处理家长相关的业务逻辑
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { parentRepository, ParentRecord } from '@/repositories/parent.repository';
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
  classId?: string;
  grade?: number;
  hasAccount?: boolean;
  search?: string;
  relation?: string;
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
  async getList(params: ParentQueryParams): Promise<PaginatedServiceResult<Record<string, unknown>>> {
    try {
      const result = await parentRepository.findList({
        studentId: params.studentId,
        phone: params.phone,
        name: params.name,
        status: params.status,
        classId: params.classId,
        search: params.search,
        hasAccount: params.hasAccount,
        page: params.page,
        pageSize: params.pageSize,
      });

      return {
        success: true,
        data: result.data as unknown as Record<string, unknown>[],
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
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
  async getById(id: string): Promise<ServiceResult<ParentRecord>> {
    try {
      const data = await parentRepository.findWithStudent(id);
      
      if (!data) {
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
  async getByPhone(phone: string): Promise<ServiceResult<ParentRecord>> {
    try {
      const data = await parentRepository.findByPhone(phone);
      
      if (!data || data.status !== 'active') {
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
      const parent = await parentRepository.findByPhone(phone);
      
      if (!parent || parent.status !== 'active') {
        return { success: false, error: '家长信息不存在', code: 'NOT_FOUND' };
      }

      // 获取其他家长
      const otherParents = parent.student_id 
        ? await parentRepository.findOtherParents(parent.student_id, parent.id)
        : [];

      // 组装学生信息为嵌套对象格式
      const student = parent.student_id ? {
        id: parent.student_id,
        name: parent.student_name,
        student_no: parent.student_id, // student_id 就是学号
        class_id: parent.class_id,
        class_name: parent.class_name,
        gender: parent.gender, // 如果有的话
      } : undefined;

      return {
        success: true,
        data: {
          ...parent,
          student,
          otherParents,
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
  async updateMyInfo(phone: string, body: Record<string, unknown>): Promise<ServiceResult<ParentRecord>> {
    try {
      const existingParent = await parentRepository.findByPhone(phone);
      
      if (!existingParent) {
        return { success: false, error: '家长信息不存在', code: 'NOT_FOUND' };
      }

      // 允许修改的字段
      const allowedFields = [
        'wechat', 'email', 'education', 'political_status',
        'household_address', 'current_address',
        'emergency_contact', 'emergency_phone',
        'occupation', 'work_unit', 'remark'
      ];

      const updateData: Record<string, unknown> = {};

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateData[field] = body[field] || null;
        }
      }

      // 更新家长信息
      const updated = await parentRepository.update(existingParent.id, updateData);
      
      if (!updated) {
        return { success: false, error: '更新失败' };
      }

      // 如果包含密码修改
      if (body.newPassword && body.oldPassword) {
        const client = getSupabaseClient();
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

          await parentRepository.update(existingParent.id, { password: body.newPassword as string });
        }
      }

      // 获取更新后的数据
      const finalData = await parentRepository.findById(existingParent.id);
      
      return { success: true, data: finalData || updated };
    } catch (err) {
      console.error('Update my info error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 创建家长
   */
  async create(params: CreateParentParams): Promise<ServiceResult<ParentRecord>> {
    try {
      // 检查手机号是否已存在
      const exists = await parentRepository.existsByPhone(params.phone);
      
      if (exists) {
        return { success: false, error: '该手机号已注册', code: 'DUPLICATE_PHONE' };
      }

      const parentId = `parent-${Date.now()}`;

      const data = await parentRepository.create({
        id: parentId,
        name: params.name,
        phone: params.phone,
        student_id: params.studentId,
        relation: params.relation,
        relation_name: params.relationName || params.relation,
        is_primary: params.isPrimary || false,
        status: 'active',
      } as unknown as Partial<ParentRecord>);

      if (!data) {
        return { success: false, error: '创建失败' };
      }

      // 同步创建用户账号
      const client = getSupabaseClient();
      const defaultPassword = '123456';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      await client
        .from('users')
        .insert({
          id: crypto.randomUUID(),
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
  async update(id: string, params: Record<string, unknown>): Promise<ServiceResult<ParentRecord>> {
    try {
      const data = await parentRepository.update(id, params);
      
      if (!data) {
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
      const success = await parentRepository.delete(id);
      
      if (!success) {
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
      let successCount = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const parent of parents) {
        const result = await this.create(parent);
        if (result.success) {
          successCount++;
        } else {
          failed++;
          errors.push(`${parent.name}: ${result.error}`);
        }
      }

      return { success: true, data: { success: successCount, failed, errors } };
    } catch (err) {
      console.error('Batch create parents error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 批量开通账号
   */
  async batchCreateAccounts(parentIds: string[]): Promise<ServiceResult<{ success: number; failed: number; data: { id: string; name: string; defaultPassword: string }[]; errors: string[] }>> {
    try {
      const successData: { id: string; name: string; defaultPassword: string }[] = [];
      const errors: string[] = [];
      let successCount = 0;

      for (const parentId of parentIds) {
        const parent = await parentRepository.findById(parentId);
        
        if (!parent) {
          errors.push(`家长ID ${parentId} 不存在`);
          continue;
        }

        if (!parent.phone) {
          errors.push(`${parent.name}: 请先填写手机号`);
          continue;
        }

        // 检查是否已有账号
        const client = getSupabaseClient();
        const { data: existingUser } = await client
          .from('users')
          .select('id')
          .eq('phone', parent.phone)
          .eq('role', 'parent')
          .single();

        if (existingUser) {
          // 更新家长记录关联用户
          await parentRepository.update(parentId, { 
            account_id: existingUser.id, 
            has_account: true 
          });
          successData.push({ id: parentId, name: parent.name, defaultPassword: '(已存在)' });
          successCount++;
          continue;
        }

        // 创建新用户账号 - 使用有效的 UUID
        const defaultPassword = '123456';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);
        const userId = crypto.randomUUID();

        const { error: insertError } = await client
          .from('users')
          .insert({
            id: userId,
            phone: parent.phone,
            name: parent.name,
            role: 'parent',
            password_hash: passwordHash,
            status: 'active',
          });

        if (insertError) {
          errors.push(`${parent.name}: 创建账号失败 - ${insertError.message}`);
          continue;
        }

        // 更新家长记录
        await parentRepository.update(parentId, { 
          account_id: userId, 
          has_account: true,
          password: defaultPassword 
        });

        successData.push({ id: parentId, name: parent.name, defaultPassword });
        successCount++;
      }

      return { 
        success: true, 
        data: { 
          success: successCount, 
          failed: errors.length, 
          data: successData,
          errors 
        } 
      };
    } catch (err) {
      console.error('Batch create accounts error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 批量重置密码
   */
  async batchResetPasswords(parentIds: string[]): Promise<ServiceResult<{ success: number; failed: number; data: { id: string; name: string; newPassword: string }[]; errors: string[] }>> {
    try {
      const successData: { id: string; name: string; newPassword: string }[] = [];
      const errors: string[] = [];
      let successCount = 0;

      for (const parentId of parentIds) {
        const parent = await parentRepository.findById(parentId);
        
        if (!parent) {
          errors.push(`家长ID ${parentId} 不存在`);
          continue;
        }

        if (!parent.phone) {
          errors.push(`${parent.name || parentId}: 请先填写手机号`);
          continue;
        }

        // 生成新密码
        const newPassword = Math.random().toString(36).slice(-6);
        const passwordHash = await bcrypt.hash(newPassword, 10);
        const client = getSupabaseClient();

        // 更新用户密码
        const { error: updateError } = await client
          .from('users')
          .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
          .eq('phone', parent.phone)
          .eq('role', 'parent');

        if (updateError) {
          errors.push(`${parent.name}: 重置密码失败 - ${updateError.message}`);
          continue;
        }

        // 更新家长记录
        await parentRepository.update(parentId, { password: newPassword });

        successData.push({ id: parentId, name: parent.name || parentId, newPassword });
        successCount++;
      }

      return { 
        success: true, 
        data: { 
          success: successCount, 
          failed: errors.length, 
          data: successData,
          errors 
        } 
      };
    } catch (err) {
      console.error('Batch reset passwords error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 批量设置主要联系人
   */
  async batchSetPrimary(parentIds: string[]): Promise<ServiceResult<{ success: number; failed: number; errors: string[] }>> {
    try {
      const errors: string[] = [];
      let successCount = 0;

      for (const parentId of parentIds) {
        const parent = await parentRepository.findById(parentId);
        
        if (!parent) {
          errors.push(`家长ID ${parentId} 不存在`);
          continue;
        }

        // 如果该学生已有主要联系人，先取消
        if (parent.student_id) {
          const client = getSupabaseClient();
          await client
            .from('parents')
            .update({ is_primary: false })
            .eq('student_id', parent.student_id)
            .eq('is_primary', true);
        }

        // 设置为主要联系人
        await parentRepository.update(parentId, { is_primary: true });
        successCount++;
      }

      return { 
        success: true, 
        data: { 
          success: successCount, 
          failed: errors.length, 
          errors 
        } 
      };
    } catch (err) {
      console.error('Batch set primary error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 修改密码
   */
  async changePassword(id: string, newPassword: string): Promise<ServiceResult<void>> {
    try {
      const parent = await parentRepository.findById(id);
      
      if (!parent) {
        return { success: false, error: '家长不存在', code: 'NOT_FOUND' };
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      const client = getSupabaseClient();

      await client
        .from('users')
        .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
        .eq('phone', parent.phone)
        .eq('role', 'parent');

      await parentRepository.update(id, { password: newPassword });

      return { success: true };
    } catch (err) {
      console.error('Change password error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 获取用户的子女
   */
  async getChildrenByUser(userId: string): Promise<ServiceResult<ParentRecord[]>> {
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
      const children = await parentRepository.findChildrenByPhone(user.phone);

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
        .is('account_id', null);

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
            .update({ account_id: existingUser.id, has_account: true })
            .eq('id', parent.id);
        } else {
          // 创建新用户
          const passwordHash = await bcrypt.hash(parent.password || '123456', 10);
          const userId = crypto.randomUUID();

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
            .update({ account_id: userId, has_account: true })
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
