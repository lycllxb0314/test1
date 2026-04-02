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
   * 根据创建者查询（teacher_id）
   */
  async findByCreator(creatorId: string): Promise<InformationCollection[]> {
    return this.findWhere({ teacher_id: creatorId });
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
    if (creatorId) filters.teacher_id = creatorId;

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
    super('information_collection_responses');
  }

  /**
   * 根据采集ID查询
   */
  async findByCollection(collectionId: string): Promise<CollectionResponse[]> {
    return this.findWhere({ collection_id: collectionId });
  }

  /**
   * 根据回答者查询（学生ID或家长ID）
   */
  async findByRespondent(respondentId: string): Promise<CollectionResponse[]> {
    const client = this.client;
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .or(`student_id.eq.${respondentId},parent_id.eq.${respondentId}`);
    
    if (error) {
      console.error(`[${this.tableName}] findByRespondent error:`, error.message);
      return [];
    }
    
    return (data || []) as CollectionResponse[];
  }

  /**
   * 检查是否已提交
   */
  async hasSubmitted(collectionId: string, respondentId: string): Promise<boolean> {
    const client = this.client;
    const { data, error } = await client
      .from(this.tableName)
      .select('id')
      .eq('collection_id', collectionId)
      .or(`student_id.eq.${respondentId},parent_id.eq.${respondentId}`)
      .limit(1);
    
    if (error) {
      console.error(`[${this.tableName}] hasSubmitted error:`, error.message);
      return false;
    }
    
    return (data || []).length > 0;
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
      .select('student_id, parent_id')
      .eq('collection_id', collectionId);

    if (error || !data) {
      return { total: 0, byType: {}, byClass: {} };
    }

    const byType: Record<string, number> = {};
    const byClass: Record<string, number> = {};

    data.forEach((item) => {
      // 统计类型（学生/家长）
      if (item.student_id) {
        byType['student'] = (byType['student'] || 0) + 1;
      }
      if (item.parent_id) {
        byType['parent'] = (byType['parent'] || 0) + 1;
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

  /**
   * 批量获取多个采集的响应数量
   */
  async getResponseCounts(collectionIds: string[]): Promise<Map<string, number>> {
    if (collectionIds.length === 0) return new Map();

    const client = this.client;
    const { data, error } = await client
      .from(this.tableName)
      .select('collection_id')
      .in('collection_id', collectionIds);

    if (error) {
      console.error(`[${this.tableName}] getResponseCounts error:`, error.message);
      return new Map();
    }

    const counts = new Map<string, number>();
    (data || []).forEach((item) => {
      const id = item.collection_id as string;
      counts.set(id, (counts.get(id) || 0) + 1);
    });

    return counts;
  }
}

// 导出单例
export const informationCollectionRepository = new InformationCollectionRepository();
export const collectionResponseRepository = new CollectionResponseRepository();
