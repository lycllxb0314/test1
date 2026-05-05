/**
 * 门禁管理 Hooks
 * 
 * 整合人员管理、申请审批、通行记录等功能
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  AccessPerson,
  AccessApplication,
  AccessRecordItem,
  AccessStatistics,
  PersonType,
  ApplicationStatus,
  Direction,
} from '@/repositories/access-control.repository';

// ==================== 通用请求工具 ====================

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || json.error || '请求失败');
  return json.data as T;
}

// ==================== 统计 Hook ====================

export function useAccessStatistics() {
  const [data, setData] = useState<AccessStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFetch<AccessStatistics>('/api/access/statistics');
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取统计失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { data, loading, error, refresh: fetchStats };
}

// ==================== 人员管理 Hook ====================

export function useAccessPersons(params: {
  personType?: PersonType;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const [data, setData] = useState<AccessPerson[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPersons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const query = new URLSearchParams();
      if (params.personType) query.set('personType', params.personType);
      if (params.status) query.set('status', params.status);
      if (params.search) query.set('search', params.search);
      if (params.page) query.set('page', String(params.page));
      if (params.pageSize) query.set('pageSize', String(params.pageSize));

      const result = await apiFetch<{ data: AccessPerson[]; total: number; page: number; pageSize: number; totalPages: number }>(`/api/access/persons?${query}`);
      setData(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取人员列表失败');
    } finally {
      setLoading(false);
    }
  }, [params.personType, params.status, params.search, params.page, params.pageSize]);

  useEffect(() => { fetchPersons(); }, [fetchPersons]);

  const syncFromAcademic = useCallback(async (personType: PersonType) => {
    const result = await apiFetch<{ synced: number }>('/api/access/persons', {
      method: 'POST',
      body: JSON.stringify({ action: 'sync', personType }),
    });
    fetchPersons();
    return result;
  }, [fetchPersons]);

  const generateFaceVector = useCallback(async (personId: string, photoUrl: string) => {
    await apiFetch<boolean>('/api/access/persons', {
      method: 'POST',
      body: JSON.stringify({ action: 'generateFaceVector', personId, photoUrl }),
    });
    fetchPersons();
  }, [fetchPersons]);

  return { data, total, loading, error, refresh: fetchPersons, syncFromAcademic, generateFaceVector };
}

// ==================== 申请管理 Hook ====================

export function useAccessApplications(params: {
  status?: ApplicationStatus;
  applicantType?: 'parent' | 'visitor';
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const [data, setData] = useState<AccessApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const query = new URLSearchParams();
      if (params.status) query.set('status', params.status);
      if (params.applicantType) query.set('applicantType', params.applicantType);
      if (params.search) query.set('search', params.search);
      if (params.page) query.set('page', String(params.page));
      if (params.pageSize) query.set('pageSize', String(params.pageSize));

      const result = await apiFetch<{ data: AccessApplication[]; total: number; page: number; pageSize: number; totalPages: number }>(`/api/access/applications?${query}`);
      setData(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取申请列表失败');
    } finally {
      setLoading(false);
    }
  }, [params.status, params.applicantType, params.search, params.page, params.pageSize]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const approveApplication = useCallback(async (id: string) => {
    await apiFetch<AccessApplication>(`/api/access/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ action: 'approve' }),
    });
    fetchApplications();
  }, [fetchApplications]);

  const rejectApplication = useCallback(async (id: string, reason: string) => {
    await apiFetch<AccessApplication>(`/api/access/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ action: 'reject', reason }),
    });
    fetchApplications();
  }, [fetchApplications]);

  const cancelApplication = useCallback(async (id: string) => {
    await apiFetch<AccessApplication>(`/api/access/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ action: 'cancel' }),
    });
    fetchApplications();
  }, [fetchApplications]);

  return { data, total, loading, error, refresh: fetchApplications, approveApplication, rejectApplication, cancelApplication };
}

// ==================== 通行记录 Hook ====================

export function useAccessRecords(params: {
  personType?: PersonType;
  direction?: Direction;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const [data, setData] = useState<AccessRecordItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const query = new URLSearchParams();
      if (params.personType) query.set('personType', params.personType);
      if (params.direction) query.set('direction', params.direction);
      if (params.startDate) query.set('startDate', params.startDate);
      if (params.endDate) query.set('endDate', params.endDate);
      if (params.search) query.set('search', params.search);
      if (params.page) query.set('page', String(params.page));
      if (params.pageSize) query.set('pageSize', String(params.pageSize));

      const result = await apiFetch<{ data: AccessRecordItem[]; total: number; page: number; pageSize: number; totalPages: number }>(`/api/access/records?${query}`);
      setData(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取通行记录失败');
    } finally {
      setLoading(false);
    }
  }, [params.personType, params.direction, params.startDate, params.endDate, params.search, params.page, params.pageSize]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  return { data, total, loading, error, refresh: fetchRecords };
}
