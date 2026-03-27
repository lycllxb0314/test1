/**
 * 信息采集 Repository
 * 
 * 提供信息采集数据访问
 * 
 * @module repositories/information-collection.repository
 */

import { BaseRepository, QueryOptions, PaginatedResult } from './base.repository';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type {
  InformationCollection,
  CollectionResponse,
  CollectionStatus,
  FieldType,
  FormField,
} from '@/types/information-collection';

// 导出类型供外部使用
export type { InformationCollection, CollectionResponse, CollectionStatus, FieldType, FormField };

/**
 * 信息采集查询选项
 */
export interface CollectionQueryOptions extends QueryOptions {
  status?: CollectionStatus;
  creatorId?: string;
}

/**
 * 信息采集 Repository
 */
export class InformationCollectionRepository extends BaseRepository<InformationCollection> {
  constructor() {
    super('information_collections');
  }

  /**
   * 根据状态查询
   */
  async findByStatus(status: CollectionStatus): Promise<InformationCollection[]> {
    return this.findWhere({ status });
  }

  /**
   * 根据创建者查询
   */
  async findByCreator(creatorId: string): Promise<InformationCollection[]> {
    return this.findWhere({ creator_id: creatorId });
  }

  /**
   * 查询进行中的采集
   */
  async findActive(): Promise<InformationCollection[]> {
    return this.findByStatus('published');
  }

  /**
   * 分页查询
   */
  async findPaginated(
    options: CollectionQueryOptions = {}
  ): Promise<PaginatedResult<InformationCollection>> {
    const { status, creatorId, ...baseOptions } = options;

    const filters: Record<string, unknown> = {
      ...baseOptions.filters,
    };

    if (status) filters.status = status;
    if (creatorId) filters.creator_id = creatorId;

    return super.findPaginated({
      ...baseOptions,
      filters,
    });
  }

  /**
   * 增加响应计数
   */
  async incrementResponseCount(id: string): Promise<boolean> {
    const client = this.client;
    const { error } = await client.rpc('increment_collection_response', {
      collection_id: id,
    });

    if (error) {
      // 回退到手动更新
      const collection = await this.findById(id);
      if (collection) {
        await this.update(id, {
          response_count: (collection.responseCount || 0) + 1,
        } as any);
      }
    }

    return true;
  }
}

/**
 * 信息采集响应 Repository
 */
export class CollectionResponseRepository extends BaseRepository<CollectionResponse> {
  constructor() {
    super('collection_responses');
  }

  /**
   * 根据采集ID查询
   */
  async findByCollection(collectionId: string): Promise<CollectionResponse[]> {
    return this.findWhere({ collection_id: collectionId });
  }

  /**
   * 根据回答者查询
   */
  async findByRespondent(respondentId: string): Promise<CollectionResponse[]> {
    return this.findWhere({ respondent_id: respondentId });
  }

  /**
   * 检查是否已提交
   */
  async hasSubmitted(collectionId: string, respondentId: string): Promise<boolean> {
    const responses = await this.findWhere({
      collection_id: collectionId,
      respondent_id: respondentId,
    });
    return responses.length > 0;
  }

  /**
   * 统计采集响应
   */
  async getCollectionStats(collectionId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byClass: Record<string, number>;
  }> {
    const client = this.client;
    const { data, error } = await client
      .from(this.tableName)
      .select('respondent_type, class_id, class_name')
      .eq('collection_id', collectionId);

    if (error || !data) {
      return { total: 0, byType: {}, byClass: {} };
    }

    const byType: Record<string, number> = {};
    const byClass: Record<string, number> = {};

    data.forEach((item) => {
      byType[item.respondent_type] = (byType[item.respondent_type] || 0) + 1;
      if (item.class_name) {
        byClass[item.class_name] = (byClass[item.class_name] || 0) + 1;
      }
    });

    return {
      total: data.length,
      byType,
      byClass,
    };
  }

  /**
   * 导出响应数据
   */
  async exportResponses(collectionId: string): Promise<CollectionResponse[]> {
    return this.findByCollection(collectionId);
  }
}

// 导出单例
export const informationCollectionRepository = new InformationCollectionRepository();
export const collectionResponseRepository = new CollectionResponseRepository();
