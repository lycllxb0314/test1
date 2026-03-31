/**
 * 资产管理服务
 * 
 * 处理资产、维修请求等业务逻辑
 */

import { BaseService, ServiceResult } from './base.service';
import {
  assetRepository,
  repairRequestRepository,
  AssetRecord,
  RepairRequestRecord,
  AssetQueryParams,
  RepairRequestQueryParams,
} from '@/repositories/asset.repository';
import { PaginatedResult } from '@/repositories/base.repository';

// ==================== 资产服务 ====================

export class AssetService extends BaseService {
  async getList(params: AssetQueryParams): Promise<ServiceResult<AssetRecord[]>> {
    try {
      const data = await assetRepository.findByParams(params);
      return this.ok(data);
    } catch (error) {
      console.error('[AssetService] getList error:', error);
      return this.fail('获取资产列表失败');
    }
  }

  async getById(id: string): Promise<ServiceResult<AssetRecord>> {
    try {
      const data = await assetRepository.findById(id);
      if (!data) {
        return this.fail('资产不存在');
      }
      return this.ok(data);
    } catch (error) {
      console.error('[AssetService] getById error:', error);
      return this.fail('获取资产详情失败');
    }
  }

  async create(data: Partial<AssetRecord>): Promise<ServiceResult<AssetRecord>> {
    try {
      if (!data.name || !data.category) {
        return this.fail('缺少必要参数');
      }

      const record = await assetRepository.create({
        ...data,
        id: data.id || `asset-${Date.now()}`,
        status: data.status || 'active',
      });
      if (!record) {
        return this.fail('创建资产失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[AssetService] create error:', error);
      return this.fail('创建资产失败');
    }
  }

  async update(id: string, data: Partial<AssetRecord>): Promise<ServiceResult<AssetRecord>> {
    try {
      const record = await assetRepository.update(id, data);
      if (!record) {
        return this.fail('更新资产失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[AssetService] update error:', error);
      return this.fail('更新资产失败');
    }
  }

  async delete(id: string): Promise<ServiceResult<boolean>> {
    try {
      const success = await assetRepository.delete(id);
      return this.ok(success);
    } catch (error) {
      console.error('[AssetService] delete error:', error);
      return this.fail('删除资产失败');
    }
  }

  async getStatistics(): Promise<ServiceResult<{ byCategory: Record<string, number>; byStatus: Record<string, number> }>> {
    try {
      const [byCategory, byStatus] = await Promise.all([
        assetRepository.countByCategory(),
        assetRepository.countByStatus(),
      ]);
      return this.ok({ byCategory, byStatus });
    } catch (error) {
      console.error('[AssetService] getStatistics error:', error);
      return this.fail('获取资产统计失败');
    }
  }
}

// ==================== 维修请求服务 ====================

export class RepairRequestService extends BaseService {
  async getList(params: RepairRequestQueryParams): Promise<ServiceResult<PaginatedResult<RepairRequestRecord>>> {
    try {
      const data = await repairRequestRepository.findByParams(params);
      return this.ok(data);
    } catch (error) {
      console.error('[RepairRequestService] getList error:', error);
      return this.fail('获取维修请求列表失败');
    }
  }

  async getById(id: string): Promise<ServiceResult<RepairRequestRecord>> {
    try {
      const data = await repairRequestRepository.findById(id);
      if (!data) {
        return this.fail('维修请求不存在');
      }
      return this.ok(data);
    } catch (error) {
      console.error('[RepairRequestService] getById error:', error);
      return this.fail('获取维修请求详情失败');
    }
  }

  async create(data: Partial<RepairRequestRecord>): Promise<ServiceResult<RepairRequestRecord>> {
    try {
      const record = await repairRequestRepository.create({
        ...data,
        id: data.id || `repair-${Date.now()}`,
        status: data.status || 'pending',
        urgency: data.urgency || 'normal',
      });
      if (!record) {
        return this.fail('创建维修请求失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[RepairRequestService] create error:', error);
      return this.fail('创建维修请求失败');
    }
  }

  async assign(id: string, assignedTo: string): Promise<ServiceResult<RepairRequestRecord>> {
    try {
      const record = await repairRequestRepository.assign(id, assignedTo);
      if (!record) {
        return this.fail('分配维修任务失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[RepairRequestService] assign error:', error);
      return this.fail('分配维修任务失败');
    }
  }

  async complete(id: string, cost?: number, notes?: string): Promise<ServiceResult<RepairRequestRecord>> {
    try {
      const record = await repairRequestRepository.complete(id, cost, notes);
      if (!record) {
        return this.fail('完成维修任务失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[RepairRequestService] complete error:', error);
      return this.fail('完成维修任务失败');
    }
  }
}

// 导出单例
export const assetService = new AssetService();
export const repairRequestService = new RepairRequestService();
