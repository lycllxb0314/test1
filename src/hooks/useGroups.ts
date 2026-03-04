/**
 * 群组管理 Hook
 * 
 * 功能：
 * - 获取群组列表
 * - 获取群组成员
 * - 添加/移除成员
 * - 设置群组管理员
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from './useApi';
import { GROUP_CONFIGS, type GroupType, type GroupInfo, type GroupMember, type UserGroupMembership } from '@/types';

// ==================== 类型定义 ====================

export type { GroupType, GroupInfo, GroupMember, UserGroupMembership };
export type GroupConfig = typeof GROUP_CONFIGS[GroupType];

export interface GroupFilters {
  groupType?: GroupType;
  search?: string;
}

export interface GroupStatistics {
  totalGroups: number;
  totalMembers: number;
  groupsByType: Record<GroupType, number>;
}

export interface UseGroupsReturn {
  // 数据
  groups: GroupInfo[];
  members: GroupMember[];
  candidates: Array<{
    id: string;
    name: string;
    role: string;
    employee_id?: string;
  }>;
  
  // 加载状态
  isLoadingGroups: boolean;
  isLoadingMembers: boolean;
  isLoadingCandidates: boolean;
  
  // 操作
  fetchMembers: (groupType: GroupType) => Promise<void>;
  fetchCandidates: (groupType: GroupType, search?: string) => Promise<void>;
  addMembers: (groupType: GroupType, userIds: string[]) => Promise<{ success: boolean; error?: string }>;
  removeMember: (groupType: GroupType, userId: string) => Promise<{ success: boolean; error?: string }>;
  setAdmin: (groupType: GroupType, userId: string, isAdmin: boolean) => Promise<{ success: boolean; error?: string }>;
  
  // 统计
  statistics: GroupStatistics;
  
  // 工具函数
  getGroupName: (type: GroupType) => string;
  getGroupConfig: (type: GroupType) => GroupConfig | undefined;
}

// ==================== Hook 实现 ====================

export function useGroups(): UseGroupsReturn {
  // 群组列表
  const { 
    data: groupsData, 
    loading: isLoadingGroups,
    refetch: refetchGroups,
  } = useQuery<{ groups: GroupInfo[] }>(
    async () => {
      const response = await fetch('/api/groups?action=list');
      if (!response.ok) throw new Error('获取群组列表失败');
      return { success: true, data: await response.json() };
    }
  );

  // 群组成员状态
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [currentGroupType, setCurrentGroupType] = useState<GroupType | null>(null);

  // 候选人状态
  const [candidates, setCandidates] = useState<Array<{ id: string; name: string; role: string; employee_id?: string }>>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);

  // 获取成员列表
  const fetchMembers = useCallback(async (groupType: GroupType) => {
    setIsLoadingMembers(true);
    setCurrentGroupType(groupType);
    try {
      const response = await fetch(`/api/groups?action=members&groupType=${groupType}`);
      if (!response.ok) throw new Error('获取群组成员失败');
      const data = await response.json();
      setMembers(data.members || []);
    } catch (error) {
      console.error('获取群组成员失败:', error);
      setMembers([]);
    } finally {
      setIsLoadingMembers(false);
    }
  }, []);

  // 获取候选人列表
  const fetchCandidates = useCallback(async (groupType: GroupType, search?: string) => {
    setIsLoadingCandidates(true);
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const response = await fetch(`/api/groups?action=candidates&groupType=${groupType}${searchParam}`);
      if (!response.ok) throw new Error('获取候选人失败');
      const data = await response.json();
      setCandidates(data.candidates || []);
    } catch (error) {
      console.error('获取候选人失败:', error);
      setCandidates([]);
    } finally {
      setIsLoadingCandidates(false);
    }
  }, []);

  // 添加成员
  const addMembers = useCallback(async (groupType: GroupType, userIds: string[]) => {
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_members',
          groupType,
          userIds,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || '添加成员失败' };
      }
      // 刷新数据
      refetchGroups();
      if (currentGroupType === groupType) {
        fetchMembers(groupType);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '添加成员失败' };
    }
  }, [refetchGroups, currentGroupType, fetchMembers]);

  // 移除成员
  const removeMember = useCallback(async (groupType: GroupType, userId: string) => {
    try {
      const response = await fetch(`/api/groups?groupType=${groupType}&userId=${userId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || '移除成员失败' };
      }
      // 刷新数据
      refetchGroups();
      if (currentGroupType === groupType) {
        fetchMembers(groupType);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '移除成员失败' };
    }
  }, [refetchGroups, currentGroupType, fetchMembers]);

  // 设置管理员
  const setAdmin = useCallback(async (groupType: GroupType, userId: string, isAdmin: boolean) => {
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_admin',
          groupType,
          targetUserId: userId,
          isAdmin,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || '设置管理员失败' };
      }
      // 刷新数据
      refetchGroups();
      if (currentGroupType === groupType) {
        fetchMembers(groupType);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '设置管理员失败' };
    }
  }, [refetchGroups, currentGroupType, fetchMembers]);

  // 计算统计数据
  const statistics: GroupStatistics = {
    totalGroups: Object.keys(GROUP_CONFIGS).length,
    totalMembers: groupsData?.groups?.reduce((sum, g) => sum + g.memberCount, 0) || 0,
    groupsByType: groupsData?.groups?.reduce((acc, g) => {
      acc[g.type] = g.memberCount;
      return acc;
    }, {} as Record<GroupType, number>) || {} as Record<GroupType, number>,
  };

  return {
    groups: groupsData?.groups || [],
    members,
    candidates,
    isLoadingGroups,
    isLoadingMembers,
    isLoadingCandidates,
    fetchMembers,
    fetchCandidates,
    addMembers,
    removeMember,
    setAdmin,
    statistics,
    getGroupName: (type: GroupType) => GROUP_CONFIGS[type]?.name || type,
    getGroupConfig: (type: GroupType) => GROUP_CONFIGS[type],
  };
}

// ==================== 辅助函数 ====================

/**
 * 获取用户所属群组
 */
export async function getUserGroups(userId: string): Promise<UserGroupMembership[]> {
  try {
    const response = await fetch(`/api/users/${userId}/groups`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.groups || [];
  } catch {
    return [];
  }
}

/**
 * 检查用户是否有某个模块的管理权限（考虑群组权限）
 */
export function hasModuleAdminPermission(
  userRole: string,
  additionalRoles: string[],
  userGroups: UserGroupMembership[],
  moduleType: string
): boolean {
  // 首先检查主角色和兼职角色的权限
  // ... 这里需要结合现有的权限系统
  
  // 然后检查群组权限
  for (const group of userGroups) {
    const config = GROUP_CONFIGS[group.groupType];
    if (config?.modulePermissions[moduleType as keyof typeof config.modulePermissions]?.includes('admin')) {
      return true;
    }
  }
  
  return false;
}
