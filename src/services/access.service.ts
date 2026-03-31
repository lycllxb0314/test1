/**
 * 门禁管理服务
 * 
 * 处理门禁设备、访问记录、统计等业务逻辑
 */

import { BaseService, ServiceResult } from './base.service';
import {
  accessDeviceRepository,
  accessRecordRepository,
  accessStatisticsRepository,
  AccessDeviceRecord,
  AccessRecordRecord,
  AccessStatistics,
  AccessDeviceQueryParams,
  AccessRecordQueryParams,
} from '@/repositories/access.repository';

// ==================== 门禁设备服务 ====================

export class AccessDeviceService extends BaseService {
  async getList(params: AccessDeviceQueryParams): Promise<ServiceResult<(AccessDeviceRecord & { todayCount: number })[]>> {
    try {
      const data = await accessDeviceRepository.findWithTodayCount(params);
      return this.ok(data);
    } catch (error) {
      console.error('[AccessDeviceService] getList error:', error);
      return this.fail('获取门禁设备列表失败');
    }
  }

  async getById(id: string): Promise<ServiceResult<AccessDeviceRecord>> {
    try {
      const data = await accessDeviceRepository.findById(id);
      if (!data) {
        return this.fail('设备不存在');
      }
      return this.ok(data);
    } catch (error) {
      console.error('[AccessDeviceService] getById error:', error);
      return this.fail('获取设备详情失败');
    }
  }

  async create(data: Partial<AccessDeviceRecord>): Promise<ServiceResult<AccessDeviceRecord>> {
    try {
      const record = await accessDeviceRepository.create({
        ...data,
        id: data.id || `device-${Date.now()}`,
        status: data.status || 'offline',
      });
      if (!record) {
        return this.fail('创建设备失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[AccessDeviceService] create error:', error);
      return this.fail('创建设备失败');
    }
  }

  async update(id: string, data: Partial<AccessDeviceRecord>): Promise<ServiceResult<AccessDeviceRecord>> {
    try {
      const record = await accessDeviceRepository.update(id, data);
      if (!record) {
        return this.fail('更新设备失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[AccessDeviceService] update error:', error);
      return this.fail('更新设备失败');
    }
  }

  async updateStatus(id: string, status: string): Promise<ServiceResult<AccessDeviceRecord>> {
    try {
      const record = await accessDeviceRepository.updateStatus(id, status);
      if (!record) {
        return this.fail('更新设备状态失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[AccessDeviceService] updateStatus error:', error);
      return this.fail('更新设备状态失败');
    }
  }

  async delete(id: string): Promise<ServiceResult<boolean>> {
    try {
      const success = await accessDeviceRepository.delete(id);
      return this.ok(success);
    } catch (error) {
      console.error('[AccessDeviceService] delete error:', error);
      return this.fail('删除设备失败');
    }
  }
}

// ==================== 访问记录服务 ====================

export class AccessRecordService extends BaseService {
  async getList(params: AccessRecordQueryParams & { page?: number; pageSize?: number }) {
    try {
      const data = await accessRecordRepository.findByDateRange(params);
      return this.ok(data);
    } catch (error) {
      console.error('[AccessRecordService] getList error:', error);
      return this.fail('获取访问记录失败');
    }
  }

  async create(data: Partial<AccessRecordRecord>): Promise<ServiceResult<AccessRecordRecord>> {
    try {
      const record = await accessRecordRepository.create({
        ...data,
        id: data.id || `record-${Date.now()}`,
        occurred_at: data.occurred_at || new Date().toISOString(),
      });
      if (!record) {
        return this.fail('创建访问记录失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[AccessRecordService] create error:', error);
      return this.fail('创建访问记录失败');
    }
  }

  async countToday(): Promise<ServiceResult<number>> {
    try {
      const count = await accessRecordRepository.countToday();
      return this.ok(count);
    } catch (error) {
      console.error('[AccessRecordService] countToday error:', error);
      return this.fail('获取今日访问次数失败');
    }
  }

  async countTodayVisitors(): Promise<ServiceResult<number>> {
    try {
      const count = await accessRecordRepository.countTodayVisitors();
      return this.ok(count);
    } catch (error) {
      console.error('[AccessRecordService] countTodayVisitors error:', error);
      return this.fail('获取今日访客数失败');
    }
  }
}

// ==================== 门禁统计服务 ====================

export class AccessStatisticsService extends BaseService {
  async getStatistics(): Promise<ServiceResult<AccessStatistics>> {
    try {
      const data = await accessStatisticsRepository.getStatistics();
      return this.ok(data);
    } catch (error) {
      console.error('[AccessStatisticsService] getStatistics error:', error);
      return this.fail('获取门禁统计数据失败');
    }
  }
}

// 导出单例
export const accessDeviceService = new AccessDeviceService();
export const accessRecordService = new AccessRecordService();
export const accessStatisticsService = new AccessStatisticsService();
