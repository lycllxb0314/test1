/**
 * 总务管理数据获取Hooks
 * 
 * 使用统一的基础Hook库（useApi.ts）实现
 * 
 * @module hooks/useGeneralAffairsData
 */

import { useQuery, usePaginatedQuery, useMutation, type QueryParams } from './useApi';
import { apiClient } from '@/services/api-client';

// ============================================
// 类型定义
// ============================================

/** 资产类型 */
export type AssetCategory = 'equipment' | 'furniture' | 'vehicle' | 'book' | 'other';

/** 资产状态 */
export type AssetStatus = 'in_use' | 'idle' | 'maintenance' | 'scrap' | 'lost';

/** 资产信息 */
export interface Asset {
  id: string;
  assetNo: string;
  name: string;
  category: AssetCategory;
  brand?: string;
  model?: string;
  specification?: string;
  purchaseDate: string;
  purchasePrice: number;
  warrantyExpiry?: string;
  location: string;
  department?: string;
  custodianId?: string;
  custodianName?: string;
  status: AssetStatus;
  qrCode?: string;
  images: string[];
  documents: string[];
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

/** 维修状态 */
export type RepairStatus = 'pending' | 'approved' | 'repairing' | 'completed' | 'rejected';

/** 维修申请 */
export interface RepairRequest {
  id: string;
  assetId?: string;
  assetName?: string;
  assetNo?: string;
  faultType: string;
  faultDescription: string;
  faultImages: string[];
  location: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  requesterId: string;
  requesterName: string;
  requesterPhone?: string;
  status: RepairStatus;
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  repairmanId?: string;
  repairmanName?: string;
  repairCost?: number;
  repairDate?: string;
  repairDescription?: string;
  completedAt?: string;
  feedback?: string;
  satisfaction?: number;
  createdAt: string;
}

/** 报修类型 */
export type ReportType = 'facility' | 'electricity' | 'water' | 'network' | 'furniture' | 'other';

/** 报修状态 */
export type ReportStatus = 'pending' | 'processing' | 'completed' | 'closed';

/** 报修工单 */
export interface WorkOrder {
  id: string;
  orderNo: string;
  type: ReportType;
  location: string;
  description: string;
  images: string[];
  reporterId: string;
  reporterName: string;
  reporterPhone?: string;
  status: ReportStatus;
  handlerId?: string;
  handlerName?: string;
  handleTime?: string;
  handleDescription?: string;
  handleImages: string[];
  feedback?: string;
  satisfaction?: number;
  createdAt: string;
  updatedAt: string;
}

/** 物品类型 */
export type SupplyCategory = 'stationery' | 'cleaning' | 'sports' | 'electronic' | 'other';

/** 采购状态 */
export type ProcurementStatus = 'draft' | 'submitted' | 'approved' | 'purchasing' | 'completed' | 'cancelled';

/** 物品采购申请 */
export interface SupplyProcurement {
  id: string;
  procNo: string;
  title: string;
  category: SupplyCategory;
  items: {
    name: string;
    specification?: string;
    unit: string;
    quantity: number;
    unitPrice?: number;
    totalPrice?: number;
    remark?: string;
  }[];
  totalAmount?: number;
  reason: string;
  requesterId: string;
  requesterName: string;
  department: string;
  status: ProcurementStatus;
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  purchaseDate?: string;
  supplier?: string;
  invoiceNo?: string;
  invoiceImages: string[];
  receiverId?: string;
  receiverName?: string;
  receivedAt?: string;
  remark?: string;
  createdAt: string;
}

/** 场地类型 */
export type VenueType = 'classroom' | 'meeting_room' | 'sports_field' | 'auditorium' | 'lab' | 'other';

/** 场地状态 */
export type VenueStatus = 'available' | 'occupied' | 'maintenance' | 'reserved';

/** 场地信息 */
export interface Venue {
  id: string;
  name: string;
  code: string;
  type: VenueType;
  building: string;
  floor: number;
  capacity: number;
  facilities: string[];
  status: VenueStatus;
  managerId?: string;
  managerName?: string;
  images: string[];
  description?: string;
  createdAt: string;
}

/** 场地预约 */
export interface VenueReservation {
  id: string;
  venueId: string;
  venueName: string;
  venueType: VenueType;
  reserverId: string;
  reserverName: string;
  reserverPhone?: string;
  purpose: string;
  participants: number;
  startTime: string;
  endTime: string;
  status: 'pending' | 'approved' | 'rejected' | 'using' | 'completed' | 'cancelled';
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  rejectReason?: string;
  remark?: string;
  createdAt: string;
}

// ============================================
// 资产管理Hooks
// ============================================

/**
 * 获取资产列表
 */
export function useAssets(filters?: {
  category?: AssetCategory;
  status?: AssetStatus;
  department?: string;
  keyword?: string;
}) {
  const params: QueryParams = {};
  if (filters?.category) params.category = filters.category;
  if (filters?.status) params.status = filters.status;
  if (filters?.department) params.department = filters.department;
  if (filters?.keyword) params.keyword = filters.keyword;
  
  return useQuery<Asset[]>(
    () => apiClient.get('/general/assets', params),
    { deps: [params] }
  );
}

/**
 * 获取资产详情
 */
export function useAssetDetail(assetId: string | null) {
  return useQuery<Asset | null>(
    () => assetId ? apiClient.get(`/general/assets/${assetId}`) : Promise.resolve({ success: true, data: null }),
    { deps: [assetId], enabled: !!assetId }
  );
}

/**
 * 添加资产
 */
export function useAddAsset() {
  return useMutation<Asset, Partial<Asset>>(
    (data) => apiClient.post('/general/assets', data)
  );
}

/**
 * 更新资产
 */
export function useUpdateAsset() {
  return useMutation<Asset, { id: string; data: Partial<Asset> }>(
    ({ id, data }) => apiClient.put(`/general/assets/${id}`, data)
  );
}

// ============================================
// 维修管理Hooks
// ============================================

/**
 * 获取维修申请列表
 */
export function useRepairRequests(filters?: {
  status?: RepairStatus;
  urgency?: 'low' | 'medium' | 'high' | 'urgent';
}) {
  const params: QueryParams = {};
  if (filters?.status) params.status = filters.status;
  if (filters?.urgency) params.urgency = filters.urgency;
  
  return useQuery<RepairRequest[]>(
    () => apiClient.get('/general/repairs', params),
    { deps: [params] }
  );
}

/**
 * 创建维修申请
 */
export function useCreateRepairRequest() {
  return useMutation<RepairRequest, Partial<RepairRequest>>(
    (data) => apiClient.post('/general/repairs', data)
  );
}

/**
 * 更新维修状态
 */
export function useUpdateRepairStatus() {
  return useMutation<RepairRequest, { id: string; status: RepairStatus; data?: Partial<RepairRequest> }>(
    ({ id, status, data }) => apiClient.patch(`/general/repairs/${id}`, { status, ...data })
  );
}

// ============================================
// 报修工单Hooks
// ============================================

/**
 * 获取报修工单列表（分页）
 */
export function useWorkOrdersList(params: {
  page?: number;
  pageSize?: number;
  type?: ReportType;
  status?: ReportStatus;
} = {}) {
  const queryParams: QueryParams = {
    page: params.page || 1,
    pageSize: params.pageSize || 20,
  };
  if (params.type) queryParams.type = params.type;
  if (params.status) queryParams.status = params.status;
  
  return usePaginatedQuery<WorkOrder>(
    (p) => apiClient.get('/general/work-orders', { ...queryParams, ...p }),
    queryParams
  );
}

/**
 * 创建报修工单
 */
export function useCreateWorkOrder() {
  return useMutation<WorkOrder, Partial<WorkOrder>>(
    (data) => apiClient.post('/general/work-orders', data)
  );
}

// ============================================
// 物品采购Hooks
// ============================================

/**
 * 获取采购申请列表
 */
export function useSupplyProcurements(filters?: {
  status?: ProcurementStatus;
  category?: SupplyCategory;
  requesterId?: string;
}) {
  const params: QueryParams = {};
  if (filters?.status) params.status = filters.status;
  if (filters?.category) params.category = filters.category;
  if (filters?.requesterId) params.requesterId = filters.requesterId;
  
  return useQuery<SupplyProcurement[]>(
    () => apiClient.get('/general/procurements', params),
    { deps: [params] }
  );
}

/**
 * 创建采购申请
 */
export function useCreateProcurement() {
  return useMutation<SupplyProcurement, Partial<SupplyProcurement>>(
    (data) => apiClient.post('/general/procurements', data)
  );
}

// ============================================
// 场地管理Hooks
// ============================================

/**
 * 获取场地列表
 */
export function useVenues(filters?: {
  type?: VenueType;
  status?: VenueStatus;
  building?: string;
}) {
  const params: QueryParams = {};
  if (filters?.type) params.type = filters.type;
  if (filters?.status) params.status = filters.status;
  if (filters?.building) params.building = filters.building;
  
  return useQuery<Venue[]>(
    () => apiClient.get('/general/venues', params),
    { deps: [params] }
  );
}

/**
 * 获取场地预约列表
 */
export function useVenueReservations(filters?: {
  venueId?: string;
  reserverId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  const params: QueryParams = {};
  if (filters?.venueId) params.venueId = filters.venueId;
  if (filters?.reserverId) params.reserverId = filters.reserverId;
  if (filters?.status) params.status = filters.status;
  if (filters?.startDate) params.startDate = filters.startDate;
  if (filters?.endDate) params.endDate = filters.endDate;
  
  return useQuery<VenueReservation[]>(
    () => apiClient.get('/general/venues/reservations', params),
    { deps: [params] }
  );
}

/**
 * 创建场地预约
 */
export function useCreateVenueReservation() {
  return useMutation<VenueReservation, Partial<VenueReservation>>(
    (data) => apiClient.post('/general/venues/reservations', data)
  );
}

// ============================================
// 统计Hooks
// ============================================

/**
 * 获取总务统计概览
 */
export function useGeneralAffairsStats() {
  return useQuery<{
    assets: {
      total: number;
      inUse: number;
      idle: number;
      maintenance: number;
      totalValue: number;
    };
    repairs: {
      pending: number;
      processing: number;
      completed: number;
      thisMonth: number;
    };
    procurements: {
      pending: number;
      approved: number;
      completed: number;
      totalAmount: number;
    };
    venues: {
      total: number;
      available: number;
      reserved: number;
    };
  }>(
    () => apiClient.get('/general/stats'),
    { deps: [] }
  );
}

// ============================================
// 导出
// ============================================

// 从useApi重新导出兼容的hooks
export { useClasses } from './useApi';
