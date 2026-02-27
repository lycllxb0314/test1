import { useState, useEffect, useCallback } from 'react';

/**
 * 门禁管理数据获取 Hook
 */

// 设备状态
export type DeviceStatus = 'online' | 'offline' | 'fault';
export type DeviceType = 'gate' | 'building' | 'other';

// 门禁设备
export interface AccessDevice {
  id: string;
  name: string;
  code: string;
  type: DeviceType;
  status: DeviceStatus;
  location: string;
  ipAddress?: string;
  lastOnlineAt?: string;
  todayCount: number;
  createdAt: string;
}

// 人员类型
export type PersonType = 'student' | 'teacher' | 'staff' | 'visitor';

// 通行记录
export interface AccessRecord {
  id: string;
  personId?: string;
  personName: string;
  personType: PersonType;
  organization: string;
  deviceId: string;
  deviceName: string;
  deviceLocation: string;
  direction: 'in' | 'out';
  status: 'success' | 'denied';
  temperature?: number;
  occurredAt: string;
}

// 访客状态
export type VisitorStatus = 'pending' | 'approved' | 'rejected' | 'visiting' | 'left';

// 访客
export interface Visitor {
  id: string;
  name: string;
  phone: string;
  idCard?: string;
  purpose: string;
  hostId?: string;
  hostName: string;
  hostDepartment?: string;
  expectedArrivalTime: string;
  actualArrivalTime?: string;
  actualLeaveTime?: string;
  status: VisitorStatus;
  temperature?: number;
  remark?: string;
  createdAt: string;
}

// 门禁统计
export interface AccessStatistics {
  date: string;
  todayTotal: number;
  todayIn: number;
  todayOut: number;
  byPersonType: Array<{ type: PersonType; count: number }>;
  abnormalCount: number;
  visitorCount: number;
  pendingVisitorCount: number;
  deviceOnlineCount: number;
  deviceOfflineCount: number;
  deviceFaultCount: number;
}

/**
 * 获取门禁统计数据
 */
export function useAccessStatistics(date?: string) {
  const [data, setData] = useState<AccessStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      
      const response = await fetch(`/api/access/statistics?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || '获取数据失败');
      }
    } catch (err) {
      console.error('Failed to fetch access statistics:', err);
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 获取门禁设备列表
 */
export function useAccessDevices(filters?: {
  status?: DeviceStatus;
  type?: DeviceType;
}) {
  const [data, setData] = useState<AccessDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.type) params.append('type', filters.type);
      
      const response = await fetch(`/api/access/devices?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || '获取数据失败');
        setData([]);
      }
    } catch (err) {
      console.error('Failed to fetch access devices:', err);
      setError('网络错误');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.type]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 获取通行记录
 */
export function useAccessRecords(filters?: {
  deviceId?: string;
  personType?: PersonType;
  direction?: 'in' | 'out';
  date?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const [data, setData] = useState<AccessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.deviceId) params.append('deviceId', filters.deviceId);
      if (filters?.personType) params.append('personType', filters.personType);
      if (filters?.direction) params.append('direction', filters.direction);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const response = await fetch(`/api/access/records?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || '获取数据失败');
        setData([]);
      }
    } catch (err) {
      console.error('Failed to fetch access records:', err);
      setError('网络错误');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.deviceId, filters?.personType, filters?.direction, filters?.date, filters?.startDate, filters?.endDate, filters?.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 获取访客列表
 */
export function useVisitors(filters?: {
  status?: VisitorStatus;
  startDate?: string;
  endDate?: string;
}) {
  const [data, setData] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      
      const response = await fetch(`/api/access/visitors?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || '获取数据失败');
        setData([]);
      }
    } catch (err) {
      console.error('Failed to fetch visitors:', err);
      setError('网络错误');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.startDate, filters?.endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 创建访客预约
 */
export async function createVisitor(visitor: {
  name: string;
  phone: string;
  idCard?: string;
  purpose: string;
  hostId?: string;
  hostName: string;
  hostDepartment?: string;
  expectedArrivalTime: string;
  remark?: string;
}) {
  const response = await fetch('/api/access/visitors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(visitor),
  });
  return response.json();
}

/**
 * 审批访客
 */
export async function approveVisitor(
  id: string,
  action: 'approve' | 'reject',
  approverId: string,
  approverName: string
) {
  const response = await fetch('/api/access/visitors', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, action, approverId, approverName }),
  });
  return response.json();
}

/**
 * 访客签到/签退
 */
export async function visitorCheckInOut(
  id: string,
  action: 'checkin' | 'checkout',
  temperature?: number
) {
  const response = await fetch('/api/access/visitors', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, action, temperature }),
  });
  return response.json();
}
