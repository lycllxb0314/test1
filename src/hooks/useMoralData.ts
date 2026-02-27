import { useState, useEffect, useCallback } from 'react';

/**
 * 德育管理数据获取 Hook
 */

// 活动类型
export type ActivityType = 'theme' | 'volunteer' | 'competition' | 'ceremony' | 'other';
export type ActivityStatus = 'planned' | 'ongoing' | 'completed' | 'cancelled';

// 德育活动
export interface MoralActivity {
  id: string;
  title: string;
  type: ActivityType;
  date: string;
  location: string;
  participants: string[];
  participantCount: number;
  organizer: string;
  status: ActivityStatus;
  description?: string;
  images: string[];
  createdAt: string;
}

// 预警类型
export type AlertType = 'behavior' | 'attendance' | 'safety' | 'psychology' | 'other';
export type AlertLevel = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'pending' | 'handling' | 'handled' | 'closed';

// 德育预警
export interface MoralAlert {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber?: string;
  grade: number;
  className: string;
  type: AlertType;
  level: AlertLevel;
  description: string;
  status: AlertStatus;
  handlerId?: string;
  handlerName?: string;
  handledAt?: string;
  handlingResult?: string;
  createdAt: string;
}

// 成长档案
export interface GrowthRecord {
  id: string;
  studentId: string;
  studentName: string;
  grade: number;
  className: string;
  type: string;
  title: string;
  content: string;
  date: string;
  images: string[];
  recorderId: string;
  recorderName: string;
  createdAt: string;
}

// 德育计划
export interface MoralPlan {
  id: string;
  title: string;
  type: string;
  semester: string;
  startDate: string;
  endDate: string;
  objectives: string[];
  activities: string[];
  status: 'draft' | 'active' | 'completed';
  createdAt: string;
}

/**
 * 获取德育活动列表
 */
export function useMoralActivities(filters?: {
  type?: ActivityType;
  status?: ActivityStatus;
  semester?: string;
}) {
  const [data, setData] = useState<MoralActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.semester) params.append('semester', filters.semester);
      
      const response = await fetch(`/api/moral/activities?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || '获取数据失败');
        setData([]);
      }
    } catch (err) {
      console.error('Failed to fetch moral activities:', err);
      setError('网络错误');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.type, filters?.status, filters?.semester]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 创建德育活动
 */
export async function createMoralActivity(activity: {
  title: string;
  type: ActivityType;
  date: string;
  location: string;
  participants?: string[];
  organizer: string;
  description?: string;
  images?: string[];
}) {
  const response = await fetch('/api/moral/activities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(activity),
  });
  return response.json();
}

/**
 * 获取德育预警列表
 */
export function useMoralAlerts(filters?: {
  type?: AlertType;
  level?: AlertLevel;
  status?: AlertStatus;
  grade?: number;
}) {
  const [data, setData] = useState<MoralAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.level) params.append('level', filters.level);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.grade) params.append('grade', filters.grade.toString());
      
      const response = await fetch(`/api/moral/alerts?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || '获取数据失败');
        setData([]);
      }
    } catch (err) {
      console.error('Failed to fetch moral alerts:', err);
      setError('网络错误');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.type, filters?.level, filters?.status, filters?.grade]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 创建德育预警
 */
export async function createMoralAlert(alert: {
  studentId: string;
  studentName: string;
  grade: number;
  className: string;
  type: AlertType;
  level: AlertLevel;
  description: string;
}) {
  const response = await fetch('/api/moral/alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alert),
  });
  return response.json();
}

/**
 * 处理德育预警
 */
export async function handleMoralAlert(
  id: string,
  handlerId: string,
  handlerName: string,
  handlingResult: string
) {
  const response = await fetch('/api/moral/alerts', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id,
      handlerId,
      handlerName,
      handlingResult,
      status: 'handled',
    }),
  });
  return response.json();
}
