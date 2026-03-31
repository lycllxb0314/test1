/**
 * 安全管理服务
 * 
 * 处理安全演练、安全检查等业务逻辑
 */

import { BaseService, ServiceResult } from './base.service';
import {
  safetyDrillRepository,
  safetyInspectionRepository,
  SafetyDrillRecord,
  SafetyInspectionRecord,
  SafetyDrillQueryParams,
  SafetyInspectionQueryParams,
} from '@/repositories/safety.repository';
import { PaginatedResult } from '@/repositories/base.repository';

// ==================== 安全演练服务 ====================

export class SafetyDrillService extends BaseService {
  async getList(params: SafetyDrillQueryParams): Promise<ServiceResult<SafetyDrillRecord[]>> {
    try {
      const data = await safetyDrillRepository.findByParams(params);
      return this.ok(data);
    } catch (error) {
      console.error('[SafetyDrillService] getList error:', error);
      return this.fail('获取安全演练列表失败');
    }
  }

  async getById(id: string): Promise<ServiceResult<SafetyDrillRecord>> {
    try {
      const data = await safetyDrillRepository.findById(id);
      if (!data) {
        return this.fail('演练记录不存在');
      }
      return this.ok(data);
    } catch (error) {
      console.error('[SafetyDrillService] getById error:', error);
      return this.fail('获取演练详情失败');
    }
  }

  async create(data: Partial<SafetyDrillRecord>): Promise<ServiceResult<SafetyDrillRecord>> {
    try {
      const record = await safetyDrillRepository.create({
        ...data,
        id: data.id || `drill-${Date.now()}`,
        participants: data.participants || 0,
        issues: data.issues || [],
        improvements: data.improvements || [],
      });
      if (!record) {
        return this.fail('创建演练记录失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[SafetyDrillService] create error:', error);
      return this.fail('创建演练记录失败');
    }
  }

  async update(id: string, data: Partial<SafetyDrillRecord>): Promise<ServiceResult<SafetyDrillRecord>> {
    try {
      const record = await safetyDrillRepository.update(id, data);
      if (!record) {
        return this.fail('更新演练记录失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[SafetyDrillService] update error:', error);
      return this.fail('更新演练记录失败');
    }
  }

  async delete(id: string): Promise<ServiceResult<boolean>> {
    try {
      const success = await safetyDrillRepository.delete(id);
      return this.ok(success);
    } catch (error) {
      console.error('[SafetyDrillService] delete error:', error);
      return this.fail('删除演练记录失败');
    }
  }

  async countByType(year: string): Promise<ServiceResult<Record<string, number>>> {
    try {
      const data = await safetyDrillRepository.countByType(year);
      return this.ok(data);
    } catch (error) {
      console.error('[SafetyDrillService] countByType error:', error);
      return this.fail('获取演练统计失败');
    }
  }
}

// ==================== 安全检查服务 ====================

export class SafetyInspectionService extends BaseService {
  async getList(params: SafetyInspectionQueryParams & { page?: number; pageSize?: number }): Promise<ServiceResult<PaginatedResult<SafetyInspectionRecord>>> {
    try {
      const data = await safetyInspectionRepository.findByParams(params);
      return this.ok(data);
    } catch (error) {
      console.error('[SafetyInspectionService] getList error:', error);
      return this.fail('获取安全检查列表失败');
    }
  }

  async getById(id: string): Promise<ServiceResult<SafetyInspectionRecord>> {
    try {
      const data = await safetyInspectionRepository.findById(id);
      if (!data) {
        return this.fail('检查记录不存在');
      }
      return this.ok(data);
    } catch (error) {
      console.error('[SafetyInspectionService] getById error:', error);
      return this.fail('获取检查详情失败');
    }
  }

  async create(data: Partial<SafetyInspectionRecord>): Promise<ServiceResult<SafetyInspectionRecord>> {
    try {
      const record = await safetyInspectionRepository.create({
        ...data,
        id: data.id || `inspection-${Date.now()}`,
        resolved: false,
        issues: data.issues || [],
      });
      if (!record) {
        return this.fail('创建检查记录失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[SafetyInspectionService] create error:', error);
      return this.fail('创建检查记录失败');
    }
  }

  async resolve(id: string, resolvedBy: string): Promise<ServiceResult<SafetyInspectionRecord>> {
    try {
      const record = await safetyInspectionRepository.resolve(id, resolvedBy);
      if (!record) {
        return this.fail('解决检查问题失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[SafetyInspectionService] resolve error:', error);
      return this.fail('解决检查问题失败');
    }
  }
}

// 导出单例
export const safetyDrillService = new SafetyDrillService();
export const safetyInspectionService = new SafetyInspectionService();
