/**
 * 教室/场地管理服务
 * 
 * 处理教室、场地预约等业务逻辑
 */

import { BaseService, ServiceResult } from './base.service';
import {
  roomRepository,
  spaceReservationRepository,
  RoomRecord,
  SpaceReservationRecord,
  RoomQueryParams,
  SpaceReservationQueryParams,
} from '@/repositories/facility.repository';
import { PaginatedResult } from '@/repositories/base.repository';

// ==================== 教室服务 ====================

export class RoomService extends BaseService {
  async getList(params: RoomQueryParams): Promise<ServiceResult<RoomRecord[]>> {
    try {
      const data = await roomRepository.findByParams(params);
      return this.ok(data);
    } catch (error) {
      console.error('[RoomService] getList error:', error);
      return this.fail('获取教室列表失败');
    }
  }

  async getById(id: string): Promise<ServiceResult<RoomRecord>> {
    try {
      const data = await roomRepository.findById(id);
      if (!data) {
        return this.fail('教室不存在');
      }
      return this.ok(data);
    } catch (error) {
      console.error('[RoomService] getById error:', error);
      return this.fail('获取教室详情失败');
    }
  }

  async create(data: Partial<RoomRecord>): Promise<ServiceResult<RoomRecord>> {
    try {
      if (!data.name || !data.type) {
        return this.fail('缺少必要参数');
      }

      const record = await roomRepository.create({
        ...data,
        id: data.id || `room-${Date.now()}`,
        status: data.status || 'available',
        facilities: data.facilities || {},
      });
      if (!record) {
        return this.fail('创建教室失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[RoomService] create error:', error);
      return this.fail('创建教室失败');
    }
  }

  async update(id: string, data: Partial<RoomRecord>): Promise<ServiceResult<RoomRecord>> {
    try {
      const record = await roomRepository.update(id, data);
      if (!record) {
        return this.fail('更新教室失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[RoomService] update error:', error);
      return this.fail('更新教室失败');
    }
  }

  async updateStatus(id: string, status: string): Promise<ServiceResult<RoomRecord>> {
    try {
      const record = await roomRepository.updateStatus(id, status);
      if (!record) {
        return this.fail('更新教室状态失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[RoomService] updateStatus error:', error);
      return this.fail('更新教室状态失败');
    }
  }

  async delete(id: string): Promise<ServiceResult<boolean>> {
    try {
      const success = await roomRepository.delete(id);
      return this.ok(success);
    } catch (error) {
      console.error('[RoomService] delete error:', error);
      return this.fail('删除教室失败');
    }
  }

  async findByBuilding(building: string): Promise<ServiceResult<RoomRecord[]>> {
    try {
      const data = await roomRepository.findByBuilding(building);
      return this.ok(data);
    } catch (error) {
      console.error('[RoomService] findByBuilding error:', error);
      return this.fail('获取楼栋教室失败');
    }
  }

  async findAvailable(): Promise<ServiceResult<RoomRecord[]>> {
    try {
      const data = await roomRepository.findAvailable();
      return this.ok(data);
    } catch (error) {
      console.error('[RoomService] findAvailable error:', error);
      return this.fail('获取可用教室失败');
    }
  }
}

// ==================== 场地预约服务 ====================

export class SpaceReservationService extends BaseService {
  async getList(params: SpaceReservationQueryParams): Promise<ServiceResult<PaginatedResult<SpaceReservationRecord>>> {
    try {
      const data = await spaceReservationRepository.findByParams(params);
      return this.ok(data);
    } catch (error) {
      console.error('[SpaceReservationService] getList error:', error);
      return this.fail('获取预约列表失败');
    }
  }

  async getById(id: string): Promise<ServiceResult<SpaceReservationRecord>> {
    try {
      const data = await spaceReservationRepository.findById(id);
      if (!data) {
        return this.fail('预约不存在');
      }
      return this.ok(data);
    } catch (error) {
      console.error('[SpaceReservationService] getById error:', error);
      return this.fail('获取预约详情失败');
    }
  }

  async create(data: Partial<SpaceReservationRecord>): Promise<ServiceResult<SpaceReservationRecord>> {
    try {
      // 检查冲突
      const hasConflict = await spaceReservationRepository.checkConflict(
        data.space_id!,
        data.start_time!,
        data.end_time!
      );

      if (hasConflict) {
        return this.fail('该时段已被预约');
      }

      const record = await spaceReservationRepository.create({
        ...data,
        id: data.id || `reservation-${Date.now()}`,
        status: data.status || 'pending',
      });
      if (!record) {
        return this.fail('创建预约失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[SpaceReservationService] create error:', error);
      return this.fail('创建预约失败');
    }
  }

  async approve(id: string, approvedBy: string): Promise<ServiceResult<SpaceReservationRecord>> {
    try {
      const record = await spaceReservationRepository.approve(id, approvedBy);
      if (!record) {
        return this.fail('审批预约失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[SpaceReservationService] approve error:', error);
      return this.fail('审批预约失败');
    }
  }

  async reject(id: string, rejectedBy: string, reason?: string): Promise<ServiceResult<SpaceReservationRecord>> {
    try {
      const record = await spaceReservationRepository.reject(id, rejectedBy, reason);
      if (!record) {
        return this.fail('拒绝预约失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[SpaceReservationService] reject error:', error);
      return this.fail('拒绝预约失败');
    }
  }
}

// 导出单例
export const roomService = new RoomService();
export const spaceReservationService = new SpaceReservationService();
