/**
 * 用户 Repository
 */

import { BaseRepository, QueryOptions, PaginatedResult } from './base.repository';
import type { User, UserRole, AdministrativeRole, GroupType } from '@/types';
import { GROUP_CONFIGS } from '@/types';

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
    return this.findWhere({ employeeId: employeeId }).then(users => users[0] || null);
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

  /**
   * 获取账号列表（不含密码）
   */
  async getAccountList(): Promise<UserAccountInfo[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('id, employeeId, name, role, additional_roles, department, position, phone, status')
      .order('role', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('[UserRepository] getAccountList error:', error.message);
      return [];
    }

    return (data || []) as UserAccountInfo[];
  }

  /**
   * 查询领导（校长室成员）
   */
  async findLeaders(): Promise<User[]> {
    const leaderRoles = [
      'principal',
      'secretary',
      'academic_vice_principal',
      'moral_vice_principal',
      'general_vice_principal',
    ];

    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .in('role', leaderRoles)
      .eq('status', 'active')
      .order('role');

    if (error) {
      console.error('[UserRepository] findLeaders error:', error.message);
      return [];
    }

    return (data || []) as User[];
  }

  /**
   * 同步密码到 teachers 表
   */
  async syncPasswordToTeachers(employeeId: string, plainPassword: string): Promise<boolean> {
    const { error } = await this.client
      .from('teachers')
      .update({
        password: plainPassword,
        updated_at: new Date().toISOString(),
      })
      .eq('employeeId', employeeId);

    if (error) {
      console.error('[UserRepository] syncPasswordToTeachers error:', error.message);
      return false;
    }

    return true;
  }

  /**
   * 获取用户群组
   */
  async getUserGroups(userId: string): Promise<Array<{
    groupId: string;
    groupType: GroupType;
    groupName: string;
    isAdmin: boolean;
    joinType: 'auto' | 'manual';
  }>> {
    // 先获取用户工号
    const user = await this.findById(userId);
    if (!user || !user.employeeId) {
      return [];
    }

    const { data, error } = await this.client
      .from('group_members')
      .select('group_id, group_type, is_admin, join_type, joined_at')
      .eq('user_id', user.employeeId);

    if (error) {
      console.error('[UserRepository] getUserGroups error:', error.message);
      return [];
    }

    return (data || []).map((m: Record<string, unknown>) => ({
      groupId: m.group_id as string,
      groupType: m.group_type as GroupType,
      groupName: GROUP_CONFIGS[m.group_type as GroupType]?.name || '',
      isAdmin: m.is_admin as boolean,
      joinType: m.join_type as 'auto' | 'manual',
    }));
  }

  /**
   * 检查用户是否为校长室成员
   */
  async isPrincipalOfficeMember(employeeId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('group_members')
      .select('id')
      .eq('user_id', employeeId)
      .eq('group_type', 'principal_office')
      .single();

    if (error) {
      return false;
    }

    return !!data;
  }

  /**
   * 更新用户群组
   */
  async updateUserGroups(targetUserId: string, newGroupTypes: GroupType[]): Promise<boolean> {
    // 获取目标用户的工号
    const targetUser = await this.findById(targetUserId);
    if (!targetUser || !targetUser.employeeId) {
      return false;
    }

    const targetEmployeeId = targetUser.employeeId;

    // 获取当前群组成员身份
    const { data: currentMemberships } = await this.client
      .from('group_members')
      .select('id, group_type, join_type')
      .eq('user_id', targetEmployeeId);

    const currentGroupTypes = new Set((currentMemberships || []).map((m: { group_type: string }) => m.group_type));
    const newGroupTypesSet = new Set(newGroupTypes);

    // 删除不再需要的群组成员（只删除手动添加的）
    const toRemove = (currentMemberships || [])
      .filter((m: { group_type: string; join_type: string }) =>
        !newGroupTypesSet.has(m.group_type as GroupType) && m.join_type === 'manual'
      )
      .map((m: { id: string }) => m.id);

    if (toRemove.length > 0) {
      await this.client
        .from('group_members')
        .delete()
        .in('id', toRemove);
    }

    // 添加新的群组成员
    const toAdd = [...newGroupTypesSet].filter(gt => !currentGroupTypes.has(gt));

    if (toAdd.length > 0) {
      const membersToAdd = toAdd.map(groupType => ({
        group_id: groupType,
        group_type: groupType,
        user_id: targetEmployeeId,
        is_admin: false,
        join_type: 'manual',
        joined_at: new Date().toISOString(),
      }));

      const { error } = await this.client
        .from('group_members')
        .insert(membersToAdd);

      if (error) {
        console.error('[UserRepository] updateUserGroups insert error:', error.message);
        return false;
      }
    }

    return true;
  }
}

// 导出单例
export const userRepository = new UserRepository();
