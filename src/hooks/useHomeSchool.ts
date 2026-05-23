'use client';

import { useCallback } from 'react';
import { apiClient } from '@/services/api-client';
import { useCache, useStaticCache } from './useCache';
import type { HomeSchoolConversation, HomeSchoolWarning } from '@/types/home-school';

// ==================== 会话管理（带缓存） ====================
export function useHomeSchoolConversations(params?: {
  teacherId?: string;
  classId?: string;
  getAll?: boolean;
}) {
  const teacherId = params?.teacherId;
  const classId = params?.classId;
  const getAll = params?.getAll;

  const cacheKey = `home-school-conv-${teacherId ?? ''}-${classId ?? ''}-${getAll ? 'all' : 'self'}`;

  const fetcher = useCallback(async () => {
    const query = new URLSearchParams();
    if (teacherId) query.set('teacherId', teacherId);
    if (classId) query.set('classId', classId);
    if (getAll) query.set('all', 'true');
    const res = await apiClient.get<HomeSchoolConversation[]>(`/home-school/conversations?${query}`);
    return res.data ?? [];
  }, [teacherId, classId, getAll]);

  const { data: conversations, loading, refetch } = useStaticCache<HomeSchoolConversation[]>(cacheKey, fetcher, 3 * 60 * 1000);

  return { conversations: conversations ?? [], loading, refetch };
}

// ==================== 预警管理（带缓存） ====================
export function useHomeSchoolWarnings(params?: {
  isHandled?: boolean;
  riskLevel?: string;
  teacherId?: string;
}) {
  const isHandled = params?.isHandled;
  const riskLevel = params?.riskLevel;
  const teacherId = params?.teacherId;

  const cacheKey = `home-school-warn-${isHandled ?? 'all'}-${riskLevel ?? 'all'}-${teacherId ?? ''}`;

  const fetcher = useCallback(async () => {
    const query = new URLSearchParams();
    if (isHandled !== undefined) query.set('isHandled', String(isHandled));
    if (riskLevel) query.set('riskLevel', riskLevel);
    if (teacherId) query.set('teacherId', teacherId);
    const res = await apiClient.get<HomeSchoolWarning[]>(`/home-school/warnings?${query}`);
    return res.data ?? [];
  }, [isHandled, riskLevel, teacherId]);

  const { data: warnings, loading, refetch } = useStaticCache<HomeSchoolWarning[]>(cacheKey, fetcher, 2 * 60 * 1000);

  const handleWarning = useCallback(async (warningId: string, note: string) => {
    try {
      await apiClient.patch('/home-school/warnings', { warningId, action: 'handle', handleNote: note });
      refetch();
    } catch (err) {
      console.error('[useHomeSchoolWarnings] handleWarning error:', err);
    }
  }, [refetch]);

  return { warnings: warnings ?? [], loading, refetch, handleWarning };
}

// ==================== 会话详情（带缓存，懒加载） ====================
type ConversationDetail = {
  conversation: HomeSchoolConversation;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
    isWarningConfirm?: boolean;
    warningRiskLevel?: string;
    warningSummary?: string;
    warningRecommendation?: string;
  }>;
};

export function useConversationDetail(conversationId: string | null) {
  const fetcher = useCallback(async () => {
    if (!conversationId) return null;
    const res = await apiClient.get<ConversationDetail>(`/home-school/conversations?conversationId=${conversationId}`);
    return res.data ?? null;
  }, [conversationId]);

  const { data, loading, refetch } = useCache<ConversationDetail | null>({
    key: 'home-school-conversation-detail',
    params: { conversationId: conversationId ?? '' },
    fetcher,
    enabled: !!conversationId,
    ttl: 2 * 60 * 1000,
  });

  return { data, loading, refetch };
}
