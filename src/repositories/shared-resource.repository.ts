/**
 * 共享教学资源 Repository
 * 
 * 六层架构第五层：数据访问层
 * 负责共享资源的数据库操作
 * 
 * @module repositories/shared-resource.repository
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import type {
  SharedResource,
  SharedResourceQuery,
  CreateSharedResourceRequest,
} from '@/types/shared-resource';

/**
 * 数据库原始行类型
 */
type SharedResourceRow = {
  id: string;
  category: string;
  grade: number;
  topic_key: string;
  title: string;
  unit: string | null;
  content: Record<string, unknown>;
  use_count: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  created_by_name: string | null;
};

/**
 * 共享教学资源数据访问
 */
export const sharedResourceRepository = {
  /**
   * 查找匹配的共享资源
   */
  async findByTopic(query: SharedResourceQuery): Promise<SharedResource | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('shared_teaching_resources')
      .select('*')
      .eq('category', query.category)
      .eq('grade', query.grade)
      .eq('topic_key', query.topicKey)
      .maybeSingle();

    if (error) {
      console.error('[SharedResourceRepository] findByTopic error:', error);
      return null;
    }

    if (!data) return null;

    return this.mapToEntity(data);
  },

  /**
   * 创建共享资源
   */
  async create(request: CreateSharedResourceRequest): Promise<SharedResource> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('shared_teaching_resources')
      .insert({
        category: request.category,
        grade: request.grade,
        topic_key: request.topicKey,
        title: request.title,
        unit: request.unit || null,
        content: request.content,
        created_by: request.createdBy || null,
        created_by_name: request.createdByName || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[SharedResourceRepository] create error:', error);
      throw new Error('创建共享资源失败');
    }

    return this.mapToEntity(data);
  },

  /**
   * 更新使用次数
   */
  async incrementUseCount(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.rpc('increment_shared_resource_use_count', {
      resource_id: id,
    });

    // 如果 RPC 不存在，使用直接更新
    if (error) {
      // 先获取当前值
      const { data } = await supabase
        .from('shared_teaching_resources')
        .select('use_count')
        .eq('id', id)
        .single();

      if (data) {
        await supabase
          .from('shared_teaching_resources')
          .update({ use_count: (data.use_count || 0) + 1 })
          .eq('id', id);
      }
    }
  },

  /**
   * 获取热门共享资源
   */
  async getPopular(category?: string, limit: number = 10): Promise<SharedResource[]> {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('shared_teaching_resources')
      .select('*')
      .order('use_count', { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[SharedResourceRepository] getPopular error:', error);
      return [];
    }

    return (data || []).map(this.mapToEntity);
  },

  /**
   * 映射数据库行到实体
   */
  mapToEntity(row: SharedResourceRow): SharedResource {
    return {
      id: row.id,
      category: row.category as SharedResource['category'],
      grade: row.grade,
      topicKey: row.topic_key,
      title: row.title,
      unit: row.unit,
      content: row.content,
      useCount: row.use_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      createdByName: row.created_by_name,
    };
  },
};
