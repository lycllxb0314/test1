/**
 * 门禁管理 Hooks
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/services/api-client';
import type { AccessPerson, AccessApplication, AccessRecord, PersonType, ApplicationStatus } from '@/repositories/access-control.repository';

// ==================== 统计 ====================

type AccessStatistics = {
  totalPersons: number;
  todayRecords: number;
  todayIn: number;
  todayOut: number;
  pendingApplications: number;
  activeVisitors: number;
  personTypeDistribution: { type: string; count: number }[];
};

export function useAccessStatistics() {
  const [data, setData] = useState<AccessStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<AccessStatistics>('/api/access/statistics');
      if (res.success && res.data) setData(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, refresh: fetch };
}

// ==================== 人员管理 ====================

type PersonListResult = { items: AccessPerson[]; total: number };

export function useAccessPersons(params: {
  personType?: PersonType;
  search?: string;
  page: number;
  pageSize: number;
}) {
  const [data, setData] = useState<AccessPerson[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      if (params.personType) searchParams.set('personType', params.personType);
      if (params.search) searchParams.set('search', params.search);
      searchParams.set('page', String(params.page));
      searchParams.set('pageSize', String(params.pageSize));

      const res = await apiClient.get<PersonListResult>(`/api/access/persons?${searchParams}`);
      if (res.success && res.data) {
        setData(res.data.items || []);
        setTotal(res.data.total || 0);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [params.personType, params.search, params.page, params.pageSize]);

  useEffect(() => { fetch(); }, [fetch]);

  const updatePhoto = useCallback(async (personId: string, photoUrl: string, personInfo?: { name?: string; personType?: PersonType; department?: string; relatedId?: string }) => {
    const res = await apiClient.post<AccessPerson>('/api/access/persons', {
      action: 'updatePhoto',
      personId,
      photoUrl,
      ...personInfo,
    });
    if (res.success) {
      await fetch();
    }
    return res;
  }, [fetch]);

  return { data, total, loading, refresh: fetch, updatePhoto };
}

// ==================== 申请管理 ====================

type ApplicationListResult = { items: AccessApplication[]; total: number };

export function useAccessApplications(params: {
  status?: ApplicationStatus;
  applicantType?: 'parent' | 'visitor';
  search?: string;
  page: number;
  pageSize: number;
}) {
  const [data, setData] = useState<AccessApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.set('status', params.status);
      if (params.applicantType) searchParams.set('applicantType', params.applicantType);
      if (params.search) searchParams.set('search', params.search);
      searchParams.set('page', String(params.page));
      searchParams.set('pageSize', String(params.pageSize));

      const res = await apiClient.get<ApplicationListResult>(`/api/access/applications?${searchParams}`);
      if (res.success && res.data) {
        setData(res.data.items || []);
        setTotal(res.data.total || 0);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [params.status, params.applicantType, params.search, params.page, params.pageSize]);

  useEffect(() => { fetch(); }, [fetch]);

  const approveApplication = useCallback(async (id: string) => {
    const res = await apiClient.put<AccessApplication>(`/api/access/applications/${id}`, { action: 'approve' });
    if (res.success) await fetch();
    return res;
  }, [fetch]);

  const rejectApplication = useCallback(async (id: string, reason: string) => {
    const res = await apiClient.put<AccessApplication>(`/api/access/applications/${id}`, { action: 'reject', reason });
    if (res.success) await fetch();
    return res;
  }, [fetch]);

  return { data, total, loading, refresh: fetch, approveApplication, rejectApplication };
}

// ==================== 通行记录 ====================

type RecordListResult = { items: AccessRecord[]; total: number };

export function useAccessRecords(params: {
  personType?: PersonType;
  direction?: 'in' | 'out';
  search?: string;
  page: number;
  pageSize: number;
}) {
  const [data, setData] = useState<AccessRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      if (params.personType) searchParams.set('personType', params.personType);
      if (params.direction) searchParams.set('direction', params.direction);
      if (params.search) searchParams.set('search', params.search);
      searchParams.set('page', String(params.page));
      searchParams.set('pageSize', String(params.pageSize));

      const res = await apiClient.get<RecordListResult>(`/api/access/records?${searchParams}`);
      if (res.success && res.data) {
        setData(res.data.items || []);
        setTotal(res.data.total || 0);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [params.personType, params.direction, params.search, params.page, params.pageSize]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, total, loading, refresh: fetch };
}
