/**
 * 资产管理 Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/services/api-client';

// 资产类型
export type AssetRecord = {
  id: string;
  name: string;
  asset_no: string | null;
  assetNo?: string;
  category: string;
  brand: string | null;
  model: string | null;
  specification?: string | null;
  quantity?: number;
  unit?: string;
  purchase_price: number | null;
  purchasePrice?: number;
  value?: number;
  purchase_date: string | null;
  purchaseDate?: string;
  warranty_expiry: string | null;
  warrantyExpiry?: string;
  location: string | null;
  department?: string | null;
  manager: string | null;
  responsiblePerson?: string;
  status: string;
  last_maintenance: string | null;
  next_maintenance: string | null;
  created_at: string;
  updated_at?: string;
};

// 资产统计
export type AssetStatistics = {
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  totalAssets: number;
  totalQuantity: number;
  totalValue: number;
};

// 查询参数
export type AssetQueryParams = {
  category?: string;
  status?: string;
  location?: string;
  page?: number;
  pageSize?: number;
};

// 创建/更新参数
export type AssetFormData = {
  name: string;
  category: string;
  assetNo?: string;
  specification?: string;
  quantity?: number;
  unit?: string;
  purchase_price?: number;
  purchase_date?: string;
  warranty_expiry?: string;
  location?: string;
  department?: string;
  manager?: string;
  status?: string;
};

// 获取资产列表
export function useAssets(params: AssetQueryParams = {}) {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (params.category) query.set('category', params.category);
      if (params.status) query.set('status', params.status);
      if (params.location) query.set('location', params.location);
      
      const response = await apiClient.get<AssetRecord[]>(`/api/general/assets?${query.toString()}`);
      
      if (response.success && response.data) {
        setAssets(response.data);
      } else {
        setError(response.error || '获取资产列表失败');
      }
    } catch (err) {
      setError('获取资产列表失败');
      console.error('[useAssets] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [params.category, params.status, params.location]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return { assets, loading, error, refetch: fetchAssets };
}

// 获取资产统计
export function useAssetStats() {
  const [stats, setStats] = useState<AssetStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<AssetStatistics>('/api/general/assets/stats');
      
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error || '获取统计数据失败');
      }
    } catch (err) {
      setError('获取统计数据失败');
      console.error('[useAssetStats] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

// 资产操作
export function useAssetActions() {
  const [loading, setLoading] = useState(false);

  const createAsset = async (data: AssetFormData): Promise<{ success: boolean; data?: AssetRecord; error?: string }> => {
    setLoading(true);
    try {
      const response = await apiClient.post<AssetRecord>('/api/general/assets', data);
      return {
        success: response.success,
        data: response.data,
        error: response.error,
      };
    } catch (err) {
      return { success: false, error: '创建资产失败' };
    } finally {
      setLoading(false);
    }
  };

  const updateAsset = async (id: string, data: Partial<AssetFormData>): Promise<{ success: boolean; data?: AssetRecord; error?: string }> => {
    setLoading(true);
    try {
      const response = await apiClient.put<AssetRecord>(`/api/general/assets/${id}`, data);
      return {
        success: response.success,
        data: response.data,
        error: response.error,
      };
    } catch (err) {
      return { success: false, error: '更新资产失败' };
    } finally {
      setLoading(false);
    }
  };

  const deleteAsset = async (id: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const response = await apiClient.delete<{ id: string }>(`/api/general/assets/${id}`);
      return {
        success: response.success,
        error: response.error,
      };
    } catch (err) {
      return { success: false, error: '删除资产失败' };
    } finally {
      setLoading(false);
    }
  };

  return { createAsset, updateAsset, deleteAsset, loading };
}
