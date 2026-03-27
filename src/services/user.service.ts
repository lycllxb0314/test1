/**
 * 用户服务
 * 
 * 处理用户相关的业务逻辑
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { userRepository, UserRepository, UserFilters } from '@/repositories';
import type { User, UserRole, AdministrativeRole } from '@/types';
import bcrypt from 'bcryptjs';

/**
 * 用户创建参数
 */
export interface CreateUserParams {
  username: string;
  password: string;
  name: string;
  role: UserRole;
  employeeId?: string;
  phone?: string;
  email?: string;
  department?: string;
  administrativeRoles?: AdministrativeRole[];
}

/**
 * 用户更新参数
 */
export interface UpdateUserParams {
  name?: string;
  phone?: string;
  email?: string;
  department?: string;
  administrativeRoles?: AdministrativeRole[];
}

/**
 * 用户服务
 */
export class UserService extends BaseService {
  private repository = userRepository;
  
  /**
   * 用户登录
   */
  async login(
    username: string,
    password: string
  ): Promise<ServiceResult<{ user: User; token: string }>> {
    // 查找用户
    const user = await this.repository.findByUsername(username);
    if (!user) {
      return this.fail('用户名或密码错误', 'INVALID_CREDENTIALS');
    }
    
    // 验证密码
    const hashedPassword = (user as any).password;
    if (!hashedPassword) {
      return this.fail('账户异常', 'ACCOUNT_ERROR');
    }
    
    const isValid = await bcrypt.compare(password, hashedPassword);
    if (!isValid) {
      return this.fail('用户名或密码错误', 'INVALID_CREDENTIALS');
    }
    
    // 检查账户状态
    if ((user as any).is_active === false) {
      return this.fail('账户已被禁用', 'ACCOUNT_DISABLED');
    }
    
    // 更新最后登录时间
    await this.repository.updateLastLogin(user.id);
    
    // 生成 token（简化版，实际应用中应使用 JWT）
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
    
    return this.ok({ user, token });
  }
  
  /**
   * 创建用户
   */
  async createUser(params: CreateUserParams): Promise<ServiceResult<User>> {
    // 检查用户名是否已存在
    const existingUser = await this.repository.findByUsername(params.username);
    if (existingUser) {
      return this.fail('用户名已存在', 'USERNAME_EXISTS');
    }
    
    // 检查工号是否已存在
    if (params.employeeId) {
      const existingEmployee = await this.repository.findByEmployeeId(params.employeeId);
      if (existingEmployee) {
        return this.fail('工号已存在', 'EMPLOYEE_ID_EXISTS');
      }
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(params.password, 10);
    
    // 创建用户
    const user = await this.repository.create({
      username: params.username,
      password: hashedPassword,
      name: params.name,
      role: params.role,
      employee_id: params.employeeId,
      phone: params.phone,
      email: params.email,
      department: params.department,
      administrative_roles: params.administrativeRoles || [],
      is_active: true,
    } as any);
    
    if (!user) {
      return this.fail('创建用户失败', 'CREATE_FAILED');
    }
    
    return this.ok(user);
  }
  
  /**
   * 更新用户信息
   */
  async updateUser(
    userId: string,
    params: UpdateUserParams,
    operatorId: string
  ): Promise<ServiceResult<User>> {
    // 检查权限
    const hasPermission = await this.checkPermission(operatorId);
    if (!hasPermission) {
      return this.fail('无权限修改用户信息', 'FORBIDDEN');
    }
    
    const user = await this.repository.update(userId, {
      name: params.name,
      phone: params.phone,
      email: params.email,
      department: params.department,
      administrative_roles: params.administrativeRoles,
    } as any);
    
    if (!user) {
      return this.fail('更新用户失败', 'UPDATE_FAILED');
    }
    
    return this.ok(user);
  }
  
  /**
   * 修改密码
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<ServiceResult> {
    const user = await this.repository.findById(userId);
    if (!user) {
      return this.fail('用户不存在', 'USER_NOT_FOUND');
    }
    
    // 验证旧密码
    const hashedPassword = (user as any).password;
    const isValid = await bcrypt.compare(oldPassword, hashedPassword);
    if (!isValid) {
      return this.fail('原密码错误', 'INVALID_OLD_PASSWORD');
    }
    
    // 更新密码
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    const success = await this.repository.updatePassword(userId, newHashedPassword);
    
    if (!success) {
      return this.fail('修改密码失败', 'UPDATE_FAILED');
    }
    
    return this.ok();
  }
  
  /**
   * 重置密码（管理员操作）
   */
  async resetPassword(
    userId: string,
    newPassword: string,
    operatorId: string
  ): Promise<ServiceResult> {
    // 检查操作者权限
    const operator = await this.getCurrentUser(operatorId);
    if (!operator || (operator as any).role === 'parent') {
      return this.fail('无权限重置密码', 'FORBIDDEN');
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const success = await this.repository.updatePassword(userId, hashedPassword);
    
    if (!success) {
      return this.fail('重置密码失败', 'UPDATE_FAILED');
    }
    
    return this.ok();
  }
  
  /**
   * 禁用/启用用户
   */
  async toggleUserStatus(
    userId: string,
    isActive: boolean,
    operatorId: string
  ): Promise<ServiceResult> {
    const operator = await this.getCurrentUser(operatorId);
    if (!operator) {
      return this.fail('操作者不存在', 'OPERATOR_NOT_FOUND');
    }
    
    // 只有管理员可以禁用用户
    const adminRoles = ['principal', 'secretary', 'academic_director', 'moral_director', 'general_director'];
    const operatorRoles = (operator as any).administrative_roles || [];
    const isAdmin = adminRoles.some(role => 
      operatorRoles.includes(role) || (operator as any).role === role
    );
    
    if (!isAdmin) {
      return this.fail('无权限禁用用户', 'FORBIDDEN');
    }
    
    const success = await this.repository.updateStatus(userId, isActive);
    
    if (!success) {
      return this.fail('操作失败', 'UPDATE_FAILED');
    }
    
    return this.ok();
  }
  
  /**
   * 分配行政职务
   */
  async assignAdministrativeRole(
    userId: string,
    role: AdministrativeRole,
    operatorId: string
  ): Promise<ServiceResult<User>> {
    const result = await this.repository.addAdministrativeRole(userId, role);
    
    if (!result) {
      return this.fail('分配职务失败', 'UPDATE_FAILED');
    }
    
    return this.ok(result);
  }
  
  /**
   * 移除行政职务
   */
  async removeAdministrativeRole(
    userId: string,
    role: AdministrativeRole,
    operatorId: string
  ): Promise<ServiceResult<User>> {
    const result = await this.repository.removeAdministrativeRole(userId, role);
    
    if (!result) {
      return this.fail('移除职务失败', 'UPDATE_FAILED');
    }
    
    return this.ok(result);
  }
  
  /**
   * 查询用户列表
   */
  async listUsers(
    filters: UserFilters = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedServiceResult<User>> {
    const result = await this.repository.findPaginatedWithFilters({
      filters,
      pagination: { page, pageSize },
    });
    
    return {
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }
  
  /**
   * 获取用户详情
   */
  async getUserDetail(userId: string): Promise<ServiceResult<User>> {
    const user = await this.repository.findById(userId);
    
    if (!user) {
      return this.fail('用户不存在', 'USER_NOT_FOUND');
    }
    
    return this.ok(user);
  }
  
  /**
   * 搜索用户
   */
  async searchUsers(
    keyword: string,
    options?: { role?: UserRole; department?: string }
  ): Promise<ServiceResult<User[]>> {
    const filters: Record<string, string> = {};
    if (options?.role) filters.role = options.role;
    if (options?.department) filters.department = options.department;
    
    const result = await this.repository.findPaginatedWithFilters({
      filters,
      search: { fields: ['name', 'employee_id', 'username'], value: keyword },
      pagination: { page: 1, pageSize: 50 },
    });
    
    return this.ok(result.data);
  }
}

// 导出单例
export const userService = new UserService();
