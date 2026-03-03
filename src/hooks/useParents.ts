/**
 * 家长数据管理 Hook
 * 
 * ==================== 架构定位 ====================
 * 家长是完整实体，但从属学生 → 从属班级。
 * 家长有账号、有独立信息（姓名、关系、联系方式、工作单位等），是完整实体，
 * 但必须绑定学生，最终归属到班级，不能脱离班级独立存在。
 * 
 * ==================== 职责边界 ====================
 * 1. 家长必须绑定学生，通过学生关联班级
 * 2. 提供家长管理功能（创建、更新、删除）
 * 3. 提供家长账号登录支持
 * 4. 提供家长通知、消息功能
 * 5. 不直接关联班级，通过学生间接关联
 * 
 * ==================== 关联关系 ====================
 * - 绑定学生：通过 studentId 关联学生
 * - 间接班级：通过学生归属班级
 * - 独立账号：家长有独立登录账号
 * 
 * ==================== 数据获取 ====================
 * - 使用统一分页配置 (src/lib/pagination-config.ts)
 * - 支持大数据量获取，确保获取所有家长数据
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PAGINATION } from '@/lib/pagination-config';

// ==================== 类型定义 ====================

/** 家长与学生关系 */
export type ParentRelation = 'father' | 'mother' | 'grandfather' | 'grandmother' | 'other';

/** 家长信息 */
export interface ParentInfo {
  // === 基本信息 ===
  id: string;
  name: string;
  relation: ParentRelation;
  relationName: string;
  phone?: string;
  wechat?: string;
  email?: string;
  
  // === 工作信息 ===
  company?: string;
  position?: string;
  education?: string;
  
  // === 账号信息 ===
  userId?: string;
  hasAccount: boolean;
  lastLoginAt?: string;
  
  // === 学生绑定（核心关联） ===
  studentId: string;            // 必填：绑定学生
  studentName: string;
  isPrimary: boolean;           // 是否主要联系人
  
  // === 班级信息（通过学生获取） ===
  classId?: string;
  className?: string;
  grade?: number;
  gradeName?: string;
  
  // === 班主任信息 ===
  headTeacherId?: string;
  headTeacherName?: string;
  
  // === 通知设置 ===
  notificationSettings?: {
    homework: boolean;
    notice: boolean;
    attendance: boolean;
    activity: boolean;
  };
  
  // === 时间戳 ===
  createdAt?: string;
  updatedAt?: string;
}

/** 家长筛选参数 */
export interface ParentFilters {
  search?: string;
  classId?: string | 'all';
  studentId?: string | 'all';
  relation?: ParentRelation | 'all';
  hasAccount?: boolean | 'all';
}

/** 家长统计信息 */
export interface ParentStatistics {
  total: number;
  hasAccountCount: number;
  primaryParentCount: number;
  relationDistribution: Record<string, number>;
  classCount: number;
}

/** 家长通知设置 */
export interface ParentNotificationSettings {
  homework: boolean;
  notice: boolean;
  attendance: boolean;
  activity: boolean;
}

/** 家长消息 */
export interface ParentMessage {
  id: string;
  parentId: string;
  title: string;
  content: string;
  type: 'homework' | 'notice' | 'attendance' | 'activity' | 'system';
  isRead: boolean;
  createdAt: string;
}

/** Hook 返回类型 */
export interface UseParentsReturn {
  // === 数据 ===
  parents: ParentInfo[];
  loading: boolean;
  error: string | null;
  
  // === 统计 ===
  statistics: ParentStatistics;
  
  // === 筛选 ===
  filters: ParentFilters;
  setFilters: (filters: ParentFilters) => void;
  
  // === 查询方法 ===
  fetchParents: () => Promise<void>;
  refetch: () => Promise<void>;
  getParentById: (id: string) => ParentInfo | undefined;
  
  // === 学生关联查询 ===
  getParentsByStudent: (studentId: string) => ParentInfo[];
  getPrimaryParentByStudent: (studentId: string) => ParentInfo | undefined;
  
  // === 班级关联查询（通过学生） ===
  getParentsByClass: (classId: string) => ParentInfo[];
  getParentsByGrade: (grade: number) => ParentInfo[];
  
  // === 家长管理 ===
  createParent: (parent: Partial<ParentInfo> & { studentId: string; name: string; relation: ParentRelation }) => Promise<boolean>;
  updateParent: (id: string, data: Partial<ParentInfo>) => Promise<boolean>;
  deleteParent: (id: string) => Promise<boolean>;
  
  // === 主要联系人管理 ===
  setPrimaryParent: (studentId: string, parentId: string) => Promise<boolean>;
  
  // === 账号管理 ===
  createParentAccount: (parentId: string) => Promise<boolean>;
  resetParentPassword: (parentId: string) => Promise<boolean>;
  
  // === 通知设置 ===
  updateNotificationSettings: (parentId: string, settings: Partial<ParentNotificationSettings>) => Promise<boolean>;
  
  // === 消息 ===
  messages: ParentMessage[];
  fetchParentMessages: (parentId: string) => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<boolean>;
  sendMessage: (parentId: string, message: { title: string; content: string; type: ParentMessage['type'] }) => Promise<boolean>;
}

// 关系名称映射
const RELATION_NAMES: Record<ParentRelation, string> = {
  father: '父亲',
  mother: '母亲',
  grandfather: '祖父',
  grandmother: '祖母',
  other: '其他',
};

// ==================== Hook 实现 ====================

export function useParents(initialFilters?: ParentFilters): UseParentsReturn {
  const [parents, setParents] = useState<ParentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ParentFilters>(initialFilters || {});
  const [messages, setMessages] = useState<ParentMessage[]>([]);
  
  // 统计数据
  const statistics = useMemo<ParentStatistics>(() => {
    const relationDistribution: Record<string, number> = {};
    
    parents.forEach(p => {
      relationDistribution[p.relation] = (relationDistribution[p.relation] || 0) + 1;
    });
    
    return {
      total: parents.length,
      hasAccountCount: parents.filter(p => p.hasAccount).length,
      primaryParentCount: parents.filter(p => p.isPrimary).length,
      relationDistribution,
      classCount: new Set(parents.map(p => p.classId)).size,
    };
  }, [parents]);
  
  // 获取家长列表
  const fetchParents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 构建查询参数（使用统一分页配置）
      const params = new URLSearchParams();
      params.append('pageSize', PAGINATION.ENTITY_CONFIG.parents.fetchPageSize.toString());
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.classId && filters.classId !== 'all') {
        params.append('classId', filters.classId);
      }
      if (filters.studentId && filters.studentId !== 'all') {
        params.append('studentId', filters.studentId);
      }
      if (filters.relation && filters.relation !== 'all') {
        params.append('relation', filters.relation);
      }
      if (filters.hasAccount !== undefined && filters.hasAccount !== 'all') {
        params.append('hasAccount', filters.hasAccount.toString());
      }
      
      const response = await fetch(`/api/parents?${params.toString()}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        // 转换数据格式
        const formattedParents: ParentInfo[] = result.data.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          name: p.name as string,
          relation: p.relation as ParentRelation,
          relationName: RELATION_NAMES[p.relation as ParentRelation] || '其他',
          phone: p.phone as string,
          wechat: p.wechat as string,
          email: p.email as string,
          company: p.company as string,
          position: p.position as string,
          education: p.education as string,
          userId: p.user_id as string,
          hasAccount: p.has_account as boolean || false,
          lastLoginAt: p.last_login_at as string,
          studentId: p.student_id as string, // 必填：绑定学生
          studentName: p.student_name as string,
          isPrimary: p.is_primary as boolean || false,
          classId: p.class_id as string,
          className: p.class_name as string,
          grade: p.grade as number,
          gradeName: p.grade_name as string,
          headTeacherId: p.head_teacher_id as string,
          headTeacherName: p.head_teacher_name as string,
          notificationSettings: p.notification_settings as ParentNotificationSettings,
          createdAt: p.created_at as string,
          updatedAt: p.updated_at as string,
        }));
        
        setParents(formattedParents);
      }
    } catch (err) {
      console.error('获取家长数据失败:', err);
      setError(err instanceof Error ? err.message : '获取家长数据失败');
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  // 根据ID获取家长
  const getParentById = useCallback((id: string) => 
    parents.find(p => p.id === id),
  [parents]);
  
  // 根据学生获取家长（核心方法：学生绑定查询）
  const getParentsByStudent = useCallback((studentId: string) => 
    parents.filter(p => p.studentId === studentId),
  [parents]);
  
  // 获取学生的主要家长
  const getPrimaryParentByStudent = useCallback((studentId: string): ParentInfo | undefined => {
    const studentParents = parents.filter(p => p.studentId === studentId);
    return studentParents.find(p => p.isPrimary) || studentParents[0];
  }, [parents]);
  
  // 根据班级获取家长（通过学生关联）
  const getParentsByClass = useCallback((classId: string) => 
    parents.filter(p => p.classId === classId),
  [parents]);
  
  // 根据年级获取家长
  const getParentsByGrade = useCallback((grade: number) => 
    parents.filter(p => p.grade === grade),
  [parents]);
  
  // 创建家长（studentId 必填）
  const createParent = useCallback(async (
    parent: Partial<ParentInfo> & { studentId: string; name: string; relation: ParentRelation }
  ): Promise<boolean> => {
    // 验证学生绑定
    if (!parent.studentId) {
      console.error('创建家长失败：必须绑定学生');
      return false;
    }
    
    try {
      const response = await fetch('/api/parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: parent.name,
          relation: parent.relation,
          phone: parent.phone,
          wechat: parent.wechat,
          email: parent.email,
          company: parent.company,
          position: parent.position,
          education: parent.education,
          student_id: parent.studentId, // 必填
          is_primary: parent.isPrimary,
        }),
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const relation = result.data.relation as ParentRelation;
        const newParent: ParentInfo = {
          id: result.data.id,
          name: result.data.name,
          relation: relation,
          relationName: RELATION_NAMES[relation] || '其他',
          phone: result.data.phone,
          wechat: result.data.wechat,
          email: result.data.email,
          studentId: result.data.student_id,
          studentName: result.data.student_name,
          isPrimary: result.data.is_primary || false,
          hasAccount: false,
        };
        setParents(prev => [...prev, newParent]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('创建家长失败:', err);
      return false;
    }
  }, []);
  
  // 更新家长
  const updateParent = useCallback(async (id: string, data: Partial<ParentInfo>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/parents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          relation: data.relation,
          phone: data.phone,
          wechat: data.wechat,
          email: data.email,
          company: data.company,
          position: data.position,
          education: data.education,
          is_primary: data.isPrimary,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setParents(prev => prev.map(p => {
          if (p.id === id) {
            return { 
              ...p, 
              ...data,
              relationName: data.relation ? RELATION_NAMES[data.relation] : p.relationName,
            };
          }
          return p;
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('更新家长失败:', err);
      return false;
    }
  }, []);
  
  // 删除家长
  const deleteParent = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/parents/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setParents(prev => prev.filter(p => p.id !== id));
        return true;
      }
      return false;
    } catch (err) {
      console.error('删除家长失败:', err);
      return false;
    }
  }, []);
  
  // 设置主要联系人
  const setPrimaryParent = useCallback(async (studentId: string, parentId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/parents/set-primary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, parentId }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 更新本地状态：将同学生的其他家长设为非主要
        setParents(prev => prev.map(p => {
          if (p.studentId === studentId) {
            return { ...p, isPrimary: p.id === parentId };
          }
          return p;
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('设置主要联系人失败:', err);
      return false;
    }
  }, []);
  
  // 创建家长账号
  const createParentAccount = useCallback(async (parentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/parents/${parentId}/create-account`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setParents(prev => prev.map(p => {
          if (p.id === parentId) {
            return { ...p, hasAccount: true, userId: result.data?.userId };
          }
          return p;
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('创建家长账号失败:', err);
      return false;
    }
  }, []);
  
  // 重置家长密码
  const resetParentPassword = useCallback(async (parentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/parents/${parentId}/reset-password`, {
        method: 'POST',
      });
      
      const result = await response.json();
      return result.success;
    } catch (err) {
      console.error('重置家长密码失败:', err);
      return false;
    }
  }, []);
  
  // 更新通知设置
  const updateNotificationSettings = useCallback(async (
    parentId: string, 
    settings: Partial<ParentNotificationSettings>
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/parents/${parentId}/notification-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setParents(prev => prev.map(p => {
          if (p.id === parentId) {
            return { 
              ...p, 
              notificationSettings: { ...p.notificationSettings, ...settings } as ParentNotificationSettings,
            };
          }
          return p;
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('更新通知设置失败:', err);
      return false;
    }
  }, []);
  
  // 获取家长消息
  const fetchParentMessages = useCallback(async (parentId: string) => {
    try {
      const response = await fetch(`/api/parents/${parentId}/messages`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setMessages(result.data);
      }
    } catch (err) {
      console.error('获取家长消息失败:', err);
    }
  }, []);
  
  // 标记消息已读
  const markMessageAsRead = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/parents/messages/${messageId}/read`, {
        method: 'PUT',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessages(prev => prev.map(m => {
          if (m.id === messageId) {
            return { ...m, isRead: true };
          }
          return m;
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('标记消息已读失败:', err);
      return false;
    }
  }, []);
  
  // 发送消息
  const sendMessage = useCallback(async (
    parentId: string, 
    message: { title: string; content: string; type: ParentMessage['type'] }
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/parents/${parentId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
      
      const result = await response.json();
      return result.success;
    } catch (err) {
      console.error('发送消息失败:', err);
      return false;
    }
  }, []);
  
  // 初始化加载
  useEffect(() => {
    fetchParents();
  }, [fetchParents]);
  
  return {
    // 数据
    parents,
    loading,
    error,
    statistics,
    
    // 筛选
    filters,
    setFilters,
    
    // 查询方法
    fetchParents,
    refetch: fetchParents,
    getParentById,
    
    // 学生关联查询
    getParentsByStudent,
    getPrimaryParentByStudent,
    
    // 班级关联查询
    getParentsByClass,
    getParentsByGrade,
    
    // 家长管理
    createParent,
    updateParent,
    deleteParent,
    
    // 主要联系人管理
    setPrimaryParent,
    
    // 账号管理
    createParentAccount,
    resetParentPassword,
    
    // 通知设置
    updateNotificationSettings,
    
    // 消息
    messages,
    fetchParentMessages,
    markMessageAsRead,
    sendMessage,
  };
}

export default useParents;
