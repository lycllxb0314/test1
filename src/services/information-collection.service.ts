/**
 * 信息采集 Service
 * 
 * 提供信息采集业务逻辑处理
 * 
 * ⚠️ 架构原则：
 * - 通过 DI 容器获取 Repository，不直接 import 具体实现
 * - Service 层只依赖 Repository 接口，遵循依赖倒置原则
 * 
 * @module services/information-collection.service
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import type {
  IInformationCollectionRepository,
  ICollectionResponseRepository,
  CollectionQueryOptions,
} from '@/types/repository';
import type { InformationCollection, CollectionResponse, CollectionStatus } from '@/types/information-collection';

/**
 * 信息采集 Service 类
 */
export class InformationCollectionService extends BaseService {
  /**
   * 获取信息采集 Repository（通过 DI 容器）
   */
  private get informationCollectionRepository(): IInformationCollectionRepository {
    return getService(SERVICE_IDENTIFIERS.InformationCollectionRepository);
  }

  /**
   * 获取采集列表
   */
  async getList(options: CollectionQueryOptions = {}): Promise<ServiceResult<InformationCollection[]>> {
    try {
      const filters = options.filters || {};
      if (filters.creatorId) {
        const collections = await this.informationCollectionRepository.findByCreator(filters.creatorId as string);
        return this.ok(collections);
      }
      if (filters.status) {
        const collections = await this.informationCollectionRepository.findByStatus(filters.status as CollectionStatus);
        return this.ok(collections);
      }
      const collections = await this.informationCollectionRepository.findAll();
      return this.ok(collections);
    } catch (error) {
      return this.fail('获取信息采集列表失败', 'FETCH_ERROR');
    }
  }

  /**
   * 获取分页采集列表
   */
  async getPaginated(options: CollectionQueryOptions = {}): Promise<PaginatedServiceResult<InformationCollection>> {
    try {
      const result = await this.informationCollectionRepository.findPaginated(options);
      return {
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: '获取信息采集列表失败',
      };
    }
  }

  /**
   * 根据ID获取采集
   */
  async getById(id: string): Promise<ServiceResult<InformationCollection>> {
    const collection = await this.informationCollectionRepository.findById(id);
    if (!collection) {
      return this.fail('信息采集不存在', 'NOT_FOUND');
    }
    return this.ok(collection);
  }

  /**
   * 创建采集
   */
  async create(data: Partial<InformationCollection>): Promise<ServiceResult<InformationCollection>> {
    if (!data.title || !data.creatorId) {
      return this.fail('采集标题和创建者不能为空', 'VALIDATION_ERROR');
    }

    // 映射字段名：驼峰 -> 下划线
    const dbData: Record<string, unknown> = {
      title: data.title,
      description: data.description,
      deadline: data.deadline,
      fields: data.fields,
      status: (data.status || 'draft') as CollectionStatus,
      teacher_id: data.creatorId,
      teacher_name: data.creatorName,
      class_id: (data as Record<string, unknown>).classId || null,
    };

    const collection = await this.informationCollectionRepository.create(dbData as Partial<InformationCollection>);

    if (!collection) {
      return this.fail('创建信息采集失败', 'CREATE_ERROR');
    }

    return this.ok(collection);
  }

  /**
   * 更新采集
   */
  async update(id: string, data: Partial<InformationCollection>): Promise<ServiceResult<InformationCollection>> {
    const existing = await this.informationCollectionRepository.findById(id);
    if (!existing) {
      return this.fail('信息采集不存在', 'NOT_FOUND');
    }

    // 映射字段名：驼峰 -> 下划线
    const dbData: Record<string, unknown> = {};
    if (data.title !== undefined) dbData.title = data.title;
    if (data.description !== undefined) dbData.description = data.description;
    if (data.deadline !== undefined) dbData.deadline = data.deadline;
    if (data.fields !== undefined) dbData.fields = data.fields;
    if (data.status !== undefined) dbData.status = data.status;

    const collection = await this.informationCollectionRepository.update(id, dbData as Partial<InformationCollection>);
    if (!collection) {
      return this.fail('更新信息采集失败', 'UPDATE_ERROR');
    }

    return this.ok(collection);
  }

  /**
   * 发布采集
   */
  async publish(id: string): Promise<ServiceResult<InformationCollection>> {
    return this.updateStatus(id, 'published');
  }

  /**
   * 关闭采集
   */
  async close(id: string): Promise<ServiceResult<InformationCollection>> {
    return this.updateStatus(id, 'closed');
  }

  /**
   * 更新采集状态
   */
  private async updateStatus(id: string, status: CollectionStatus): Promise<ServiceResult<InformationCollection>> {
    const existing = await this.informationCollectionRepository.findById(id);
    if (!existing) {
      return this.fail('信息采集不存在', 'NOT_FOUND');
    }

    const collection = await this.informationCollectionRepository.update(id, { status } as Partial<InformationCollection>);
    if (!collection) {
      return this.fail('更新采集状态失败', 'UPDATE_ERROR');
    }

    return this.ok(collection);
  }

  /**
   * 删除采集
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    const existing = await this.informationCollectionRepository.findById(id);
    if (!existing) {
      return this.fail('信息采集不存在', 'NOT_FOUND');
    }

    if (existing.status !== 'draft') {
      return this.fail('只能删除草稿状态的采集', 'INVALID_STATUS');
    }

    const success = await this.informationCollectionRepository.delete(id);
    if (!success) {
      return this.fail('删除信息采集失败', 'DELETE_ERROR');
    }

    return this.ok();
  }
}

/**
 * 采集响应 Service 类
 */
export class CollectionResponseService extends BaseService {
  /**
   * 获取响应 Repository（通过 DI 容器）
   */
  private get collectionResponseRepository(): ICollectionResponseRepository {
    return getService(SERVICE_IDENTIFIERS.CollectionResponseRepository);
  }

  /**
   * 根据采集获取响应
   */
  async getByCollection(collectionId: string): Promise<ServiceResult<CollectionResponse[]>> {
    const responses = await this.collectionResponseRepository.findByCollection(collectionId);
    return this.ok(responses);
  }

  /**
   * 根据响应者获取响应
   */
  async getByResponder(responderId: string): Promise<ServiceResult<CollectionResponse[]>> {
    const responses = await this.collectionResponseRepository.findByResponder(responderId);
    return this.ok(responses);
  }

  /**
   * 提交响应
   */
  async submit(
    collectionId: string,
    responderId: string,
    responderName: string,
    answers: Record<string, unknown>
  ): Promise<ServiceResult<CollectionResponse>> {
    const response = await this.collectionResponseRepository.create({
      collectionId,
      responderId,
      responderName,
      answers,
      submittedAt: new Date().toISOString(),
    } as Partial<CollectionResponse>);

    if (!response) {
      return this.fail('提交失败', 'SUBMIT_ERROR');
    }

    return this.ok(response);
  }
}

// 导出单例
export const informationCollectionService = new InformationCollectionService();
export const collectionResponseService = new CollectionResponseService();
