/**
 * 共享教学资源 Service
 * 
 * 六层架构第四层：服务层
 * 负责共享资源的业务逻辑
 * 
 * @module services/shared-resource.service
 */

import { BaseService, ServiceResult } from './base.service';
import { sharedResourceRepository } from '@/repositories/shared-resource.repository';
import type {
  SharedResource,
  SharedResourceQuery,
  CreateSharedResourceRequest,
} from '@/types/shared-resource';

/**
 * 共享资源服务
 */
export class SharedResourceService extends BaseService {
  /**
   * 查找匹配的共享资源
   */
  async findByTopic(query: SharedResourceQuery): Promise<ServiceResult<SharedResource | null>> {
    try {
      const resource = await sharedResourceRepository.findByTopic(query);
      return this.ok(resource);
    } catch (error) {
      console.error('[SharedResourceService] findByTopic error:', error);
      return this.fail('查询共享资源失败', 'QUERY_FAILED');
    }
  }

  /**
   * 创建共享资源（如果不存在）
   * 用于 LLM 生成后保存到共享库
   */
  async createIfNotExists(
    request: CreateSharedResourceRequest
  ): Promise<ServiceResult<SharedResource>> {
    try {
      // 先检查是否已存在
      const existing = await sharedResourceRepository.findByTopic({
        category: request.category,
        grade: request.grade,
        topicKey: request.topicKey,
      });

      if (existing) {
        // 已存在，直接返回
        return this.ok(existing);
      }

      // 不存在，创建新资源
      const resource = await sharedResourceRepository.create(request);
      return this.ok(resource);
    } catch (error) {
      console.error('[SharedResourceService] createIfNotExists error:', error);
      return this.fail('创建共享资源失败', 'CREATE_FAILED');
    }
  }

  /**
   * 使用共享资源（增加使用次数）
   */
  async useResource(id: string): Promise<ServiceResult<void>> {
    try {
      await sharedResourceRepository.incrementUseCount(id);
      return this.ok(undefined);
    } catch (error) {
      console.error('[SharedResourceService] useResource error:', error);
      return this.fail('更新使用次数失败', 'UPDATE_FAILED');
    }
  }

  /**
   * 获取热门共享资源
   */
  async getPopular(category?: string, limit?: number): Promise<ServiceResult<SharedResource[]>> {
    try {
      const resources = await sharedResourceRepository.getPopular(category, limit);
      return this.ok(resources);
    } catch (error) {
      console.error('[SharedResourceService] getPopular error:', error);
      return this.fail('获取热门资源失败', 'QUERY_FAILED');
    }
  }
}

/**
 * 创建共享资源服务实例
 */
export function createSharedResourceService(): SharedResourceService {
  return new SharedResourceService();
}
