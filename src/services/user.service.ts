/**
 * 用户服务
 * 
 * 处理用户相关的业务逻辑
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { userRepository, UserRepository, UserFilters } from '@/repositories';
import type { User, UserRole, AdministrativeRole, GroupType } from '@/types';
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
 * 审批人信息
 */
export interface ApproverInfo {
  employeeId: string;
  name: string;
  role: string;
  roleName: string;
  department?: string;
  position?: string;
}

/**
 * 用户账号信息（不含敏感信息）
 */
export interface UserAccountInfo {
  id: string;
  employeeId: string | null;
  name: string;
  role: string;
  additional_roles: AdministrativeRole[] | null;
  department: string | null;
  position: string | null;
  phone: string | null;
  status: string | null;
}

/**
 * 用户群组成员身份
 */
export interface UserGroupMembership {
  groupId: string;
  groupType: GroupType;
  groupName: string;
  isAdmin: boolean;
  joinType: 'auto' | 'manual';
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
      employeeId: params.employeeId,
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
      search: { fields: ['name', 'employeeId', 'username'], value: keyword },
      pagination: { page: 1, pageSize: 50 },
    });
    
    return this.ok(result.data);
  }

  /**
   * 获取用户账号列表（仅管理员）
   */
  async getAccountList(): Promise<ServiceResult<{
    users: UserAccountInfo[];
    groupedUsers: Record<string, UserAccountInfo[]>;
    roleNames: Record<string, string>;
    defaultPassword: string;
    note: string;
  }>> {
    const users = await this.repository.getAccountList();
    
    // 按角色分组
    const groupedUsers: Record<string, UserAccountInfo[]> = {};
    for (const user of users) {
      const role = user.role;
      if (!groupedUsers[role]) {
        groupedUsers[role] = [];
      }
      groupedUsers[role].push(user);
    }
    
    // 角色名称映射
    const roleNames: Record<string, string> = {
      principal: '校长',
      secretary: '书记',
      academic_vice_principal: '教学副校长',
      moral_vice_principal: '德育副校长',
      general_vice_principal: '总务副校长',
      head_teacher: '班主任',
      subject_teacher: '科任教师',
      skill_teacher: '技能课教师',
      parent: '家长',
    };
    
    return this.ok({
      users,
      groupedUsers,
      roleNames,
      defaultPassword: 'lysf2024',
      note: '所有用户默认密码为 lysf2024，请在首次登录后修改密码',
    });
  }

  /**
   * 获取审批人列表
   */
  async getApprovers(): Promise<ServiceResult<ApproverInfo[]>> {
    const leaders = await this.repository.findLeaders();
    
    const roleNames: Record<string, string> = {
      principal: '校长',
      secretary: '书记',
      academic_vice_principal: '教学副校长',
      moral_vice_principal: '德育副校长',
      general_vice_principal: '总务副校长',
    };
    
    const approvers: ApproverInfo[] = leaders.map(user => ({
      employeeId: user.employeeId || '',
      name: user.name,
      role: user.role,
      roleName: roleNames[user.role] || user.role,
      department: user.department || undefined,
      position: (user as any).position || undefined,
    }));
    
    return this.ok(approvers);
  }

  /**
   * 修改密码（支持管理员修改他人密码）
   */
  async changePasswordWithAuth(params: {
    userId: string;
    employeeId?: string;
    oldPassword?: string;
    newPassword: string;
    targetUserId?: string;
    targetEmployeeId?: string;
    userRoles: string[];
    additionalRoles: AdministrativeRole[];
  }): Promise<ServiceResult<{ message: string }>> {
    const {
      userId,
      employeeId,
      oldPassword,
      newPassword,
      targetUserId,
      targetEmployeeId,
      userRoles,
      additionalRoles,
    } = params;

    const isModifyOthers = targetUserId || targetEmployeeId;
    
    if (isModifyOthers) {
      // 管理员修改他人密码
      const hasAdminPermission = this.hasAdminPermission(userRoles, additionalRoles);
      if (!hasAdminPermission) {
        return this.fail('您没有权限修改他人密码', 'FORBIDDEN');
      }

      // 查找目标用户
      let targetUser: User | null = null;
      if (targetEmployeeId) {
        targetUser = await this.repository.findByEmployeeId(targetEmployeeId);
      } else if (targetUserId) {
        targetUser = await this.repository.findById(targetUserId);
      }

      if (!targetUser) {
        return this.fail('目标用户不存在', 'NOT_FOUND');
      }

      // 年段长权限检查
      const isGradeLeader = additionalRoles.includes('grade_leader');
      const isOnlyGradeLeader = !this.hasPrimaryAdminRole(userRoles) && 
                                 !additionalRoles.includes('academic_director') &&
                                 isGradeLeader;
      
      if (isOnlyGradeLeader) {
        const leaderRoles = ['principal', 'academic_vice_principal', 'moral_vice_principal', 'general_vice_principal', 'secretary'];
        if (leaderRoles.includes(targetUser.role)) {
          return this.fail('您没有权限修改该用户的密码', 'FORBIDDEN');
        }
      }

      // 更新密码
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await this.repository.updatePassword(targetUser.id, newPasswordHash);

      // 同步更新 teachers 表
      const targetUserEmployeeId = (targetUser as any).employee_id || targetUser.employeeId;
      if (targetUserEmployeeId) {
        await this.repository.syncPasswordToTeachers(targetUserEmployeeId, newPassword);
      }

      return this.ok({ message: `已成功修改 ${targetUser.name} 的密码` });
    } else {
      // 用户修改自己的密码
      if (!oldPassword) {
        return this.fail('请输入旧密码', 'VALIDATION_ERROR');
      }

      if (oldPassword === newPassword) {
        return this.fail('新密码不能与旧密码相同', 'VALIDATION_ERROR');
      }

      // 查询当前用户
      const dbUser = employeeId 
        ? await this.repository.findByEmployeeId(employeeId)
        : await this.repository.findById(userId);

      if (!dbUser) {
        return this.fail('用户不存在', 'NOT_FOUND');
      }

      // 验证旧密码
      const passwordHash = (dbUser as any).password_hash || (dbUser as any).password;
      if (!passwordHash) {
        return this.fail('账号异常，请联系管理员', 'INTERNAL_ERROR');
      }

      const isValidPassword = await bcrypt.compare(oldPassword, passwordHash);
      if (!isValidPassword) {
        return this.fail('旧密码错误', 'VALIDATION_ERROR');
      }

      // 更新密码
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await this.repository.updatePassword(dbUser.id, newPasswordHash);

      // 同步更新 teachers 表
      if (dbUser.role !== 'parent') {
        const userEmployeeId = (dbUser as any).employee_id || dbUser.employeeId;
        if (userEmployeeId) {
          await this.repository.syncPasswordToTeachers(userEmployeeId, newPassword);
        }
      }

      return this.ok({ message: '密码修改成功' });
    }
  }

  /**
   * 获取用户群组
   */
  async getUserGroups(userId: string): Promise<ServiceResult<UserGroupMembership[]>> {
    const groups = await this.repository.getUserGroups(userId);
    return this.ok(groups);
  }

  /**
   * 更新用户群组
   */
  async updateUserGroups(
    targetUserId: string,
    groups: GroupType[],
    operatorEmployeeId: string
  ): Promise<ServiceResult> {
    // 检查操作者是否为校长室成员
    const isPrincipalOffice = await this.repository.isPrincipalOfficeMember(operatorEmployeeId);
    if (!isPrincipalOffice) {
      return this.fail('无权限修改用户群组', 'FORBIDDEN');
    }

    await this.repository.updateUserGroups(targetUserId, groups);
    return this.ok();
  }

  /**
   * 检查是否有管理员权限
   */
  private hasAdminPermission(roles: string[], additionalRoles: AdministrativeRole[]): boolean {
    const primaryRoles = ['principal', 'academic_vice_principal'];
    const adminAdditionalRoles: AdministrativeRole[] = ['academic_director', 'grade_leader'];
    
    return roles.some(r => primaryRoles.includes(r)) || 
           additionalRoles.some(r => adminAdditionalRoles.includes(r));
  }

  /**
   * 检查是否有主要管理员角色
   */
  private hasPrimaryAdminRole(roles: string[]): boolean {
    const primaryRoles = ['principal', 'academic_vice_principal'];
    return roles.some(r => primaryRoles.includes(r));
  }
}

// 导出单例
export const userService = new UserService();
