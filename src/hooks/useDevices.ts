/**
 * 设备管理 Hooks
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/services/api-client';
import type { Device, DeviceStatistics, DeviceType, DeviceStatus, DeviceFilters } from '@/types/general';

// ==================== 设备列表 ====================

export function useDevices(filters?: DeviceFilters) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.type && filters.type !== 'all') params.set('type', filters.type);
      if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters?.building && filters.building !== 'all') params.set('building', filters.building);
      if (filters?.floor !== undefined && filters.floor !== 'all') params.set('floor', String(filters.floor));
      if (filters?.search) params.set('search', filters.search);

      const res = await apiClient.get<Device[]>(`/api/general/devices?${params.toString()}`);
      if (res.success && res.data) {
        setDevices(res.data);
      } else {
        setError(res.message || '获取设备列表失败');
      }
    } catch (err) {
      setError('获取设备列表失败');
      console.error('[useDevices] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters?.type, filters?.status, filters?.building, filters?.floor, filters?.search]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return { devices, loading, error, refresh: fetchDevices };
}

// ==================== 设备统计 ====================

export function useDeviceStatistics() {
  const [statistics, setStatistics] = useState<DeviceStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.get<DeviceStatistics>('/api/general/devices/stats');
      if (res.success && res.data) {
        setStatistics(res.data);
      } else {
        setError(res.message || '获取统计数据失败');
      }
    } catch (err) {
      setError('获取统计数据失败');
      console.error('[useDeviceStatistics] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return { statistics, loading, error, refresh: fetchStatistics };
}

// ==================== 楼宇列表 ====================

export function useDeviceBuildings() {
  const [buildings, setBuildings] = useState<{ id: string; name: string; floors: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const res = await apiClient.get<{ id: string; name: string; floors: number }[]>('/api/general/devices/buildings');
        if (res.success && res.data) {
          setBuildings(res.data);
        }
      } catch (err) {
        console.error('[useDeviceBuildings] fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBuildings();
  }, []);

  return { buildings, loading };
}

// ==================== 设备操作 ====================

export function useDeviceActions() {
  const [loading, setLoading] = useState(false);

  // 创建设备
  const createDevice = useCallback(async (device: Partial<Device>): Promise<Device | null> => {
    setLoading(true);
    try {
      const res = await apiClient.post<Device>('/api/general/devices', device);
      if (res.success && res.data) {
        return res.data;
      }
      console.error('[createDevice] error:', res.message);
      return null;
    } catch (err) {
      console.error('[createDevice] error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新设备
  const updateDevice = useCallback(async (id: string, updates: Partial<Device>): Promise<Device | null> => {
    setLoading(true);
    try {
      const res = await apiClient.put<Device>(`/api/general/devices/${id}`, updates);
      if (res.success && res.data) {
        return res.data;
      }
      console.error('[updateDevice] error:', res.message);
      return null;
    } catch (err) {
      console.error('[updateDevice] error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 删除设备
  const deleteDevice = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await apiClient.delete(`/api/general/devices/${id}`);
      return res.success;
    } catch (err) {
      console.error('[deleteDevice] error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 开关控制
  const toggleDevice = useCallback(async (deviceId: string, isOn: boolean): Promise<Device | null> => {
    setLoading(true);
    try {
      const res = await apiClient.post<Device>('/api/general/devices/control', {
        action: 'toggle',
        deviceId,
        params: { isOn },
      });
      if (res.success && res.data) {
        return res.data;
      }
      return null;
    } catch (err) {
      console.error('[toggleDevice] error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 参数调节
  const adjustDevice = useCallback(async (
    deviceId: string,
    params: { brightness?: number; temperature?: number; position?: number; locked?: boolean }
  ): Promise<Device | null> => {
    setLoading(true);
    try {
      const res = await apiClient.post<Device>('/api/general/devices/control', {
        action: 'adjust',
        deviceId,
        params,
      });
      if (res.success && res.data) {
        return res.data;
      }
      return null;
    } catch (err) {
      console.error('[adjustDevice] error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 批量控制
  const batchControl = useCallback(async (type: DeviceType, action: 'on' | 'off'): Promise<number> => {
    setLoading(true);
    try {
      const res = await apiClient.post<{ count: number }>('/api/general/devices/control', {
        action: 'batch',
        type,
        params: { action },
      });
      if (res.success && res.data) {
        return res.data.count;
      }
      return 0;
    } catch (err) {
      console.error('[batchControl] error:', err);
      return 0;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    createDevice,
    updateDevice,
    deleteDevice,
    toggleDevice,
    adjustDevice,
    batchControl,
  };
}
