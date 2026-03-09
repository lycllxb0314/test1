/**
 * 群组管理 Hook v2
 * 
 * 功能：
 * - 获取群组列表
 * - 获取群组成员
 * - 添加/移除成员
 * - 设置群组管理员
 * - 群组统计
 * 
 * @module hooks/useGroups
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { GROUP_CONFIGS, type GroupType, type GroupInfo, type GroupMember } from '@/types';

// ==================== 类型定义 ====================

export type { GroupType, GroupInfo, GroupMember };
export type GroupConfig = typeof GROUP_CONFIGS[GroupType];

export interface GroupFilters {
  groupType?: GroupType;
  search?: string;
}

export interface GroupStatistics {
  totalGroups: number;
  totalMembers: number;
  groupsByType: Record<GroupType, number>;
  membersByType: Record<GroupType, number>;
}

export interface UseGroupsReturn {
  // === 数据 ===
  groups: GroupInfo[];
  members: GroupMember[];
  candidates: GroupCandidate[];
  
  // === 加载状态 ===
  loading: boolean;
  loadingMembers: boolean;
  loadingCandidates: boolean;
  error: string | null;
  
  // === 操作 ===
  fetchGroups: () => Promise<void>;
  fetchMembers: (groupType: GroupType) => Promise<void>;
  fetchCandidates: (groupType: GroupType, search?: string) => Promise<void>;
  addMembers: (groupType: GroupType, userIds: string[]) => Promise<{ success: boolean; error?: string }>;
  removeMember: (groupType: GroupType, userId: string) => Promise<{ success: boolean; error?: string }>;
  setAdmin: (groupType: GroupType, userId: string, isAdmin: boolean) => Promise<{ success: boolean; error?: string }>;
  
  // === 统计 ===
  statistics: GroupStatistics;
  
  // === 工具函数 ===
  getGroupName: (type: GroupType) => string;
  getGroupConfig: (type: GroupType) => GroupConfig | undefined;
  getGroupMembers: (type: GroupType) => GroupMember[];
  currentGroupType: GroupType | null;
}

export interface GroupCandidate {
  id: string;
  name: string;
  role: string;
  employee_id?: string;
  department?: string;
}

// 默认统计
const DEFAULT_STATISTICS: GroupStatistics = {
  totalGroups: Object.keys(GROUP_CONFIGS).length,
  totalMembers: 0,
  groupsByType: {} as Record<GroupType, number>,
  membersByType: {} as Record<GroupType, number>,
};

// ==================== Hook 实现 ====================

export function useGroups(): UseGroupsReturn {
  // === 群组列表状态 ===
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // === 群组成员状态 ===
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [currentGroupType, setCurrentGroupType] = useState<GroupType | null>(null);

  // === 候选人状态 ===
  const [candidates, setCandidates] = useState<GroupCandidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // 引用 - 使用 ref 跟踪组件挂载状态
  const mountedRef = useRef(false);

  // 组件挂载时设置 mountedRef
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // === 获取群组列表 ===
  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/groups?action=list');
      const result = await response.json();

      if (!mountedRef.current) return;

      console.log('[useGroups] API response:', result);

      if (result.groups) {
        setGroups(result.groups);
      } else if (result.success && result.data) {
        setGroups(result.data);
      } else {
        console.error('[useGroups] API error:', result.error);
        setError(result.error || '获取群组列表失败');
        setGroups([]);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('获取群组列表失败:', err);
      setError(err instanceof Error ? err.message : '获取群组列表失败');
      setGroups([]);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // === 获取成员列表 ===
  const fetchMembers = useCallback(async (groupType: GroupType) => {
    setLoadingMembers(true);
    setCurrentGroupType(groupType);
    setError(null);

    try {
      const response = await fetch(`/api/groups?action=members&groupType=${groupType}`);
      const result = await response.json();

      if (!mountedRef.current) return;

      if (result.members) {
        setMembers(result.members);
      } else if (result.success && result.data) {
        setMembers(result.data);
      } else {
        setMembers([]);
        setError(result.error || '获取群组成员失败');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('获取群组成员失败:', err);
      setError(err instanceof Error ? err.message : '获取群组成员失败');
      setMembers([]);
    } finally {
      if (mountedRef.current) {
        setLoadingMembers(false);
      }
    }
  }, []);

  // === 获取候选人列表 ===
  const fetchCandidates = useCallback(async (groupType: GroupType, search?: string) => {
    setLoadingCandidates(true);
    setError(null);

    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const response = await fetch(`/api/groups?action=candidates&groupType=${groupType}${searchParam}`);
      const result = await response.json();

      if (!mountedRef.current) return;

      if (result.candidates) {
        setCandidates(result.candidates);
      } else if (result.success && result.data) {
        setCandidates(result.data);
      } else {
        setCandidates([]);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('获取候选人失败:', err);
      setCandidates([]);
    } finally {
      if (mountedRef.current) {
        setLoadingCandidates(false);
      }
    }
  }, []);

  // === 添加成员 ===
  const addMembers = useCallback(async (groupType: GroupType, userIds: string[]) => {
    setError(null);

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

      const result = await response.json();

      if (!mountedRef.current) return { success: false, error: '组件已卸载' };

      if (result.success) {
        // 刷新数据
        await fetchGroups();
        if (currentGroupType === groupType) {
          await fetchMembers(groupType);
        }
        return { success: true };
      } else {
        return { success: false, error: result.error || '添加成员失败' };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : '添加成员失败' };
    }
  }, [fetchGroups, fetchMembers, currentGroupType]);

  // === 移除成员 ===
  const removeMember = useCallback(async (groupType: GroupType, userId: string) => {
    setError(null);

    try {
      const response = await fetch(`/api/groups?groupType=${groupType}&userId=${userId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!mountedRef.current) return { success: false, error: '组件已卸载' };

      if (result.success) {
        // 刷新数据
        await fetchGroups();
        if (currentGroupType === groupType) {
          await fetchMembers(groupType);
        }
        return { success: true };
      } else {
        return { success: false, error: result.error || '移除成员失败' };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : '移除成员失败' };
    }
  }, [fetchGroups, fetchMembers, currentGroupType]);

  // === 设置管理员 ===
  const setAdmin = useCallback(async (groupType: GroupType, userId: string, isAdmin: boolean) => {
    setError(null);

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

      const result = await response.json();

      if (!mountedRef.current) return { success: false, error: '组件已卸载' };

      if (result.success) {
        // 刷新数据
        await fetchGroups();
        if (currentGroupType === groupType) {
          await fetchMembers(groupType);
        }
        return { success: true };
      } else {
        return { success: false, error: result.error || '设置管理员失败' };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : '设置管理员失败' };
    }
  }, [fetchGroups, fetchMembers, currentGroupType]);

  // === 工具函数 ===
  const getGroupName = useCallback((type: GroupType): string => {
    return GROUP_CONFIGS[type]?.name || type;
  }, []);

  const getGroupConfig = useCallback((type: GroupType): GroupConfig | undefined => {
    return GROUP_CONFIGS[type];
  }, []);

  const getGroupMembers = useCallback((type: GroupType): GroupMember[] => {
    if (currentGroupType === type) {
      return members;
    }
    return [];
  }, [currentGroupType, members]);

  // === 计算统计数据 ===
  const statistics: GroupStatistics = useMemo(() => {
    const groupsByType = {} as Record<GroupType, number>;
    const membersByType = {} as Record<GroupType, number>;
    let totalMembers = 0;

    groups.forEach(g => {
      groupsByType[g.type as GroupType] = (groupsByType[g.type as GroupType] || 0) + 1;
      membersByType[g.type as GroupType] = (membersByType[g.type as GroupType] || 0) + (g.memberCount || 0);
      totalMembers += g.memberCount || 0;
    });

    return {
      totalGroups: groups.length,
      totalMembers,
      groupsByType,
      membersByType,
    };
  }, [groups]);

  // === 初始加载 ===
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    // 数据
    groups,
    members,
    candidates,
    
    // 加载状态
    loading,
    loadingMembers,
    loadingCandidates,
    error,
    
    // 操作
    fetchGroups,
    fetchMembers,
    fetchCandidates,
    addMembers,
    removeMember,
    setAdmin,
    
    // 统计
    statistics,
    
    // 工具函数
    getGroupName,
    getGroupConfig,
    getGroupMembers,
    currentGroupType,
  };
}

// ==================== 辅助函数 ====================

/** 获取群组类型标签 */
export function getGroupTypeLabel(type: GroupType): string {
  return GROUP_CONFIGS[type]?.name || type;
}

/** 获取群组类型颜色 */
export function getGroupTypeColor(type: GroupType): string {
  const colors: Record<GroupType, string> = {
    principal_office: 'bg-red-100 text-red-600',
    academic_office: 'bg-blue-100 text-blue-600',
    moral_office: 'bg-green-100 text-green-600',
    general_office: 'bg-orange-100 text-orange-600',
  };
  return colors[type] || 'bg-gray-100 text-gray-600';
}

/** 检查用户是否在群组中 */
export function isUserInGroup(members: GroupMember[], userId: string): boolean {
  return members.some(m => m.userId === userId);
}

/** 检查用户是否是群组管理员 */
export function isGroupAdmin(members: GroupMember[], userId: string): boolean {
  const member = members.find(m => m.userId === userId);
  return member?.isAdmin || false;
}

/** 获取群组管理员列表 */
export function getGroupAdmins(members: GroupMember[]): GroupMember[] {
  return members.filter(m => m.isAdmin);
}

/** 获取群组普通成员列表 */
export function getGroupRegularMembers(members: GroupMember[]): GroupMember[] {
  return members.filter(m => !m.isAdmin);
}
