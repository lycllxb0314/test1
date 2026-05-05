'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/services/api-client';
import type { PurchaseRecord, PurchaseStatistics, PurchaseFilters, PurchaseItem } from '@/types/general';

export function usePurchases(filters?: PurchaseFilters) {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.type && filters.type !== 'all') params.set('type', filters.type);
      if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters?.urgency && filters.urgency !== 'all') params.set('urgency', filters.urgency);
      if (filters?.applicantId) params.set('applicantId', filters.applicantId);

      const res = await apiClient.get<PurchaseRecord[]>(`/api/general/purchase?${params.toString()}`);
      if (res.success && res.data) {
        setPurchases(res.data);
      } else {
        setError(res.error || '获取采购列表失败');
        setPurchases([]);
      }
    } catch (err) {
      setError('获取采购列表失败');
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.type, filters?.status, filters?.urgency, filters?.applicantId]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  return { purchases, loading, error, refetch: fetchPurchases };
}

export function usePurchaseStatistics() {
  const [stats, setStats] = useState<PurchaseStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.get<PurchaseStatistics>('/api/general/purchase/stats');
      if (res.success && res.data) {
        setStats(res.data);
      } else {
        setError(res.error || '获取统计数据失败');
      }
    } catch (err) {
      setError('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

export function usePurchaseActions() {
  const createPurchase = useCallback(async (data: {
    title: string;
    type: 'office_supplies' | 'equipment' | 'maintenance' | 'other';
    items: PurchaseItem[];
    totalAmount: number;
    reason: string;
    urgency: 'low' | 'normal' | 'high' | 'urgent';
    images?: string[];
    department: string;
    budgetSource?: string;
  }) => {
    const res = await apiClient.post<PurchaseRecord>('/api/general/purchase', data);
    return res.success && res.data ? res.data : null;
  }, []);

  const updateStatus = useCallback(async (
    id: string,
    status: 'pending' | 'approved' | 'ordered' | 'received' | 'completed' | 'rejected',
    updates?: {
      approverId?: string;
      approverName?: string;
      approvedAmount?: number;
      supplier?: string;
      orderDate?: string;
      receivedDate?: string;
      note?: string;
    }
  ) => {
    const res = await apiClient.put<PurchaseRecord>(`/api/general/purchase/${id}`, { status, ...updates });
    return res.success && res.data ? res.data : null;
  }, []);

  const deletePurchase = useCallback(async (id: string) => {
    const res = await apiClient.delete(`/api/general/purchase/${id}`);
    return res.success;
  }, []);

  return { createPurchase, updateStatus, deletePurchase };
}

export function useMyPurchases() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyPurchases = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.get<PurchaseRecord[]>('/api/general/purchase?applicantId=me');
      if (res.success && res.data) {
        setPurchases(res.data);
      } else {
        setError(res.error || '获取我的采购申请失败');
        setPurchases([]);
      }
    } catch (err) {
      setError('获取我的采购申请失败');
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyPurchases();
  }, [fetchMyPurchases]);

  return { purchases, loading, error, refetch: fetchMyPurchases };
}
