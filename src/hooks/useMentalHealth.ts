'use client';

import { useCallback } from 'react';
import { apiClient } from '@/services/api-client';
import { useCache, useStaticCache } from './useCache';

// ==================== 类型 ====================
type WarningItem = {
  id: string;
  studentId: string;
  studentName?: string;
  sessionId?: string;
  warningType: string;
  severity: string;
  title: string;
  description?: string;
  keywords?: string[];
  isRead: boolean;
  readBy?: string;
  readAt?: string;
  isHandled: boolean;
  handledBy?: string;
  handledAt?: string;
  handleNote?: string;
  createdAt: string;
};

type AuthKeyItem = {
  id: string;
  keyCode: string;
  createdByName: string;
  description?: string;
  scope: string;
  targetClassId?: string;
  targetStudentId?: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
};

type SessionItem = {
  id: string;
  studentId: string;
  anonymousId: string;
  title?: string;
  emotionLevel: string;
  emotionSummary?: string;
  turnCount: number;
  isClosed: boolean;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
};

type StatsData = {
  totalSessions: number;
  activeSessions: number;
  totalWarnings: number;
  unreadWarnings: number;
  redWarnings: number;
  yellowWarnings: number;
  todaySessions: number;
};

// ==================== 预警管理（带缓存） ====================
export function useWarnings(params?: {
  severity?: string;
  warningType?: string;
  isRead?: boolean;
  isHandled?: boolean;
  studentId?: string;
}) {
  const severity = params?.severity;
  const warningType = params?.warningType;
  const isRead = params?.isRead;
  const isHandled = params?.isHandled;
  const studentId = params?.studentId;

  const cacheKey = `mh-warn-${severity ?? ''}-${warningType ?? ''}-${isRead ?? 'x'}-${isHandled ?? 'x'}-${studentId ?? ''}`;

  const fetcher = useCallback(async () => {
    const query = new URLSearchParams();
    if (severity) query.set('severity', severity);
    if (warningType) query.set('warningType', warningType);
    if (isRead !== undefined) query.set('isRead', String(isRead));
    if (isHandled !== undefined) query.set('isHandled', String(isHandled));
    if (studentId) query.set('studentId', studentId);
    const res = await apiClient.get<WarningItem[]>(`/mental-health/warnings?${query}`);
    return res.data ?? [];
  }, [severity, warningType, isRead, isHandled, studentId]);

  const { data: warnings, loading, refetch } = useStaticCache<WarningItem[]>(cacheKey, fetcher, 2 * 60 * 1000);

  const markAsRead = useCallback(async (warningId: string) => {
    try {
      await apiClient.patch(`/mental-health/warnings`, { warningId, action: 'read' });
      refetch();
    } catch (err) {
      console.error('[useWarnings] markAsRead error:', err);
    }
  }, [refetch]);

  const handleWarning = useCallback(async (warningId: string, note: string) => {
    try {
      await apiClient.patch(`/mental-health/warnings`, { warningId, action: 'handle', handleNote: note });
      refetch();
    } catch (err) {
      console.error('[useWarnings] handleWarning error:', err);
    }
  }, [refetch]);

  return { warnings: warnings ?? [], loading, refetch, markAsRead, handleWarning };
}

// ==================== 授权密钥管理（带缓存） ====================
export function useAuthKeys() {
  const fetcher = useCallback(async () => {
    const res = await apiClient.get<AuthKeyItem[]>('/mental-health/auth-keys');
    return res.data ?? [];
  }, []);

  const { data: authKeys, loading, refetch } = useStaticCache<AuthKeyItem[]>('mental-health-auth-keys', fetcher, 5 * 60 * 1000);

  const createAuthKey = useCallback(async (data: {
    description?: string;
    scope: string;
    targetClassId?: string;
    targetStudentId?: string;
    maxUses?: number;
    validHours?: number;
  }) => {
    try {
      const res = await apiClient.post<AuthKeyItem>('/mental-health/auth-keys', data);
      refetch();
      return res.data ?? null;
    } catch (err) {
      console.error('[useAuthKeys] create error:', err);
      return null;
    }
  }, [refetch]);

  const deactivateAuthKey = useCallback(async (keyId: string) => {
    try {
      await apiClient.patch('/mental-health/auth-keys', { keyId, action: 'deactivate' });
      refetch();
    } catch (err) {
      console.error('[useAuthKeys] deactivate error:', err);
    }
  }, [refetch]);

  const verifyAuthKey = useCallback(async (keyCode: string, classId?: string) => {
    try {
      const res = await apiClient.post<{ valid: boolean; scope?: string; targetClassId?: string }>('/mental-health/auth-keys', { keyCode, classId, action: 'verify' });
      return res.data ?? { valid: false };
    } catch (err) {
      console.error('[useAuthKeys] verify error:', err);
      return { valid: false };
    }
  }, []);

  return { authKeys: authKeys ?? [], loading, refetch, createAuthKey, deactivateAuthKey, verifyAuthKey };
}

// ==================== 会话管理（带缓存） ====================
export function useSessions(params?: {
  studentId?: string;
  classId?: string;
  isClosed?: boolean;
}) {
  const studentId = params?.studentId;
  const classId = params?.classId;
  const isClosed = params?.isClosed;

  const cacheKey = `mh-sessions-${studentId ?? ''}-${classId ?? ''}-${isClosed ?? 'x'}`;

  const fetcher = useCallback(async () => {
    const query = new URLSearchParams();
    if (studentId) query.set('studentId', studentId);
    if (classId) query.set('classId', classId);
    if (isClosed !== undefined) query.set('isClosed', String(isClosed));
    const res = await apiClient.get<SessionItem[]>(`/mental-health/sessions?${query}`);
    return res.data ?? [];
  }, [studentId, classId, isClosed]);

  const { data: sessions, loading, refetch } = useStaticCache<SessionItem[]>(cacheKey, fetcher, 3 * 60 * 1000);

  return { sessions: sessions ?? [], loading, refetch };
}

// ==================== 统计概览（带缓存） ====================
export function useMentalStats() {
  const fetcher = useCallback(async () => {
    const res = await apiClient.get<StatsData>('/mental-health/stats');
    return res.data ?? null;
  }, []);

  const { data: stats, loading, refetch } = useStaticCache<StatsData | null>('mental-health-stats', fetcher, 2 * 60 * 1000);

  return { stats: stats ?? null, loading, refetch };
}

// ==================== 会话详情（带缓存，懒加载） ====================
type SessionDetail = {
  session: SessionItem;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
  }>;
};

export function useSessionDetail(sessionId: string | null) {
  const fetcher = useCallback(async () => {
    if (!sessionId) return null;
    const res = await apiClient.get<SessionDetail>(`/mental-health/sessions?sessionId=${sessionId}`);
    return res.data ?? null;
  }, [sessionId]);

  const { data, loading, refetch } = useCache<SessionDetail | null>({
    key: 'mental-health-session-detail',
    params: { sessionId: sessionId ?? '' },
    fetcher,
    enabled: !!sessionId,
    ttl: 2 * 60 * 1000,
  });

  return { data, loading, refetch };
}
