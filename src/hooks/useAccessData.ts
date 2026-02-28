/**
 * 门禁管理数据获取Hooks
 * 
 * 使用统一的基础Hook库（useApi.ts）实现
 * 
 * @module hooks/useAccessData
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, usePaginatedQuery, useMutation, type QueryParams } from './useApi';
import { apiClient } from '@/services/api-client';

// ============================================
// 类型定义
// ============================================

/** 人员类型 */
export type PersonType = 'teacher' | 'student' | 'parent' | 'visitor' | 'staff';

/** 门禁设备类型 */
export type DeviceType = 'face' | 'card' | 'qr' | 'fingerprint' | 'turnstile';

/** 设备状态 */
export type DeviceStatus = 'online' | 'offline' | 'maintenance' | 'error';

/** 门禁设备 */
export interface AccessDevice {
  id: string;
  name: string;
  code: string;
  location: string;
  building?: string;
  floor?: number;
  type: DeviceType;
  status: DeviceStatus;
  ipAddress?: string;
  lastOnlineAt?: string;
  description?: string;
  createdAt: string;
}

/** 出入类型 */
export type AccessType = 'entry' | 'exit';

/** 门禁记录 */
export interface AccessRecord {
  id: string;
  personId: string;
  personName: string;
  personType: PersonType;
  personGrade?: number;
  personClassName?: string;
  deviceId: string;
  deviceName: string;
  deviceLocation: string;
  type: AccessType;
  temperature?: number;
  photoUrl?: string;
  method: string;
  timestamp: string;
  remark?: string;
}

/** 访客类型 */
export type VisitorStatus = 'pending' | 'approved' | 'rejected' | 'visited' | 'cancelled';

/** 访客预约 */
export interface VisitorAppointment {
  id: string;
  visitorName: string;
  visitorPhone: string;
  visitorIdCard?: string;
  visitorCompany?: string;
  visiteeId: string;
  visiteeName: string;
  visiteeDepartment?: string;
  reason: string;
  appointmentDate: string;
  appointmentTime: string;
  expectedDuration: number;
  status: VisitorStatus;
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  qrCode?: string;
  actualEntryTime?: string;
  actualExitTime?: string;
  createdAt: string;
}

/** 通行规则 */
export interface AccessRule {
  id: string;
  name: string;
  description?: string;
  targetType: 'teacher' | 'student' | 'staff' | 'all';
  targetIds?: string[];
  allowedTimes: {
    dayOfWeek: number[];
    startTime: string;
    endTime: string;
  }[];
  deviceIds: string[];
  isActive: boolean;
  createdAt: string;
}

// ============================================
// 门禁设备Hooks
// ============================================

/**
 * 获取门禁设备列表
 */
export function useAccessDevices(filters?: {
  type?: DeviceType;
  status?: DeviceStatus;
  location?: string;
}) {
  const params: QueryParams = {};
  if (filters?.type) params.type = filters.type;
  if (filters?.status) params.status = filters.status;
  if (filters?.location) params.location = filters.location;
  
  return useQuery<AccessDevice[]>(
    () => apiClient.get('/access/devices', params),
    { deps: [params] }
  );
}

/**
 * 获取设备详情
 */
export function useAccessDevice(deviceId: string | null) {
  return useQuery<AccessDevice | null>(
    () => deviceId ? apiClient.get(`/access/devices/${deviceId}`) : Promise.resolve({ success: true, data: null }),
    { deps: [deviceId], enabled: !!deviceId }
  );
}

// ============================================
// 门禁记录Hooks
// ============================================

/**
 * 获取门禁记录（分页）
 */
export function useAccessRecordsList(params: {
  page?: number;
  pageSize?: number;
  deviceId?: string;
  personType?: PersonType;
  type?: AccessType;
  startDate?: string;
  endDate?: string;
} = {}) {
  const queryParams: QueryParams = {
    page: params.page || 1,
    pageSize: params.pageSize || 20,
  };
  if (params.deviceId) queryParams.deviceId = params.deviceId;
  if (params.personType) queryParams.personType = params.personType;
  if (params.type) queryParams.type = params.type;
  if (params.startDate) queryParams.startDate = params.startDate;
  if (params.endDate) queryParams.endDate = params.endDate;
  
  return usePaginatedQuery<AccessRecord>(
    (p) => apiClient.get('/access/records', { ...queryParams, ...p }),
    queryParams
  );
}

/**
 * 获取学生出入记录
 */
export function useStudentAccessRecords(studentId: string | null) {
  return useQuery<AccessRecord[]>(
    () => studentId ? apiClient.get(`/access/records/student/${studentId}`) : Promise.resolve({ success: true, data: [] }),
    { deps: [studentId], enabled: !!studentId }
  );
}

/**
 * 获取今日门禁统计
 */
export function useTodayAccessStats() {
  return useQuery<{
    totalEntries: number;
    totalExits: number;
    studentsIn: number;
    studentsOut: number;
    visitors: number;
    abnormalTemperatures: number;
  }>(
    () => apiClient.get('/access/stats/today'),
    { deps: [] }
  );
}

// ============================================
// 访客预约Hooks
// ============================================

/**
 * 获取访客预约列表
 */
export function useVisitorAppointments(filters?: {
  status?: VisitorStatus;
  visiteeId?: string;
  date?: string;
}) {
  const params: QueryParams = {};
  if (filters?.status) params.status = filters.status;
  if (filters?.visiteeId) params.visiteeId = filters.visiteeId;
  if (filters?.date) params.date = filters.date;
  
  return useQuery<VisitorAppointment[]>(
    () => apiClient.get('/access/visitors', params),
    { deps: [params] }
  );
}

/**
 * 创建访客预约
 */
export function useCreateVisitorAppointment() {
  return useMutation<VisitorAppointment, Partial<VisitorAppointment>>(
    (data) => apiClient.post('/access/visitors', data)
  );
}

/**
 * 更新访客预约状态
 */
export function useUpdateVisitorStatus() {
  return useMutation<VisitorAppointment, { id: string; status: VisitorStatus }>(
    ({ id, status }) => apiClient.patch(`/access/visitors/${id}`, { status })
  );
}

// ============================================
// 通行规则Hooks
// ============================================

/**
 * 获取通行规则列表
 */
export function useAccessRules() {
  return useQuery<AccessRule[]>(
    () => apiClient.get('/access/rules'),
    { deps: [] }
  );
}

/**
 * 创建/更新通行规则
 */
export function useSaveAccessRule() {
  return useMutation<AccessRule, Partial<AccessRule>>(
    (data) => apiClient.post('/access/rules', data)
  );
}

// ============================================
// 导出
// ============================================

// 从useApi重新导出兼容的hooks
export { useAccessRecords } from './useApi';
