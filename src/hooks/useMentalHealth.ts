'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/services/api-client';

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

// ==================== 预警管理 ====================
export function useWarnings() {
  const [warnings, setWarnings] = useState<WarningItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWarnings = useCallback(async (params?: {
    severity?: string;
    warningType?: string;
    isRead?: boolean;
    isHandled?: boolean;
    studentId?: string;
  }) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (params?.severity) query.set('severity', params.severity);
      if (params?.warningType) query.set('warningType', params.warningType);
      if (params?.isRead !== undefined) query.set('isRead', String(params.isRead));
      if (params?.isHandled !== undefined) query.set('isHandled', String(params.isHandled));
      if (params?.studentId) query.set('studentId', params.studentId);
      const res = await apiClient.get<WarningItem[]>(`/mental-health/warnings?${query}`);
      setWarnings(res.data ?? []);
    } catch (err) {
      console.error('[useWarnings] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (warningId: string) => {
    try {
      await apiClient.patch(`/mental-health/warnings`, { warningId, action: 'read' });
      setWarnings(prev => prev.map(w => w.id === warningId ? { ...w, isRead: true } : w));
    } catch (err) {
      console.error('[useWarnings] markAsRead error:', err);
    }
  }, []);

  const handleWarning = useCallback(async (warningId: string, note: string) => {
    try {
      await apiClient.patch(`/mental-health/warnings`, { warningId, action: 'handle', handleNote: note });
      setWarnings(prev => prev.map(w => w.id === warningId ? { ...w, isHandled: true, handleNote: note } : w));
    } catch (err) {
      console.error('[useWarnings] handleWarning error:', err);
    }
  }, []);

  return { warnings, loading, fetchWarnings, markAsRead, handleWarning };
}

// ==================== 授权密钥管理 ====================
export function useAuthKeys() {
  const [authKeys, setAuthKeys] = useState<AuthKeyItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAuthKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<AuthKeyItem[]>('/mental-health/auth-keys');
      setAuthKeys(res.data ?? []);
    } catch (err) {
      console.error('[useAuthKeys] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

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
      if (res.data) {
        setAuthKeys(prev => [res.data!, ...prev]);
      }
      return res.data ?? null;
    } catch (err) {
      console.error('[useAuthKeys] create error:', err);
      return null;
    }
  }, []);

  const deactivateAuthKey = useCallback(async (keyId: string) => {
    try {
      await apiClient.patch('/mental-health/auth-keys', { keyId, action: 'deactivate' });
      setAuthKeys(prev => prev.map(k => k.id === keyId ? { ...k, isActive: false } : k));
    } catch (err) {
      console.error('[useAuthKeys] deactivate error:', err);
    }
  }, []);

  const verifyAuthKey = useCallback(async (keyCode: string, classId?: string) => {
    try {
      const res = await apiClient.post<{ valid: boolean; scope?: string; targetClassId?: string }>('/mental-health/auth-keys', { keyCode, classId, action: 'verify' });
      return res.data ?? { valid: false };
    } catch (err) {
      console.error('[useAuthKeys] verify error:', err);
      return { valid: false };
    }
  }, []);

  return { authKeys, loading, fetchAuthKeys, createAuthKey, deactivateAuthKey, verifyAuthKey };
}

// ==================== 会话管理 ====================
export function useSessions() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSessions = useCallback(async (params?: {
    studentId?: string;
    classId?: string;
    isClosed?: boolean;
  }) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (params?.studentId) query.set('studentId', params.studentId);
      if (params?.classId) query.set('classId', params.classId);
      if (params?.isClosed !== undefined) query.set('isClosed', String(params.isClosed));
      const res = await apiClient.get<SessionItem[]>(`/mental-health/sessions?${query}`);
      setSessions(res.data ?? []);
    } catch (err) {
      console.error('[useSessions] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { sessions, loading, fetchSessions };
}

// ==================== 统计概览 ====================
export function useMentalStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<StatsData>('/mental-health/stats');
      setStats(res.data ?? null);
    } catch (err) {
      console.error('[useMentalStats] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { stats, loading, fetchStats };
}
