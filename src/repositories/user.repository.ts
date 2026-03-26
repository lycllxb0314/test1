/**
 * 用户 Repository
 */

import { BaseRepository, QueryOptions, PaginatedResult } from './base.repository';
import type { User, UserRole, AdministrativeRole } from '@/types';

/**
 * 用户查询筛选条件
 */
export interface UserFilters {
  role?: UserRole;
  department?: string;
  status?: string;
  is_active?: boolean;
  [key: string]: unknown; // 添加索引签名
}

/**
 * 用户 Repository
 */
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }
  
  /**
   * 根据用户名查找用户
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.findWhere({ username }).then(users => users[0] || null);
  }
  
  /**
   * 根据工号查找用户
   */
  async findByEmployeeId(employeeId: string): Promise<User | null> {
    return this.findWhere({ employee_id: employeeId }).then(users => users[0] || null);
  }
  
  /**
   * 根据手机号查找用户
   */
  async findByPhone(phone: string): Promise<User | null> {
    return this.findWhere({ phone }).then(users => users[0] || null);
  }
  
  /**
   * 根据角色查询用户
   */
  async findByRole(role: UserRole): Promise<User[]> {
    return this.findWhere({ role });
  }
  
  /**
   * 查询行政人员（有行政职务的用户）
   */
  async findAdministrators(): Promise<User[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .not('administrative_roles', 'is', null)
      .neq('administrative_roles', '[]');
    
    if (error) {
      console.error('[UserRepository] findAdministrators error:', error.message);
      return [];
    }
    
    return (data || []) as User[];
  }
  
  /**
   * 查询班主任
   */
  async findHeadTeachers(): Promise<User[]> {
    return this.findWhere({ role: 'head_teacher' });
  }
  
  /**
   * 根据部门查询用户
   */
  async findByDepartment(department: string): Promise<User[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .ilike('department', `%${department}%`);
    
    if (error) {
      console.error('[UserRepository] findByDepartment error:', error.message);
      return [];
    }
    
    return (data || []) as User[];
  }
  
  /**
   * 分页查询用户
   */
  async findPaginatedWithFilters(
    options: QueryOptions & { filters?: UserFilters }
  ): Promise<PaginatedResult<User>> {
    return this.findPaginated(options);
  }
  
  /**
   * 更新用户密码
   */
  async updatePassword(userId: string, hashedPassword: string): Promise<boolean> {
    const { error } = await this.client
      .from(this.tableName)
      .update({ password: hashedPassword, updated_at: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) {
      console.error('[UserRepository] updatePassword error:', error.message);
      return false;
    }
    
    return true;
  }
  
  /**
   * 更新用户状态
   */
  async updateStatus(userId: string, isActive: boolean): Promise<boolean> {
    const { error } = await this.client
      .from(this.tableName)
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) {
      console.error('[UserRepository] updateStatus error:', error.message);
      return false;
    }
    
    return true;
  }
  
  /**
   * 更新最后登录时间
   */
  async updateLastLogin(userId: string): Promise<boolean> {
    const { error } = await this.client
      .from(this.tableName)
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId);
    
    return !error;
  }
  
  /**
   * 添加行政职务
   */
  async addAdministrativeRole(
    userId: string, 
    role: AdministrativeRole
  ): Promise<User | null> {
    // 先获取当前用户的行政职务
    const user = await this.findById(userId);
    if (!user) return null;
    
    const currentRoles = (user as any).administrative_roles || [];
    if (currentRoles.includes(role)) return user;
    
    const newRoles = [...currentRoles, role];
    
    return this.update(userId, { administrative_roles: newRoles } as any);
  }
  
  /**
   * 移除行政职务
   */
  async removeAdministrativeRole(
    userId: string, 
    role: AdministrativeRole
  ): Promise<User | null> {
    const user = await this.findById(userId);
    if (!user) return null;
    
    const currentRoles = (user as any).administrative_roles || [];
    const newRoles = currentRoles.filter((r: AdministrativeRole) => r !== role);
    
    return this.update(userId, { administrative_roles: newRoles } as any);
  }
}

// 导出单例
export const userRepository = new UserRepository();
