/**
 * 消息系统 Hook
 * 
 * 提供完整的消息管理功能：
 * - 获取当前用户的消息列表
 * - 发送消息（支持全员、角色、班级、个人）
 * - 更新消息状态（已读、归档、置顶）
 * - 消息筛选和统计
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PAGINATION } from '@/lib/pagination-config';
import type {
  UserMessage,
  SendMessageRequest,
  MessageQueryParams,
  MessageStatistics,
  MessageEvent,
  MessagePriority,
  MessageStatus,
  MessageRecipient,
  MESSAGE_EVENT_CONFIGS,
} from '@/types/messages';
import { useTeachers, type TeacherInfo } from './useTeachers';
import { useStudents, type StudentInfo } from './useStudents';
import { useClasses, type ClassContainer } from './useClasses';
import { useParents, type ParentInfo } from './useParents';

// ==================== 类型定义 ====================

/** 消息列表返回类型 */
export interface UseMessagesReturn {
  // === 数据 ===
  messages: UserMessage[];
  allMessages: UserMessage[];
  loading: boolean;
  error: string | null;
  statistics: MessageStatistics;

  // === 分页 ===
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;

  // === 筛选 ===
  filters: MessageQueryParams;
  setFilters: (filters: Partial<MessageQueryParams>) => void;

  // === 消息操作 ===
  fetchMessages: () => Promise<void>;
  refetch: () => Promise<void>;
  sendMessage: (request: SendMessageRequest) => Promise<boolean>;
  markAsRead: (messageId: string) => Promise<boolean>;
  markAsUnread: (messageId: string) => Promise<boolean>;
  archiveMessage: (messageId: string) => Promise<boolean>;
  pinMessage: (messageId: string) => Promise<boolean>;
  unpinMessage: (messageId: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;

  // === 快捷发送 ===
  sendToAll: (title: string, content: string, event: MessageEvent, priority?: MessagePriority) => Promise<boolean>;
  sendToRoles: (roles: string[], title: string, content: string, event: MessageEvent, priority?: MessagePriority) => Promise<boolean>;
  sendToClasses: (classIds: string[], title: string, content: string, event: MessageEvent, priority?: MessagePriority) => Promise<boolean>;
  sendToUsers: (userIds: string[], title: string, content: string, event: MessageEvent, priority?: MessagePriority) => Promise<boolean>;

  // === 数据源（用于选择接收者） ===
  teachers: TeacherInfo[];
  students: StudentInfo[];
  classes: ClassContainer[];
  parents: ParentInfo[];
  dataLoading: boolean;
}

// ==================== Hook 实现 ====================

export function useMessages(initialFilters?: MessageQueryParams): UseMessagesReturn {
  // === 消息数据状态 ===
  const [allMessages, setAllMessages] = useState<UserMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<MessageStatistics>({
    total: 0,
    unread: 0,
    read: 0,
    archived: 0,
    byEvent: {} as Record<MessageEvent, number>,
    byPriority: {} as Record<MessagePriority, number>,
  });

  // === 分页状态 ===
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGINATION.DEFAULT_DISPLAY_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  // === 筛选状态 ===
  const [filters, setFiltersState] = useState<MessageQueryParams>(initialFilters || {});

  // === 数据源 Hooks ===
  const { allTeachers, loading: teachersLoading } = useTeachers();
  const { allStudents, loading: studentsLoading } = useStudents();
  const { allClasses, loading: classesLoading } = useClasses();
  const { allParents, loading: parentsLoading } = useParents();

  const dataLoading = teachersLoading || studentsLoading || classesLoading || parentsLoading;

  // 引用
  const mountedRef = useRef(true);

  // === 计算属性 ===
  const totalPages = Math.ceil(total / pageSize);

  // 筛选后的消息
  const messages = useMemo(() => {
    let result = allMessages;

    if (filters.event) {
      result = result.filter(m => m.event === filters.event);
    }
    if (filters.status) {
      result = result.filter(m => m.status === filters.status);
    }
    if (filters.priority) {
      result = result.filter(m => m.priority === filters.priority);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(m => 
        m.title.toLowerCase().includes(search) ||
        m.content.toLowerCase().includes(search)
      );
    }
    if (filters.unreadOnly) {
      result = result.filter(m => m.status === 'unread');
    }

    return result;
  }, [allMessages, filters]);

  // === 获取消息列表 ===
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.event) params.append('event', filters.event);
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);
      if (filters.unreadOnly) params.append('unreadOnly', 'true');
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());

      const response = await fetch(`/api/messages?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setAllMessages(result.data || []);
        setTotal(result.pagination?.total || 0);
        setStatistics(result.statistics || statistics);
      } else {
        setError(result.error || '获取消息失败');
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setError(err instanceof Error ? err.message : '获取消息失败');
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  // 初始加载
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // 清理
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // === 分页操作 ===
  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages || 1)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setPage(p => Math.min(totalPages, p + 1));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage(p => Math.max(1, p - 1));
  }, []);

  // === 筛选操作 ===
  const setFilters = useCallback((newFilters: Partial<MessageQueryParams>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setPage(1); // 重置页码
  }, []);

  const refetch = useCallback(() => {
    return fetchMessages();
  }, [fetchMessages]);

  // === 发送消息 ===
  const sendMessage = useCallback(async (request: SendMessageRequest): Promise<boolean> => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const result = await response.json();

      if (result.success) {
        await refetch();
        return true;
      } else {
        setError(result.error || '发送失败');
        return false;
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : '发送失败');
      return false;
    }
  }, [refetch]);

  // === 更新消息状态 ===
  const updateMessageStatus = useCallback(async (
    messageId: string, 
    action: 'read' | 'unread' | 'archive' | 'pin' | 'unpin'
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (result.success) {
        await refetch();
        return true;
      } else {
        setError(result.error || '操作失败');
        return false;
      }
    } catch (err) {
      console.error('Failed to update message status:', err);
      setError(err instanceof Error ? err.message : '操作失败');
      return false;
    }
  }, [refetch]);

  // === 标记已读/未读 ===
  const markAsRead = useCallback((messageId: string) => 
    updateMessageStatus(messageId, 'read'), [updateMessageStatus]);

  const markAsUnread = useCallback((messageId: string) => 
    updateMessageStatus(messageId, 'unread'), [updateMessageStatus]);

  // === 归档 ===
  const archiveMessage = useCallback((messageId: string) => 
    updateMessageStatus(messageId, 'archive'), [updateMessageStatus]);

  // === 置顶 ===
  const pinMessage = useCallback((messageId: string) => 
    updateMessageStatus(messageId, 'pin'), [updateMessageStatus]);

  const unpinMessage = useCallback((messageId: string) => 
    updateMessageStatus(messageId, 'unpin'), [updateMessageStatus]);

  // === 删除消息 ===
  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        await refetch();
        return true;
      } else {
        setError(result.error || '删除失败');
        return false;
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
      setError(err instanceof Error ? err.message : '删除失败');
      return false;
    }
  }, [refetch]);

  // === 全部标记已读 ===
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const unreadMessages = allMessages.filter(m => m.status === 'unread');
      
      await Promise.all(
        unreadMessages.map(m => 
          fetch(`/api/messages/${m.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'read' }),
          })
        )
      );

      await refetch();
      return true;
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      setError(err instanceof Error ? err.message : '操作失败');
      return false;
    }
  }, [allMessages, refetch]);

  // === 快捷发送方法 ===
  const sendToAll = useCallback((
    title: string, 
    content: string, 
    event: MessageEvent, 
    priority: MessagePriority = 'normal'
  ): Promise<boolean> => {
    return sendMessage({
      title,
      content,
      event,
      priority,
      recipients: { type: 'all' },
    });
  }, [sendMessage]);

  const sendToRoles = useCallback((
    roles: string[], 
    title: string, 
    content: string, 
    event: MessageEvent, 
    priority: MessagePriority = 'normal'
  ): Promise<boolean> => {
    return sendMessage({
      title,
      content,
      event,
      priority,
      recipients: { type: 'role', roles },
    });
  }, [sendMessage]);

  const sendToClasses = useCallback((
    classIds: string[], 
    title: string, 
    content: string, 
    event: MessageEvent, 
    priority: MessagePriority = 'normal'
  ): Promise<boolean> => {
    return sendMessage({
      title,
      content,
      event,
      priority,
      recipients: { type: 'class', classIds },
    });
  }, [sendMessage]);

  const sendToUsers = useCallback((
    userIds: string[], 
    title: string, 
    content: string, 
    event: MessageEvent, 
    priority: MessagePriority = 'normal'
  ): Promise<boolean> => {
    return sendMessage({
      title,
      content,
      event,
      priority,
      recipients: { type: 'individual', userIds },
    });
  }, [sendMessage]);

  return {
    // 数据
    messages,
    allMessages,
    loading,
    error,
    statistics,

    // 分页
    page,
    pageSize,
    total,
    totalPages,
    goToPage,
    nextPage,
    prevPage,

    // 筛选
    filters,
    setFilters,

    // 消息操作
    fetchMessages,
    refetch,
    sendMessage,
    markAsRead,
    markAsUnread,
    archiveMessage,
    pinMessage,
    unpinMessage,
    deleteMessage,
    markAllAsRead,

    // 快捷发送
    sendToAll,
    sendToRoles,
    sendToClasses,
    sendToUsers,

    // 数据源
    teachers: allTeachers,
    students: allStudents,
    classes: allClasses,
    parents: allParents,
    dataLoading,
  };
}

// ==================== 导出类型 ====================

export type {
  UserMessage,
  SendMessageRequest,
  MessageQueryParams,
  MessageStatistics,
  MessageEvent,
  MessagePriority,
  MessageStatus,
  MessageRecipient,
};
