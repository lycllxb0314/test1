/**
 * 消息系统 Hook v6 - 极简版
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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
} from '@/types/messages';

// 直接从 localStorage 获取 token
const getToken = () => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('smart_campus_token') || localStorage.getItem('accessToken') || '';
};

// 构建认证头
const authHeaders = () => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

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

export function getMessageEventLabel(event: MessageEvent): string {
  const labels: Record<MessageEvent, string> = {
    system_announcement: '系统公告',
    maintenance_notice: '维护通知',
    policy_update: '政策更新',
    group_notice: '群组通知',
    schedule_change: '调课通知',
    exam_notice: '考试通知',
    grade_publish: '成绩发布',
    homework_assign: '作业布置',
    activity_notice: '活动通知',
    honor_notice: '荣誉通知',
    honor_campaign: '荣誉评选发布',
    honor_approval: '荣誉审批流转',
    honor_approved: '荣誉审批通过',
    honor_rejected: '荣誉审批拒绝',
    moral_evaluation: '德育评价',
    habit_record: '习惯记录',
    duty_reminder: '值日提醒',
    routine_score: '班级常规评分',
    research_activity: '教研活动',
    research_invitation: '教研邀请',
    research_reminder: '教研提醒',
    research_result: '教研成果',
    parent_meeting: '家长会通知',
    student_absence: '缺勤通知',
    repair_notice: '报修通知',
    asset_notice: '资产通知',
    safety_alert: '安全警报',
    personal_message: '个人消息',
    task_assign: '任务分配',
    task_reminder: '任务提醒',
    leave_approval: '请假审批',
  };
  return labels[event] || event;
}

export function getMessagePriorityLabel(priority: MessagePriority): string {
  return { low: '低', normal: '普通', high: '高', urgent: '紧急' }[priority] || priority;
}

export function getMessagePriorityColor(priority: MessagePriority): string {
  return { low: 'text-muted-foreground', normal: 'text-foreground', high: 'text-orange-500', urgent: 'text-red-500' }[priority] || 'text-foreground';
}

export function getMessageStatusLabel(status: MessageStatus): string {
  return { unread: '未读', read: '已读', archived: '已归档' }[status] || status;
}

export function getMessageStatusColor(status: MessageStatus): string {
  return { unread: 'bg-blue-500', read: 'bg-green-500', archived: 'bg-gray-500' }[status] || 'bg-gray-500';
}

export interface UseMessagesReturn {
  messages: UserMessage[];
  loading: boolean;
  error: string | null;
  statistics: MessageStatistics;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  filters: MessageQueryParams;
  setFilters: (filters: Partial<MessageQueryParams>) => void;
  clearFilters: () => void;
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
  sendToAll: (title: string, content: string, event?: MessageEvent, priority?: MessagePriority) => Promise<{ success: boolean; error?: string }>;
  sendToRoles: (roles: string[], title: string, content: string, event?: MessageEvent, priority?: MessagePriority) => Promise<{ success: boolean; error?: string }>;
  sendToClasses: (classIds: string[], title: string, content: string, event?: MessageEvent, priority?: MessagePriority) => Promise<{ success: boolean; error?: string }>;
  sendToUsers: (userIds: string[], title: string, content: string, event?: MessageEvent, priority?: MessagePriority) => Promise<{ success: boolean; error?: string }>;
  startPolling: (interval?: number) => void;
  stopPolling: () => void;
  isPolling: boolean;
}

const DEFAULT_STATISTICS: MessageStatistics = {
  total: 0, unread: 0, read: 0, archived: 0,
  byEvent: {} as Record<MessageEvent, number>,
  byPriority: {} as Record<MessagePriority, number>,
};

const DEFAULT_FILTERS: MessageQueryParams = {};

/**
 * useMessages Hook
 * @param department 部门过滤参数，用于部门工作台
 *                   - 'academic': 教务处工作台
 *                   - 'moral': 德育处工作台
 *                   - 'general': 总务处工作台
 *                   - undefined: 个人中心，显示所有消息
 */
export function useMessages(department?: 'academic' | 'moral' | 'general' | 'vice-principal-moral'): UseMessagesReturn {
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<MessageStatistics>(DEFAULT_STATISTICS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState<number>(PAGINATION.DEFAULT_DISPLAY_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [filters, setFiltersState] = useState<MessageQueryParams>(DEFAULT_FILTERS);
  const [isPolling, setIsPolling] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // 主请求逻辑
  useEffect(() => {
    let cancelled = false;
    
    const doFetch = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filters.event) params.append('event', filters.event);
        if (filters.status) params.append('status', filters.status);
        if (filters.priority) params.append('priority', filters.priority);
        if (filters.search) params.append('search', filters.search);
        if (filters.unreadOnly) params.append('unreadOnly', 'true');
        if (department) params.append('department', department);
        params.append('page', page.toString());
        params.append('pageSize', pageSize.toString());

        const response = await fetch(`/api/messages?${params.toString()}`, {
          credentials: 'include',
          headers: authHeaders(),
        });

        if (cancelled) return;

        const result = await response.json();

        if (!cancelled) {
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
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch messages:', err);
          setMessages([]);
          setError(err instanceof Error ? err.message : '获取消息失败');
          setLoading(false);
        }
      }
    };

    doFetch();

    return () => {
      cancelled = true;
    };
  }, [page, pageSize, filters.event, filters.status, filters.priority, filters.search, filters.unreadOnly, refreshKey, department]);

  // 手动刷新
  const refetch = useCallback(async () => {
    setRefreshKey(k => k + 1);
  }, []);

  const fetchMessages = refetch;

  // 分页操作
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

  // 筛选操作
  const setFilters = useCallback((newFilters: Partial<MessageQueryParams>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  // 发送消息
  const sendMessage = useCallback(async (request: SendMessageRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'include',
        body: JSON.stringify(request),
      });
      const result = await response.json();
      if (result.success) {
        refetch();
        return { success: true };
      }
      return { success: false, error: result.error || '发送失败' };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : '发送失败' };
    }
  }, [refetch]);

  // 状态更新操作
  const markAsRead = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, { 
        method: 'PUT', 
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ action: 'read' }),
      });
      const result = await response.json();
      if (result.success) { refetch(); return true; }
      return false;
    } catch { return false; }
  }, [refetch]);

  const markAsUnread = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, { 
        method: 'PUT', 
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ action: 'unread' }),
      });
      const result = await response.json();
      if (result.success) { refetch(); return true; }
      return false;
    } catch { return false; }
  }, [refetch]);

  const archiveMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, { 
        method: 'PUT', 
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ action: 'archive' }),
      });
      const result = await response.json();
      if (result.success) { refetch(); return true; }
      return false;
    } catch { return false; }
  }, [refetch]);

  const pinMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, { 
        method: 'PUT', 
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ action: 'pin' }),
      });
      const result = await response.json();
      if (result.success) { refetch(); return true; }
      return false;
    } catch { return false; }
  }, [refetch]);

  const unpinMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, { 
        method: 'PUT', 
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ action: 'unpin' }),
      });
      const result = await response.json();
      if (result.success) { refetch(); return true; }
      return false;
    } catch { return false; }
  }, [refetch]);

  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, { 
        method: 'DELETE', 
        credentials: 'include',
        headers: authHeaders(),
      });
      const result = await response.json();
      if (result.success) { refetch(); return true; }
      return false;
    } catch { return false; }
  }, [refetch]);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/messages/read-all', { 
        method: 'PATCH', 
        credentials: 'include',
        headers: authHeaders(),
      });
      const result = await response.json();
      if (result.success) { refetch(); return true; }
      return false;
    } catch { return false; }
  }, [refetch]);

  // 快捷发送
  const sendToAll = useCallback((title: string, content: string, event: MessageEvent = 'personal_message', priority?: MessagePriority) =>
    sendMessage({ recipients: { type: 'all' }, title, content, event, priority }), [sendMessage]);

  const sendToRoles = useCallback((roles: string[], title: string, content: string, event: MessageEvent = 'personal_message', priority?: MessagePriority) =>
    sendMessage({ recipients: { type: 'role', roles }, title, content, event, priority }), [sendMessage]);

  const sendToClasses = useCallback((classIds: string[], title: string, content: string, event: MessageEvent = 'personal_message', priority?: MessagePriority) =>
    sendMessage({ recipients: { type: 'class', classIds }, title, content, event, priority }), [sendMessage]);

  const sendToUsers = useCallback((userIds: string[], title: string, content: string, event: MessageEvent = 'personal_message', priority?: MessagePriority) =>
    sendMessage({ recipients: { type: 'individual', userIds }, title, content, event, priority }), [sendMessage]);

  // 轮询
  const startPolling = useCallback((interval: number = 30000) => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    setIsPolling(true);
    pollingIntervalRef.current = setInterval(() => setRefreshKey(k => k + 1), interval);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // 清理
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  return {
    messages, loading, error, statistics,
    page, pageSize, total, totalPages,
    goToPage, nextPage, prevPage, setPageSize,
    filters, setFilters, clearFilters,
    fetchMessages, refetch,
    sendMessage, markAsRead, markAsUnread, archiveMessage, pinMessage, unpinMessage, deleteMessage, markAllAsRead,
    sendToAll, sendToRoles, sendToClasses, sendToUsers,
    startPolling, stopPolling, isPolling,
  };
}
