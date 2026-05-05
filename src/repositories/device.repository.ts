/**
 * 设备管理 Repository
 * 
 * 处理智能设备数据访问
 */

import { BaseRepository, PaginatedResult, QueryOptions } from './base.repository';
import type { Device, DeviceStatus, DeviceType, DeviceStatistics } from '@/types/general';

// ==================== 数据库行类型 ====================

export interface DeviceRecord {
  id: string;
  name: string;
  device_no: string | null;
  type: string;
  status: string;
  
  // 位置
  building: string;
  building_name: string | null;
  floor: number;
  room: string | null;
  location: string | null;
  
  // 设备属性
  brand: string | null;
  model: string | null;
  sn: string | null;
  
  // 控制状态
  is_on: boolean;
  brightness: number | null;
  temperature: number | null;
  locked: boolean | null;
  position: number | null;
  
  // 管理
  manager_id: string | null;
  manager_name: string | null;
  department: string | null;
  
  // 网络
  ip_address: string | null;
  mac_address: string | null;
  
  // 维护
  last_maintenance: string | null;
  next_maintenance: string | null;
  warranty_expiry: string | null;
  
  // 其他
  images: string[] | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== Repository ====================

export class DeviceRepository extends BaseRepository<DeviceRecord> {
  constructor() {
    super('devices');
  }

  /**
   * 获取设备列表
   */
  async findWithFilters(filters?: {
    type?: string;
    status?: string;
    building?: string;
    floor?: number;
    search?: string;
  }): Promise<DeviceRecord[]> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.building && filters.building !== 'all') {
      query = query.eq('building', filters.building);
    }
    if (filters?.floor !== undefined && filters?.floor !== null) {
      query = query.eq('floor', filters.floor);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,device_no.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[DeviceRepository] findWithFilters error:', error.message);
      return [];
    }
    return (data || []) as DeviceRecord[];
  }

  /**
   * 根据ID获取设备
   */
  async findById(id: string): Promise<DeviceRecord | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[DeviceRepository] findById error:', error.message);
      return null;
    }
    return data as DeviceRecord;
  }

  /**
   * 创建设备
   */
  async create(device: Partial<DeviceRecord>): Promise<DeviceRecord | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .insert(device)
      .select()
      .single();

    if (error) {
      console.error('[DeviceRepository] create error:', error.message);
      return null;
    }
    return data as DeviceRecord;
  }

  /**
   * 更新设备
   */
  async update(id: string, updates: Partial<DeviceRecord>): Promise<DeviceRecord | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[DeviceRepository] update error:', error.message);
      return null;
    }
    return data as DeviceRecord;
  }

  /**
   * 删除设备
   */
  async delete(id: string): Promise<boolean> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[DeviceRepository] delete error:', error.message);
      return false;
    }
    return true;
  }

  /**
   * 更新设备控制状态
   */
  async updateControlState(id: string, state: {
    is_on?: boolean;
    brightness?: number;
    temperature?: number;
    locked?: boolean;
    position?: number;
  }): Promise<boolean> {
    const { error } = await this.client
      .from(this.tableName)
      .update({ ...state, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[DeviceRepository] updateControlState error:', error.message);
      return false;
    }
    return true;
  }

  /**
   * 获取统计数据
   */
  async getStatistics(): Promise<DeviceStatistics> {
    // 获取所有设备
    const { data: devices, error } = await this.client
      .from(this.tableName)
      .select('*');

    if (error || !devices) {
      console.error('[DeviceRepository] getStatistics error:', error?.message);
      return {
        total: 0,
        online: 0,
        offline: 0,
        running: 0,
        maintenance: 0,
        fault: 0,
        byType: [],
        byBuilding: [],
      };
    }

    // 类型名称映射
    const typeNames: Record<string, string> = {
      light: '灯光',
      ac: '空调',
      door: '门禁',
      projector: '投影仪',
      curtain: '窗帘',
      speaker: '音响',
      camera: '摄像头',
      sensor: '传感器',
      other: '其他',
    };

    // 统计
    const total = devices.length;
    const online = devices.filter(d => d.status === 'online').length;
    const offline = devices.filter(d => d.status === 'offline').length;
    const maintenance = devices.filter(d => d.status === 'maintenance').length;
    const fault = devices.filter(d => d.status === 'fault').length;
    const running = devices.filter(d => d.is_on).length;

    // 按类型统计
    const typeMap = new Map<string, { count: number; online: number; running: number }>();
    devices.forEach(d => {
      const type = d.type;
      if (!typeMap.has(type)) {
        typeMap.set(type, { count: 0, online: 0, running: 0 });
      }
      const stats = typeMap.get(type)!;
      stats.count++;
      if (d.status === 'online') stats.online++;
      if (d.is_on) stats.running++;
    });

    const byType = Array.from(typeMap.entries()).map(([type, stats]) => ({
      type: type as DeviceType,
      typeName: typeNames[type] || type,
      ...stats,
    }));

    // 按楼宇统计
    const buildingMap = new Map<string, { buildingName: string; total: number; online: number }>();
    devices.forEach(d => {
      const building = d.building;
      if (!buildingMap.has(building)) {
        buildingMap.set(building, {
          buildingName: d.building_name || building,
          total: 0,
          online: 0,
        });
      }
      const stats = buildingMap.get(building)!;
      stats.total++;
      if (d.status === 'online') stats.online++;
    });

    const byBuilding = Array.from(buildingMap.entries()).map(([building, stats]) => ({
      building,
      ...stats,
    }));

    return {
      total,
      online,
      offline,
      running,
      maintenance,
      fault,
      byType,
      byBuilding,
    };
  }

  /**
   * 获取楼宇列表
   */
  async getBuildings(): Promise<{ id: string; name: string; floors: number }[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('building, building_name, floor')
      .order('building');

    if (error || !data) {
      return [];
    }

    // 按楼宇分组，获取最大楼层数
    const buildingMap = new Map<string, { name: string; maxFloor: number }>();
    data.forEach(d => {
      if (!buildingMap.has(d.building)) {
        buildingMap.set(d.building, {
          name: d.building_name || d.building,
          maxFloor: d.floor,
        });
      } else {
        const existing = buildingMap.get(d.building)!;
        if (d.floor > existing.maxFloor) {
          existing.maxFloor = d.floor;
        }
      }
    });

    return Array.from(buildingMap.entries()).map(([id, info]) => ({
      id,
      name: info.name,
      floors: info.maxFloor,
    }));
  }
}

// 导出单例
export const deviceRepository = new DeviceRepository();
