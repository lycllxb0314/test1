import { useState, useEffect, useCallback } from 'react';

/**
 * 总务管理数据获取 Hook
 */

// 维修类型
export type RepairType = 'electrical' | 'plumbing' | 'furniture' | 'equipment' | 'building' | 'network' | 'other';
export type RepairUrgency = 'urgent' | 'high' | 'normal' | 'low';
export type RepairStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'rejected';

// 维修申请
export interface RepairRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantDepartment: string;
  type: RepairType;
  location: string;
  description: string;
  images: string[];
  urgency: RepairUrgency;
  status: RepairStatus;
  assignedTo?: string;
  assignedName?: string;
  estimatedCost?: number;
  actualCost?: number;
  startedAt?: string;
  completedAt?: string;
  feedback?: string;
  rating?: number;
  createdAt: string;
}

// 资产类别
export type AssetCategory = 'equipment' | 'furniture' | 'electronic' | 'vehicle' | 'building' | 'other';
export type AssetStatus = 'in_use' | 'idle' | 'maintenance' | 'scrapped' | 'lost';

// 资产
export interface Asset {
  id: string;
  assetCode: string;
  name: string;
  category: AssetCategory;
  brand?: string;
  model?: string;
  specification?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  purchaseDate: string;
  warrantyExpiry?: string;
  department: string;
  location: string;
  responsiblePerson?: string;
  status: AssetStatus;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  notes?: string;
  images: string[];
  createdAt: string;
}

// 采购申请
export interface PurchaseRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  department: string;
  items: PurchaseItem[];
  totalAmount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'purchasing' | 'completed';
  urgency: 'urgent' | 'high' | 'normal';
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface PurchaseItem {
  name: string;
  specification?: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  subtotal: number;
}

// 供应商
export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  category: string;
  rating: number;
  notes?: string;
}

/**
 * 获取维修申请列表
 */
export function useRepairRequests(filters?: {
  applicantId?: string;
  status?: RepairStatus;
  type?: RepairType;
  urgency?: RepairUrgency;
}) {
  const [data, setData] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.applicantId) params.append('applicantId', filters.applicantId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.urgency) params.append('urgency', filters.urgency);
      
      const response = await fetch(`/api/repair-requests?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || '获取数据失败');
        setData([]);
      }
    } catch (err) {
      console.error('Failed to fetch repair requests:', err);
      setError('网络错误');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.applicantId, filters?.status, filters?.type, filters?.urgency]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 创建维修申请
 */
export async function createRepairRequest(request: {
  applicantId: string;
  applicantName: string;
  applicantDepartment: string;
  type: RepairType;
  location: string;
  description: string;
  images?: string[];
  urgency?: RepairUrgency;
}) {
  const response = await fetch('/api/repair-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return response.json();
}

/**
 * 更新维修申请状态
 */
export async function updateRepairRequest(id: string, updates: Partial<RepairRequest>) {
  const response = await fetch('/api/repair-requests', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
  });
  return response.json();
}

/**
 * 获取资产列表
 */
export function useAssets(filters?: {
  category?: AssetCategory;
  status?: AssetStatus;
  department?: string;
  location?: string;
}) {
  const [data, setData] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.department) params.append('department', filters.department);
      if (filters?.location) params.append('location', filters.location);
      
      const response = await fetch(`/api/assets?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || '获取数据失败');
        setData([]);
      }
    } catch (err) {
      console.error('Failed to fetch assets:', err);
      setError('网络错误');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.category, filters?.status, filters?.department, filters?.location]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 创建资产
 */
export async function createAsset(asset: {
  assetCode: string;
  name: string;
  category: AssetCategory;
  brand?: string;
  model?: string;
  specification?: string;
  quantity?: number;
  unit?: string;
  unitPrice: number;
  totalPrice?: number;
  purchaseDate: string;
  warrantyExpiry?: string;
  department: string;
  location: string;
  responsiblePerson?: string;
  notes?: string;
  images?: string[];
}) {
  const response = await fetch('/api/assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(asset),
  });
  return response.json();
}

/**
 * 更新资产信息
 */
export async function updateAsset(id: string, updates: Partial<Asset>) {
  const response = await fetch('/api/assets', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
  });
  return response.json();
}

/**
 * 删除资产
 */
export async function deleteAsset(id: string) {
  const response = await fetch(`/api/assets?id=${id}`, {
    method: 'DELETE',
  });
  return response.json();
}
