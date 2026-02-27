import { useDataFetch, useSingleDataFetch, useDataMutation } from './useDataFetch';

// 财务记录相关类型
export interface FinancialRecord {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  transactionDate: string;
  payer: string;
  payee: string;
  invoiceNumber: string;
  status: string;
  approvedBy: string;
  createdAt: string;
}

// 安全检查记录相关类型
export interface SafetyInspection {
  id: string;
  type: string;
  location: string;
  inspector: string;
  inspectionDate: string;
  issues: any[];
  status: string;
  resolvedAt: string;
  notes: string;
  createdAt: string;
}

// 安全演练相关类型
export interface SafetyDrill {
  id: string;
  type: string;
  title: string;
  drillDate: string;
  location: string;
  participants: number;
  duration: number;
  result: string;
  issues: string[];
  improvements: string[];
  organizer: string;
  createdAt: string;
}

// 资产相关类型
export interface Asset {
  id: string;
  name: string;
  assetNumber: string;
  category: string;
  brand: string;
  model: string;
  purchaseDate: string;
  purchasePrice: number;
  location: string;
  manager: string;
  status: string;
  lastMaintenance: string;
  nextMaintenance: string;
  createdAt: string;
}

// 空间预约相关类型
export interface SpaceReservation {
  id: string;
  spaceId: string;
  spaceName: string;
  applicantId: string;
  applicantName: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  purpose: string;
  participants: number;
  status: string;
  approvedBy: string;
  createdAt: string;
}

/**
 * 财务记录数据Hook
 */
export function useFinancialRecords(type?: string, category?: string, year?: string, month?: string) {
  const params: Record<string, string> = {};
  if (type) params.type = type;
  if (category) params.category = category;
  if (year) params.year = year;
  if (month) params.month = month;
  return useDataFetch<FinancialRecord>('/api/finance/records', params);
}

/**
 * 安全检查记录Hook
 */
export function useSafetyInspections(type?: string, status?: string, location?: string) {
  const params: Record<string, string> = {};
  if (type) params.type = type;
  if (status) params.status = status;
  if (location) params.location = location;
  return useDataFetch<SafetyInspection>('/api/safety/inspections', params);
}

/**
 * 安全演练Hook
 */
export function useSafetyDrills(type?: string, year?: string) {
  const params: Record<string, string> = {};
  if (type) params.type = type;
  if (year) params.year = year;
  return useDataFetch<SafetyDrill>('/api/safety/drills', params);
}

/**
 * 资产数据Hook
 */
export function useAssets(category?: string, status?: string, location?: string) {
  const params: Record<string, string> = {};
  if (category) params.category = category;
  if (status) params.status = status;
  if (location) params.location = location;
  return useDataFetch<Asset>('/api/assets', params);
}

/**
 * 空间预约Hook
 */
export function useSpaceReservations(spaceId?: string, applicantId?: string, date?: string, status?: string) {
  const params: Record<string, string> = {};
  if (spaceId) params.spaceId = spaceId;
  if (applicantId) params.applicantId = applicantId;
  if (date) params.date = date;
  if (status) params.status = status;
  return useDataFetch<SpaceReservation>('/api/spaces/reservations', params);
}

/**
 * 财务记录操作Hook
 */
export function useFinancialMutation() {
  return useDataMutation<Partial<FinancialRecord>, FinancialRecord>();
}

/**
 * 安全检查操作Hook
 */
export function useSafetyInspectionMutation() {
  return useDataMutation<Partial<SafetyInspection>, SafetyInspection>();
}

/**
 * 资产操作Hook
 */
export function useAssetMutation() {
  return useDataMutation<Partial<Asset>, Asset>();
}

/**
 * 空间预约操作Hook
 */
export function useSpaceReservationMutation() {
  return useDataMutation<Partial<SpaceReservation>, SpaceReservation>();
}
