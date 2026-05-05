/**
 * 设备管理 Service
 * 
 * 处理智能设备业务逻辑
 */

import { BaseService, ServiceResult } from './base.service';
import { deviceRepository, DeviceRecord } from '@/repositories/device.repository';
import type { Device, DeviceStatus, DeviceType, DeviceStatistics, DeviceFilters } from '@/types/general';

// ==================== 类型转换 ====================

function recordToDevice(record: DeviceRecord): Device {
  return {
    id: record.id,
    name: record.name,
    deviceNo: record.device_no || undefined,
    type: record.type as DeviceType,
    status: record.status as DeviceStatus,
    building: record.building,
    buildingName: record.building_name || undefined,
    floor: record.floor,
    room: record.room || undefined,
    location: record.location || undefined,
    brand: record.brand || undefined,
    model: record.model || undefined,
    sn: record.sn || undefined,
    isOn: record.is_on,
    brightness: record.brightness || undefined,
    temperature: record.temperature || undefined,
    locked: record.locked || undefined,
    position: record.position || undefined,
    managerId: record.manager_id || undefined,
    managerName: record.manager_name || undefined,
    department: record.department || undefined,
    ipAddress: record.ip_address || undefined,
    macAddress: record.mac_address || undefined,
    lastMaintenance: record.last_maintenance || undefined,
    nextMaintenance: record.next_maintenance || undefined,
    warrantyExpiry: record.warranty_expiry || undefined,
    images: record.images || undefined,
    note: record.note || undefined,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function deviceToRecord(device: Partial<Device>): Partial<DeviceRecord> {
  const record: Partial<DeviceRecord> = {};
  
  if (device.name !== undefined) record.name = device.name;
  if (device.deviceNo !== undefined) record.device_no = device.deviceNo;
  if (device.type !== undefined) record.type = device.type;
  if (device.status !== undefined) record.status = device.status;
  if (device.building !== undefined) record.building = device.building;
  if (device.buildingName !== undefined) record.building_name = device.buildingName;
  if (device.floor !== undefined) record.floor = device.floor;
  if (device.room !== undefined) record.room = device.room;
  if (device.location !== undefined) record.location = device.location;
  if (device.brand !== undefined) record.brand = device.brand;
  if (device.model !== undefined) record.model = device.model;
  if (device.sn !== undefined) record.sn = device.sn;
  if (device.isOn !== undefined) record.is_on = device.isOn;
  if (device.brightness !== undefined) record.brightness = device.brightness;
  if (device.temperature !== undefined) record.temperature = device.temperature;
  if (device.locked !== undefined) record.locked = device.locked;
  if (device.position !== undefined) record.position = device.position;
  if (device.managerId !== undefined) record.manager_id = device.managerId;
  if (device.managerName !== undefined) record.manager_name = device.managerName;
  if (device.department !== undefined) record.department = device.department;
  if (device.ipAddress !== undefined) record.ip_address = device.ipAddress;
  if (device.macAddress !== undefined) record.mac_address = device.macAddress;
  if (device.lastMaintenance !== undefined) record.last_maintenance = device.lastMaintenance;
  if (device.nextMaintenance !== undefined) record.next_maintenance = device.nextMaintenance;
  if (device.warrantyExpiry !== undefined) record.warranty_expiry = device.warrantyExpiry;
  if (device.images !== undefined) record.images = device.images;
  if (device.note !== undefined) record.note = device.note;
  
  return record;
}

// ==================== Service ====================

export class DeviceService extends BaseService {
  /**
   * 获取设备列表
   */
  async getDevices(filters?: DeviceFilters): Promise<ServiceResult<Device[]>> {
    try {
      const records = await deviceRepository.findWithFilters({
        type: filters?.type,
        status: filters?.status,
        building: filters?.building,
        floor: typeof filters?.floor === 'number' ? filters.floor : undefined,
        search: filters?.search,
      });
      
      const devices = records.map(recordToDevice);
      return this.ok(devices);
    } catch (error) {
      console.error('[DeviceService] getDevices error:', error);
      return this.fail('获取设备列表失败', 'SERVER_ERROR');
    }
  }

  /**
   * 获取设备详情
   */
  async getDevice(id: string): Promise<ServiceResult<Device>> {
    try {
      const record = await deviceRepository.findById(id);
      if (!record) {
        return this.fail('设备不存在', 'NOT_FOUND');
      }
      return this.ok(recordToDevice(record));
    } catch (error) {
      console.error('[DeviceService] getDevice error:', error);
      return this.fail('获取设备详情失败', 'SERVER_ERROR');
    }
  }

  /**
   * 创建设备
   */
  async createDevice(device: Partial<Device>): Promise<ServiceResult<Device>> {
    try {
      const record = await deviceRepository.create({
        ...deviceToRecord(device),
        id: crypto.randomUUID(),
        is_on: device.isOn ?? false,
        status: device.status ?? 'online',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      
      if (!record) {
        return this.fail('创建设备失败', 'CREATE_FAILED');
      }
      return this.ok(recordToDevice(record));
    } catch (error) {
      console.error('[DeviceService] createDevice error:', error);
      return this.fail('创建设备失败', 'SERVER_ERROR');
    }
  }

  /**
   * 更新设备
   */
  async updateDevice(id: string, updates: Partial<Device>): Promise<ServiceResult<Device>> {
    try {
      const record = await deviceRepository.update(id, deviceToRecord(updates));
      if (!record) {
        return this.fail('更新设备失败', 'UPDATE_FAILED');
      }
      return this.ok(recordToDevice(record));
    } catch (error) {
      console.error('[DeviceService] updateDevice error:', error);
      return this.fail('更新设备失败', 'SERVER_ERROR');
    }
  }

  /**
   * 删除设备
   */
  async deleteDevice(id: string): Promise<ServiceResult<boolean>> {
    try {
      const success = await deviceRepository.delete(id);
      if (!success) {
        return this.fail('删除设备失败', 'DELETE_FAILED');
      }
      return this.ok(true);
    } catch (error) {
      console.error('[DeviceService] deleteDevice error:', error);
      return this.fail('删除设备失败', 'SERVER_ERROR');
    }
  }

  /**
   * 控制设备开关
   */
  async toggleDevice(id: string, isOn: boolean): Promise<ServiceResult<Device>> {
    try {
      const device = await deviceRepository.findById(id);
      if (!device) {
        return this.fail('设备不存在', 'NOT_FOUND');
      }
      if (device.status !== 'online') {
        return this.fail('设备离线，无法控制', 'DEVICE_OFFLINE');
      }

      const record = await deviceRepository.updateControlState(id, { is_on: isOn });
      if (!record) {
        return this.fail('控制设备失败', 'UPDATE_FAILED');
      }

      const updated = await deviceRepository.findById(id);
      return this.ok(recordToDevice(updated!));
    } catch (error) {
      console.error('[DeviceService] toggleDevice error:', error);
      return this.fail('控制设备失败', 'SERVER_ERROR');
    }
  }

  /**
   * 调节设备参数（亮度/温度等）
   */
  async adjustDevice(id: string, params: {
    brightness?: number;
    temperature?: number;
    position?: number;
    locked?: boolean;
  }): Promise<ServiceResult<Device>> {
    try {
      const device = await deviceRepository.findById(id);
      if (!device) {
        return this.fail('设备不存在', 'NOT_FOUND');
      }
      if (device.status !== 'online') {
        return this.fail('设备离线，无法控制', 'DEVICE_OFFLINE');
      }

      const success = await deviceRepository.updateControlState(id, {
        brightness: params.brightness,
        temperature: params.temperature,
        position: params.position,
        locked: params.locked,
      });

      if (!success) {
        return this.fail('调节设备失败', 'UPDATE_FAILED');
      }

      const updated = await deviceRepository.findById(id);
      return this.ok(recordToDevice(updated!));
    } catch (error) {
      console.error('[DeviceService] adjustDevice error:', error);
      return this.fail('调节设备失败', 'SERVER_ERROR');
    }
  }

  /**
   * 批量控制设备
   */
  async batchControl(type: DeviceType, action: 'on' | 'off'): Promise<ServiceResult<number>> {
    try {
      // 获取该类型的所有在线设备
      const devices = await deviceRepository.findWithFilters({ type, status: 'online' });
      
      let count = 0;
      for (const device of devices) {
        const success = await deviceRepository.updateControlState(device.id, {
          is_on: action === 'on',
        });
        if (success) count++;
      }

      return this.ok(count);
    } catch (error) {
      console.error('[DeviceService] batchControl error:', error);
      return this.fail('批量控制失败', 'SERVER_ERROR');
    }
  }

  /**
   * 获取统计数据
   */
  async getStatistics(): Promise<ServiceResult<DeviceStatistics>> {
    try {
      const stats = await deviceRepository.getStatistics();
      return this.ok(stats);
    } catch (error) {
      console.error('[DeviceService] getStatistics error:', error);
      return this.fail('获取统计数据失败', 'SERVER_ERROR');
    }
  }

  /**
   * 获取楼宇列表
   */
  async getBuildings(): Promise<ServiceResult<{ id: string; name: string; floors: number }[]>> {
    try {
      const buildings = await deviceRepository.getBuildings();
      return this.ok(buildings);
    } catch (error) {
      console.error('[DeviceService] getBuildings error:', error);
      return this.fail('获取楼宇列表失败', 'SERVER_ERROR');
    }
  }
}

// 导出单例
export const deviceService = new DeviceService();
