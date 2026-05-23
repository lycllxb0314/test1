'use client';

import { useCallback, useMemo } from 'react';
import { apiClient } from '@/services/api-client';
import { useCache, useStaticCache } from './useCache';
import type { HomeSchoolConversation, HomeSchoolWarning } from '@/types/home-school';

// ==================== 会话管理（带缓存） ====================
export function useHomeSchoolConversations(params?: {
  teacherId?: string;
  classId?: string;
  getAll?: boolean;
}) {
  const cacheKey = useMemo(() => {
    const parts = ['home-school-conversations'];
    if (params?.teacherId) parts.push(`teacher:${params.teacherId}`);
    if (params?.classId) parts.push(`class:${params.classId}`);
    if (params?.getAll) parts.push('all');
    return parts.join('-');
  }, [params]);

  const fetcher = useCallback(async () => {
    const query = new URLSearchParams();
    if (params?.teacherId) query.set('teacherId', params.teacherId);
    if (params?.classId) query.set('classId', params.classId);
    if (params?.getAll) query.set('getAll', 'true');
    const res = await apiClient.get<HomeSchoolConversation[]>(`/home-school/conversations?${query}`);
    return res.data ?? [];
  }, [params]);

  const { data: conversations, loading, refetch } = useStaticCache<HomeSchoolConversation[]>(cacheKey, fetcher);

  return { conversations: conversations ?? [], loading, refetch };
}

// ==================== 预警管理（带缓存） ====================
export function useHomeSchoolWarnings(params?: {
  isHandled?: boolean;
  riskLevel?: string;
  teacherId?: string;
}) {
  const cacheKey = useMemo(() => {
    const parts = ['home-school-warnings'];
    if (params?.isHandled !== undefined) parts.push(`handled:${params.isHandled}`);
    if (params?.riskLevel) parts.push(`risk:${params.riskLevel}`);
    if (params?.teacherId) parts.push(`teacher:${params.teacherId}`);
    return parts.join('-');
  }, [params]);

  const fetcher = useCallback(async () => {
    const query = new URLSearchParams();
    if (params?.isHandled !== undefined) query.set('isHandled', String(params.isHandled));
    if (params?.riskLevel) query.set('riskLevel', params.riskLevel);
    if (params?.teacherId) query.set('teacherId', params.teacherId);
    const res = await apiClient.get<HomeSchoolWarning[]>(`/home-school/warnings?${query}`);
    return res.data ?? [];
  }, [params]);

  const { data: warnings, loading, refetch } = useStaticCache<HomeSchoolWarning[]>(cacheKey, fetcher);

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
