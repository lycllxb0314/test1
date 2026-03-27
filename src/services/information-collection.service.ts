/**
 * 信息采集 Service
 * 
 * 提供信息采集业务逻辑处理
 * 
 * @module services/information-collection.service
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import {
  informationCollectionRepository,
  collectionResponseRepository,
  CollectionQueryOptions,
  InformationCollection,
  CollectionResponse,
  CollectionStatus,
} from '@/repositories/information-collection.repository';

/**
 * 信息采集 Service
 */
export class InformationCollectionService extends BaseService {
  /**
   * 获取分页列表
   */
  async getPaginated(
    options: CollectionQueryOptions = {}
  ): Promise<PaginatedServiceResult<InformationCollection>> {
    try {
      const result = await informationCollectionRepository.findPaginated(options);
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
      return { success: false, error: '获取信息采集列表失败' };
    }
  }

  /**
   * 根据ID获取详情
   */
  async getById(id: string): Promise<ServiceResult<InformationCollection>> {
    const collection = await informationCollectionRepository.findById(id);
    if (!collection) {
      return this.fail('信息采集不存在', 'NOT_FOUND');
    }
    return this.ok(collection);
  }

  /**
   * 获取详情（含统计）
   */
  async getDetail(
    id: string
  ): Promise<
    ServiceResult<
      InformationCollection & {
        stats?: { total: number; byType: Record<string, number>; byClass: Record<string, number> };
      }
    >
  > {
    const collection = await informationCollectionRepository.findById(id);
    if (!collection) {
      return this.fail('信息采集不存在', 'NOT_FOUND');
    }

    const stats = await collectionResponseRepository.getCollectionStats(id);
    return this.ok({ ...collection, stats });
  }

  /**
   * 创建采集
   */
  async create(data: Partial<InformationCollection>): Promise<ServiceResult<InformationCollection>> {
    if (!data.title || !data.fields || data.fields.length === 0) {
      return this.fail('标题和字段不能为空', 'VALIDATION_ERROR');
    }

    const collection = await informationCollectionRepository.create({
      ...data,
      status: data.status || 'draft',
      responseCount: 0,
    });

    if (!collection) {
      return this.fail('创建信息采集失败', 'CREATE_ERROR');
    }

    return this.ok(collection);
  }

  /**
   * 更新采集
   */
  async update(
    id: string,
    data: Partial<InformationCollection>
  ): Promise<ServiceResult<InformationCollection>> {
    const existing = await informationCollectionRepository.findById(id);
    if (!existing) {
      return this.fail('信息采集不存在', 'NOT_FOUND');
    }

    // 已发布的不能修改字段
    if (existing.status === 'published' && data.fields) {
      return this.fail('已发布的采集不能修改字段', 'INVALID_STATUS');
    }

    const collection = await informationCollectionRepository.update(id, data);
    if (!collection) {
      return this.fail('更新信息采集失败', 'UPDATE_ERROR');
    }

    return this.ok(collection);
  }

  /**
   * 发布采集
   */
  async publish(id: string): Promise<ServiceResult<InformationCollection>> {
    const existing = await informationCollectionRepository.findById(id);
    if (!existing) {
      return this.fail('信息采集不存在', 'NOT_FOUND');
    }

    if (existing.status !== 'draft') {
      return this.fail('只能发布草稿状态的采集', 'INVALID_STATUS');
    }

    return this.updateStatus(id, 'published');
  }

  /**
   * 关闭采集
   */
  async close(id: string): Promise<ServiceResult<InformationCollection>> {
    return this.updateStatus(id, 'closed');
  }

  /**
   * 归档采集
   */
  async archive(id: string): Promise<ServiceResult<InformationCollection>> {
    return this.updateStatus(id, 'archived');
  }

  /**
   * 更新状态
   */
  private async updateStatus(
    id: string,
    status: CollectionStatus
  ): Promise<ServiceResult<InformationCollection>> {
    const collection = await informationCollectionRepository.update(id, { status } as any);
    if (!collection) {
      return this.fail('更新状态失败', 'UPDATE_ERROR');
    }
    return this.ok(collection);
  }

  /**
   * 删除采集
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    const existing = await informationCollectionRepository.findById(id);
    if (!existing) {
      return this.fail('信息采集不存在', 'NOT_FOUND');
    }

    // 只能删除草稿
    if (existing.status !== 'draft') {
      return this.fail('只能删除草稿状态的采集', 'INVALID_STATUS');
    }

    const success = await informationCollectionRepository.delete(id);
    if (!success) {
      return this.fail('删除信息采集失败', 'DELETE_ERROR');
    }

    return this.ok();
  }

  /**
   * 获取进行中的采集
   */
  async getActive(): Promise<ServiceResult<InformationCollection[]>> {
    const collections = await informationCollectionRepository.findActive();
    return this.ok(collections);
  }
}

/**
 * 信息采集响应 Service
 */
export class CollectionResponseService extends BaseService {
  /**
   * 根据采集ID获取响应
   */
  async getByCollection(collectionId: string): Promise<ServiceResult<CollectionResponse[]>> {
    const responses = await collectionResponseRepository.findByCollection(collectionId);
    return this.ok(responses);
  }

  /**
   * 根据回答者获取响应
   */
  async getByRespondent(respondentId: string): Promise<ServiceResult<CollectionResponse[]>> {
    const responses = await collectionResponseRepository.findByRespondent(respondentId);
    return this.ok(responses);
  }

  /**
   * 提交响应
   */
  async submit(
    collectionId: string,
    respondentId: string,
    respondentName: string,
    respondentType: 'teacher' | 'parent' | 'student',
    answers: Record<string, unknown>,
    options?: { classId?: string; className?: string }
  ): Promise<ServiceResult<CollectionResponse>> {
    // 检查采集是否存在
    const collection = await informationCollectionRepository.findById(collectionId);
    if (!collection) {
      return this.fail('信息采集不存在', 'NOT_FOUND');
    }

    // 检查采集状态
    if (collection.status !== 'published') {
      return this.fail('采集未发布或已关闭', 'INVALID_STATUS');
    }

    // 检查截止日期
    if (collection.deadline && new Date(collection.deadline) < new Date()) {
      return this.fail('采集已过截止日期', 'EXPIRED');
    }

    // 检查是否已提交
    if (!collection.allowMultiple) {
      const hasSubmitted = await collectionResponseRepository.hasSubmitted(
        collectionId,
        respondentId
      );
      if (hasSubmitted) {
        return this.fail('您已提交过，不能重复提交', 'ALREADY_SUBMITTED');
      }
    }

    // 创建响应
    const response = await collectionResponseRepository.create({
      collectionId,
      respondentId,
      respondentName,
      respondentType,
      classId: options?.classId,
      className: options?.className,
      answers,
      submittedAt: new Date().toISOString(),
    } as any);

    if (!response) {
      return this.fail('提交失败', 'SUBMIT_ERROR');
    }

    // 更新响应计数
    await informationCollectionRepository.incrementResponseCount(collectionId);

    return this.ok(response);
  }

  /**
   * 获取统计
   */
  async getStats(
    collectionId: string
  ): Promise<
    ServiceResult<{
      total: number;
      byType: Record<string, number>;
      byClass: Record<string, number>;
    }>
  > {
    const stats = await collectionResponseRepository.getCollectionStats(collectionId);
    return this.ok(stats);
  }

  /**
   * 导出响应数据
   */
  async export(collectionId: string): Promise<ServiceResult<CollectionResponse[]>> {
    // 检查采集是否存在
    const collection = await informationCollectionRepository.findById(collectionId);
    if (!collection) {
      return this.fail('信息采集不存在', 'NOT_FOUND');
    }

    const responses = await collectionResponseRepository.exportResponses(collectionId);
    return this.ok(responses);
  }
}

// 导出单例
export const informationCollectionService = new InformationCollectionService();
export const collectionResponseService = new CollectionResponseService();
