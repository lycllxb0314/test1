import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/services/api-client';
import type { RepairRecord, RepairStatistics, RepairFilters, RepairStatus, RepairType, RepairUrgency } from '@/types/general';

export function useRepairs(filters?: RepairFilters) {
  const [repairs, setRepairs] = useState<RepairRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRepairs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters?.type && filters.type !== 'all') params.append('type', filters.type);
      if (filters?.urgency && filters.urgency !== 'all') params.append('urgency', filters.urgency);
      if (filters?.applicantId) params.append('applicantId', filters.applicantId);

      const res = await apiClient.get<RepairRecord[]>(`/api/general/repairs?${params.toString()}`);
      setRepairs(res.data || []);
    } catch (err) {
      setError('获取报修列表失败');
      setRepairs([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.type, filters?.urgency, filters?.applicantId]);

  useEffect(() => {
    fetchRepairs();
  }, [fetchRepairs]);

  return { repairs, loading, error, refetch: fetchRepairs };
}

export function useRepairStatistics() {
  const [statistics, setStatistics] = useState<RepairStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.get<RepairStatistics>('/api/general/repairs/stats');
      setStatistics(res.data ?? null);
    } catch (err) {
      setError('获取统计数据失败');
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return { statistics, loading, error, refetch: fetchStatistics };
}

export function useRepairActions() {
  const createRepair = useCallback(async (data: {
    type: RepairType;
    assetId?: string;
    item: string;
    location: string;
    description: string;
    urgency: RepairUrgency;
    images?: string[];
    applicantId: string;
    applicantName: string;
    department?: string;
  }) => {
    try {
      const res = await apiClient.post<RepairRecord>('/api/general/repairs', data);
      return res.data;
    } catch (err) {
      throw new Error('创建报修失败');
    }
  }, []);

  const updateStatus = useCallback(async (id: string, status: RepairStatus, updates?: {
    assigneeId?: string;
    assigneeName?: string;
    estimatedCost?: number;
    actualCost?: number;
    scheduledDate?: string;
    note?: string;
  }) => {
    try {
      const res = await apiClient.put<RepairRecord>(`/api/general/repairs/${id}`, {
        status,
        ...updates,
      });
      return res.data;
    } catch (err) {
      throw new Error('更新状态失败');
    }
  }, []);

  const updateRepair = useCallback(async (id: string, updates: Partial<RepairRecord>) => {
    try {
      const res = await apiClient.put<RepairRecord>(`/api/general/repairs/${id}`, updates);
      return res.data;
    } catch (err) {
      throw new Error('更新报修记录失败');
    }
  }, []);

  const deleteRepair = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/api/general/repairs/${id}`);
      return true;
    } catch (err) {
      throw new Error('删除报修记录失败');
    }
  }, []);

  return { createRepair, updateStatus, updateRepair, deleteRepair };
}

export function useMyRepairs(applicantId: string | undefined) {
  const [repairs, setRepairs] = useState<RepairRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRepairs = useCallback(async () => {
    if (!applicantId) {
      setRepairs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.get<RepairRecord[]>(`/api/general/repairs?applicantId=${applicantId}`);
      setRepairs(res.data || []);
    } catch (err) {
      setError('获取我的报修记录失败');
      setRepairs([]);
    } finally {
      setLoading(false);
    }
  }, [applicantId]);

  useEffect(() => {
    fetchRepairs();
  }, [fetchRepairs]);

  return { repairs, loading, error, refetch: fetchRepairs };
}
