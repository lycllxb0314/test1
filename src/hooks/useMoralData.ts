import { useDataFetch, useSingleDataFetch, useDataMutation } from './useDataFetch';
import { apiClient } from '@/services/api-client';

// 德育计划相关类型
export interface MoralPlan {
  id: string;
  title: string;
  type: string;
  semester: string;
  startDate: string;
  endDate: string;
  objectives: string[];
  activities: any[];
  status: string;
  createdAt: string;
}

// 德育活动相关类型
export interface MoralActivity {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  location: string;
  organizer: string;
  participants: number;
  status: string;
  description: string;
  images: string[];
  createdAt: string;
}

// 德育预警相关类型
export interface MoralAlert {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  handler: string;
  status: string;
  createdAt: string;
}

// 成长档案相关类型
export interface GrowthRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  type: string;
  title: string;
  content: string;
  images: string[];
  recordedBy: string;
  recordDate: string;
  createdAt: string;
}

/**
 * 德育计划数据Hook
 */
export function useMoralPlans(semester?: string, type?: string) {
  const params: Record<string, string> = {};
  if (semester) params.semester = semester;
  if (type) params.type = type;
  return useDataFetch<MoralPlan>('/api/moral/plans', params);
}

/**
 * 德育活动数据Hook
 */
export function useMoralActivities(type?: string, status?: string) {
  const params: Record<string, string> = {};
  if (type) params.type = type;
  if (status) params.status = status;
  return useDataFetch<MoralActivity>('/api/moral/activities', params);
}

/**
 * 德育预警数据Hook
 */
export function useMoralAlerts(severity?: string, status?: string) {
  const params: Record<string, string> = {};
  if (severity) params.severity = severity;
  if (status) params.status = status;
  return useDataFetch<MoralAlert>('/api/moral/alerts', params);
}

/**
 * 成长档案数据Hook
 */
export function useGrowthRecords(studentId?: string, type?: string) {
  const params: Record<string, string> = {};
  if (studentId) params.studentId = studentId;
  if (type) params.type = type;
  return useDataFetch<GrowthRecord>('/api/moral/growth', params);
}

/**
 * 德育计划操作Hook
 */
export function useMoralPlanMutation() {
  return useDataMutation<Partial<MoralPlan>, MoralPlan>();
}

/**
 * 德育活动操作Hook
 */
export function useMoralActivityMutation() {
  return useDataMutation<Partial<MoralActivity>, MoralActivity>();
}
