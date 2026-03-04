/**
 * 消息系统 Hook v3
 * 
 * 提供完整的消息管理功能：
 * - 获取当前用户的消息列表
 * - 发送消息（支持全员、角色、班级、个人）
 * - 更新消息状态（已读、归档、置顶）
 * - 消息筛选和统计
 * - 实时轮询更新
 * 
 * @module hooks/useMessages
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

// 重新导出类型
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

// ==================== 辅助函数 ====================

/** 获取消息事件标签 */
export function getMessageEventLabel(event: MessageEvent): string {
  const labels: Record<MessageEvent, string> = {
    system_announcement: '系统公告',
    maintenance_notice: '维护通知',
    policy_update: '政策更新',
    schedule_change: '调课通知',
    exam_notice: '考试通知',
    grade_publish: '成绩发布',
    homework_assign: '作业布置',
    activity_notice: '活动通知',
    honor_notice: '荣誉通知',
    moral_evaluation: '德育评价',
    parent_meeting: '家长会通知',
    student_absence: '缺勤通知',
    habit_record: '习惯记录',
    leave_approval: '请假审批',
    repair_notice: '报修通知',
    asset_notice: '资产通知',
    safety_alert: '安全警报',
    personal_message: '个人消息',
    task_assign: '任务分配',
    task_reminder: '任务提醒',
  };
  return labels[event] || event;
}

/** 获取消息优先级标签 */
export function getMessagePriorityLabel(priority: MessagePriority): string {
  const labels: Record<MessagePriority, string> = {
    low: '低',
    normal: '普通',
    high: '高',
    urgent: '紧急',
  };
  return labels[priority] || priority;
}

/** 获取消息优先级颜色 */
export function getMessagePriorityColor(priority: MessagePriority): string {
  const colors: Record<MessagePriority, string> = {
    low: 'text-muted-foreground',
    normal: 'text-foreground',
    high: 'text-orange-500',
    urgent: 'text-red-500',
  };
  return colors[priority] || 'text-foreground';
}

/** 获取消息状态标签 */
export function getMessageStatusLabel(status: MessageStatus): string {
  const labels: Record<MessageStatus, string> = {
    unread: '未读',
    read: '已读',
    archived: '已归档',
  };
  return labels[status] || status;
}

/** 获取消息状态颜色 */
export function getMessageStatusColor(status: MessageStatus): string {
  const colors: Record<MessageStatus, string> = {
    unread: 'bg-blue-500',
    read: 'bg-green-500',
    archived: 'bg-gray-500',
  };
  return colors[status] || 'bg-gray-500';
}

// ==================== 类型定义 ====================

/** 消息列表返回类型 */
export interface UseMessagesReturn {
  // === 数据 ===
  messages: UserMessage[];
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
  setPageSize: (size: number) => void;

  // === 筛选 ===
  filters: MessageQueryParams;
  setFilters: (filters: Partial<MessageQueryParams>) => void;
  clearFilters: () => void;

  // === 消息操作 ===
  fetchMessages: () => Promise<void>;
  refetch: () => Promise<void>;
  sendMessage: (request: SendMessageRequest) => Promise<{ success: boolean; error?: string }>;
  markAsRead: (messageId: string) => Promise<boolean>;
  markAsUnread: (messageId: string) => Promise<boolean>;
  archiveMessage: (messageId: string) => Promise<boolean>;
  pinMessage: (messageId: string) => Promise<boolean>;
  unpinMessage: (messageId: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;

  // === 快捷发送 ===
  sendToAll: (title: string, content: string, event?: MessageEvent, priority?: MessagePriority) => Promise<{ success: boolean; error?: string }>;
  sendToRoles: (roles: string[], title: string, content: string, event?: MessageEvent, priority?: MessagePriority) => Promise<{ success: boolean; error?: string }>;
  sendToClasses: (classIds: string[], title: string, content: string, event?: MessageEvent, priority?: MessagePriority) => Promise<{ success: boolean; error?: string }>;
  sendToUsers: (userIds: string[], title: string, content: string, event?: MessageEvent, priority?: MessagePriority) => Promise<{ success: boolean; error?: string }>;

  // === 实时更新 ===
  startPolling: (interval?: number) => void;
  stopPolling: () => void;
  isPolling: boolean;
}

// 默认统计
const DEFAULT_STATISTICS: MessageStatistics = {
  total: 0,
  unread: 0,
  read: 0,
  archived: 0,
  byEvent: {} as Record<MessageEvent, number>,
  byPriority: {} as Record<MessagePriority, number>,
};

// 默认筛选 - 使用常量避免每次渲染创建新对象
const DEFAULT_FILTERS: MessageQueryParams = {};

// ==================== Hook 实现 ====================

export function useMessages(initialFilters?: MessageQueryParams): UseMessagesReturn {
  // === 消息数据状态 ===
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<MessageStatistics>(DEFAULT_STATISTICS);

  // === 分页状态 ===
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState<number>(PAGINATION.DEFAULT_DISPLAY_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  // === 筛选状态 ===
  // 使用 useMemo 稳定 filters 对象
  const stableInitialFilters = useMemo(() => initialFilters || {}, []);
  const [filters, setFiltersState] = useState<MessageQueryParams>(() => ({
    ...DEFAULT_FILTERS,
    ...stableInitialFilters,
  }));

  // === 轮询状态 ===
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 引用 - 使用 ref 存储最新状态，避免 fetchMessages 依赖变化
  const mountedRef = useRef(true);
  const stateRef = useRef({
    filters,
    page,
    pageSize,
  });
  
  // 保持 ref 同步
  stateRef.current = { filters, page, pageSize };

  // === 计算属性 ===
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // === 获取消息列表 ===
  const fetchMessages = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    setError(null);

    try {
      const { filters: currentFilters, page: currentPage, pageSize: currentPageSize } = stateRef.current;
      
      const params = new URLSearchParams();
      if (currentFilters.event) params.append('event', currentFilters.event);
      if (currentFilters.status) params.append('status', currentFilters.status);
      if (currentFilters.priority) params.append('priority', currentFilters.priority);
      if (currentFilters.search) params.append('search', currentFilters.search);
      if (currentFilters.unreadOnly) params.append('unreadOnly', 'true');
      params.append('page', currentPage.toString());
      params.append('pageSize', currentPageSize.toString());
      
      const response = await fetch(`/api/messages?${params.toString()}`);
      
      if (!mountedRef.current) return;
      
      const result = await response.json();

      if (result.success) {
        setMessages(result.data || []);
        setTotal(result.pagination?.total || 0);
        setStatistics(result.statistics || DEFAULT_STATISTICS);
        setError(null);
      } else {
        setMessages([]);
        setTotal(0);
        setError(result.error || '获取消息失败');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('Failed to fetch messages:', err);
      setMessages([]);
      setError(err instanceof Error ? err.message : '获取消息失败');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []); // 无依赖，通过 ref 获取最新状态

  // 初始加载
  useEffect(() => {
    fetchMessages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 当筛选或分页变化时触发请求
  useEffect(() => {
    // 跳过初始渲染（由上面的 useEffect 处理）
    const timer = setTimeout(() => {
      fetchMessages();
    }, 0);
    return () => clearTimeout(timer);
  // 只依赖具体的筛选字段和分页参数
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.event, 
    filters.status, 
    filters.priority, 
    filters.search, 
    filters.unreadOnly,
    page, 
    pageSize,
  ]);
  
  // 手动触发刷新
  const refetch = useCallback(async () => {
    await fetchMessages();
  }, [fetchMessages]);

  // 清理
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // === 分页操作 ===
  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setPage(p => Math.min(totalPages, p + 1));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage(p => Math.max(1, p - 1));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPage(1);
  }, []);

  // === 筛选操作 ===
  const setFilters = useCallback((newFilters: Partial<MessageQueryParams>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  // === 发送消息 ===
  const sendMessage = useCallback(async (request: SendMessageRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const result = await response.json();

      if (result.success) {
        await refetch();
        return { success: true };
      } else {
        return { success: false, error: result.error || '发送失败' };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : '发送失败' };
    }
  }, [refetch]);

  // === 状态更新操作 ===
  const markAsRead = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/messages/${messageId}/read`, { method: 'PATCH' });
      const result = await response.json();
      if (result.success) {
        await refetch();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [refetch]);

  const markAsUnread = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/messages/${messageId}/unread`, { method: 'PATCH' });
      const result = await response.json();
      if (result.success) {
        await refetch();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [refetch]);

  const archiveMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/messages/${messageId}/archive`, { method: 'PATCH' });
      const result = await response.json();
      if (result.success) {
        await refetch();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [refetch]);

  const pinMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/messages/${messageId}/pin`, { method: 'PATCH' });
      const result = await response.json();
      if (result.success) {
        await refetch();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [refetch]);

  const unpinMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/messages/${messageId}/unpin`, { method: 'PATCH' });
      const result = await response.json();
      if (result.success) {
        await refetch();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [refetch]);

  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        await refetch();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [refetch]);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/messages/read-all', { method: 'PATCH' });
      const result = await response.json();
      if (result.success) {
        await refetch();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [refetch]);

  // === 快捷发送 ===
  const sendToAll = useCallback(async (
    title: string,
    content: string,
    event: MessageEvent = 'personal_message',
    priority?: MessagePriority
  ): Promise<{ success: boolean; error?: string }> => {
    return sendMessage({
      recipients: { type: 'all' },
      title,
      content,
      event,
      priority,
    });
  }, [sendMessage]);

  const sendToRoles = useCallback(async (
    roles: string[],
    title: string,
    content: string,
    event: MessageEvent = 'personal_message',
    priority?: MessagePriority
  ): Promise<{ success: boolean; error?: string }> => {
    return sendMessage({
      recipients: { type: 'role', roles },
      title,
      content,
      event,
      priority,
    });
  }, [sendMessage]);

  const sendToClasses = useCallback(async (
    classIds: string[],
    title: string,
    content: string,
    event: MessageEvent = 'personal_message',
    priority?: MessagePriority
  ): Promise<{ success: boolean; error?: string }> => {
    return sendMessage({
      recipients: { type: 'class', classIds },
      title,
      content,
      event,
      priority,
    });
  }, [sendMessage]);

  const sendToUsers = useCallback(async (
    userIds: string[],
    title: string,
    content: string,
    event: MessageEvent = 'personal_message',
    priority?: MessagePriority
  ): Promise<{ success: boolean; error?: string }> => {
    return sendMessage({
      recipients: { type: 'individual', userIds },
      title,
      content,
      event,
      priority,
    });
  }, [sendMessage]);

  // === 实时更新 ===
  const startPolling = useCallback((interval: number = 30000) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    setIsPolling(true);
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, interval);
  }, [fetchMessages]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  return {
    // 数据
    messages,
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
    setPageSize,
    
    // 筛选
    filters,
    setFilters,
    clearFilters,
    
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
    
    // 实时更新
    startPolling,
    stopPolling,
    isPolling,
  };
}
