/**
 * 安全管理 Hooks
 * 
 * 提供安全演练和安全检查的数据获取和操作方法
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/services/api-client';

// ==================== 类型定义 ====================

export type DrillType = 'fire' | 'earthquake' | 'anti_terror' | 'other';
export type InspectionType = 'daily' | 'fire' | 'gate' | 'facility' | 'other';
export type InspectionStatus = 'pending' | 'in_progress' | 'completed';

export interface SafetyDrill {
  id: string;
  type: string;
  title: string;
  drillDate: string;
  location: string;
  participants: number | null;
  duration: number | null;
  result: string | null;
  issues: string[];
  improvements: string[];
  organizer: string;
  createdAt: string;
}

export interface SafetyInspection {
  id: string;
  inspector: string;
  inspectionDate: string;
  area: string;
  type: string;
  status: string;
  issues: string[];
  resolved: boolean;
  resolvedAt: string | null;
  resolvedBy: string | null;
  notes: string | null;
  createdAt: string;
}

export interface SafetyStatistics {
  todayInspections: number;
  pendingHazards: number;
  resolvedThisMonth: number;
  safetyLevel: string;
  totalDrills: number;
  drillCounts: Record<string, number>;
}

export interface DrillFilters {
  type?: string;
  year?: string;
}

export interface InspectionFilters {
  status?: string;
  area?: string;
  type?: string;
  resolved?: boolean;
  page?: number;
  pageSize?: number;
}

// ==================== 演练相关 Hooks ====================

/**
 * 获取安全演练列表
 */
export function useDrills(filters?: DrillFilters) {
  const [data, setData] = useState<SafetyDrill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.set('type', filters.type);
      if (filters?.year) params.set('year', filters.year);
      
      const queryString = params.toString();
      const url = queryString ? `/api/safety/drills?${queryString}` : '/api/safety/drills';
      
      const response = await apiClient.get<SafetyDrill[]>(url);
      setData(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [filters?.type, filters?.year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * 获取演练详情
 */
export function useDrill(id: string) {
  const [data, setData] = useState<SafetyDrill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get<SafetyDrill>(`/api/safety/drills/${id}`);
        setData(response.data || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取数据失败');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  return { data, isLoading, error };
}

/**
 * 演练操作
 */
export function useDrillActions() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const create = useCallback(async (drillData: Partial<SafetyDrill>): Promise<SafetyDrill> => {
    setIsCreating(true);
    try {
      const response = await apiClient.post<SafetyDrill>('/api/safety/drills', drillData);
      return response.data!;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const update = useCallback(async (id: string, drillData: Partial<SafetyDrill>): Promise<SafetyDrill> => {
    setIsUpdating(true);
    try {
      const response = await apiClient.put<SafetyDrill>(`/api/safety/drills/${id}`, drillData);
      return response.data!;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const deleteDrill = useCallback(async (id: string): Promise<void> => {
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/safety/drills/${id}`);
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return {
    create,
    update,
    delete: deleteDrill,
    isCreating,
    isUpdating,
    isDeleting,
  };
}

// ==================== 检查相关 Hooks ====================

/**
 * 获取安全检查列表
 */
export function useInspections(filters?: InspectionFilters) {
  const [data, setData] = useState<{ data: SafetyInspection[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.area) params.set('area', filters.area);
      if (filters?.type) params.set('type', filters.type);
      if (filters?.resolved !== undefined) params.set('resolved', String(filters.resolved));
      if (filters?.page) params.set('page', String(filters.page));
      if (filters?.pageSize) params.set('pageSize', String(filters.pageSize));
      
      const queryString = params.toString();
      const url = queryString ? `/api/safety/inspections?${queryString}` : '/api/safety/inspections';
      
      const response = await apiClient.get<{ data: SafetyInspection[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } }>(url);
      setData(response.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [filters?.status, filters?.area, filters?.type, filters?.resolved, filters?.page, filters?.pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * 获取检查详情
 */
export function useInspection(id: string) {
  const [data, setData] = useState<SafetyInspection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get<SafetyInspection>(`/api/safety/inspections/${id}`);
        setData(response.data || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取数据失败');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  return { data, isLoading, error };
}

/**
 * 检查操作
 */
export function useInspectionActions() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const create = useCallback(async (inspectionData: Partial<SafetyInspection>): Promise<SafetyInspection> => {
    setIsCreating(true);
    try {
      const response = await apiClient.post<SafetyInspection>('/api/safety/inspections', inspectionData);
      return response.data!;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const update = useCallback(async (id: string, inspectionData: Partial<SafetyInspection>): Promise<SafetyInspection> => {
    setIsUpdating(true);
    try {
      const response = await apiClient.put<SafetyInspection>(`/api/safety/inspections/${id}`, inspectionData);
      return response.data!;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const resolve = useCallback(async (id: string, resolvedBy: string): Promise<SafetyInspection> => {
    setIsResolving(true);
    try {
      const response = await apiClient.post<SafetyInspection>(`/api/safety/inspections/${id}/resolve`, { resolvedBy });
      return response.data!;
    } finally {
      setIsResolving(false);
    }
  }, []);

  const deleteInspection = useCallback(async (id: string): Promise<void> => {
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/safety/inspections/${id}`);
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return {
    create,
    update,
    resolve,
    delete: deleteInspection,
    isCreating,
    isUpdating,
    isResolving,
    isDeleting,
  };
}

// ==================== 统计相关 Hooks ====================

/**
 * 获取安全统计数据
 */
export function useSafetyStatistics(year?: string) {
  const [data, setData] = useState<SafetyStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = year ? `?year=${year}` : '';
        const response = await apiClient.get<SafetyStatistics>(`/api/safety/stats${params}`);
        setData(response.data || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取数据失败');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [year]);

  return { data, isLoading, error };
}
