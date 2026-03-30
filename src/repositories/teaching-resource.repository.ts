/**
 * 教学资源库 Repository 层
 * 
 * 六层架构第一层：数据访问层
 * 负责与数据库的直接交互，不包含业务逻辑
 * 
 * @module repositories/teaching-resource
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import type {
  TeachingResource,
  CreateResourceRequest,
  UpdateResourceRequest,
  ResourceQueryParams,
  ResourceListItem,
  ResourceStatistics,
  ResourceCategory,
  ResourceType,
} from '@/types/teaching-resource';

// ==================== 类型映射 ====================

/** 数据库行类型 */
interface ResourceRow {
  id: string;
  teacher_id: string;
  teacher_name: string | null;
  category: ResourceCategory;
  type: string;
  subject: string | null;
  grade: number | null;
  title: string;
  description: string | null;
  content: Record<string, unknown>;
  tags: string[] | null;
  view_count: number;
  use_count: number;
  status: string;
  lesson_title: string | null;
  source_id: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== Repository 类 ====================

/**
 * 教学资源 Repository
 */
export class TeachingResourceRepository {
  private tableName = 'teaching_resources';

  /**
   * 创建资源
   */
  async create(data: CreateResourceRequest & { teacherId: string; teacherName?: string }): Promise<TeachingResource> {
    const client = getSupabaseClient();
    
    const row: Omit<ResourceRow, 'id' | 'created_at' | 'updated_at'> = {
      teacher_id: data.teacherId,
      teacher_name: data.teacherName || null,
      category: data.category,
      type: data.type || 'other',
      subject: data.subject || null,
      grade: data.grade || null,
      title: data.title,
      description: data.description || null,
      content: data.content,
      tags: data.tags || null,
      view_count: 0,
      use_count: 0,
      status: 'draft',
      lesson_title: data.lessonTitle || null,
      source_id: data.sourceId || null,
    };

    const { data: result, error } = await client
      .from(this.tableName)
      .insert(row)
      .select()
      .single();

    if (error) {
      throw new Error(`创建资源失败: ${error.message}`);
    }

    return this.mapToEntity(result);
  }

  /**
   * 根据ID查询资源
   */
  async findById(id: string): Promise<TeachingResource | null> {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`查询资源失败: ${error.message}`);
    }

    return this.mapToEntity(data);
  }

  /**
   * 查询资源列表
   */
  async findMany(params: ResourceQueryParams): Promise<{ items: ResourceListItem[]; total: number }> {
    const client = getSupabaseClient();
    
    let query = client
      .from(this.tableName)
      .select('id, category, type, title, description, grade, status, view_count, use_count, created_at, updated_at', { count: 'exact' });

    // 应用筛选条件
    if (params.teacherId) {
      query = query.eq('teacher_id', params.teacherId);
    }
    if (params.category && params.category !== 'all') {
      query = query.eq('category', params.category);
    }
    if (params.type && params.type !== 'all') {
      query = query.eq('type', params.type);
    }
    if (params.grade) {
      query = query.eq('grade', params.grade);
    }
    if (params.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }
    if (params.search) {
      query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    }

    // 排序 - 映射字段名到数据库列名
    const sortFieldMap: Record<string, string> = {
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      'viewCount': 'view_count',
      'useCount': 'use_count',
    };
    const sortBy = sortFieldMap[params.sortBy || 'createdAt'] || params.sortBy || 'created_at';
    const sortOrder = params.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // 分页
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const start = (page - 1) * pageSize;
    query = query.range(start, start + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`查询资源列表失败: ${error.message}`);
    }

    return {
      items: (data || []).map(this.mapToListItem),
      total: count || 0,
    };
  }

  /**
   * 更新资源
   */
  async update(id: string, data: UpdateResourceRequest): Promise<TeachingResource> {
    const client = getSupabaseClient();
    
    const updateData: Partial<ResourceRow> = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    const { data: result, error } = await client
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`更新资源失败: ${error.message}`);
    }

    return this.mapToEntity(result);
  }

  /**
   * 删除资源
   */
  async delete(id: string): Promise<void> {
    const client = getSupabaseClient();
    
    const { error } = await client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`删除资源失败: ${error.message}`);
    }
  }

  /**
   * 增加查看次数
   */
  async incrementViewCount(id: string): Promise<void> {
    const client = getSupabaseClient();
    
    const { error } = await client
      .rpc('increment_view_count', { resource_id: id });

    // 如果 RPC 不存在，使用普通更新
    if (error) {
      const resource = await this.findById(id);
      if (resource) {
        await client
          .from(this.tableName)
          .update({ view_count: (resource.viewCount || 0) + 1 })
          .eq('id', id);
      }
    }
  }

  /**
   * 增加使用次数
   */
  async incrementUseCount(id: string): Promise<void> {
    const client = getSupabaseClient();
    
    const resource = await this.findById(id);
    if (resource) {
      await client
        .from(this.tableName)
        .update({ use_count: (resource.useCount || 0) + 1 })
        .eq('id', id);
    }
  }

  /**
   * 获取统计数据
   */
  async getStatistics(teacherId: string): Promise<ResourceStatistics> {
    const client = getSupabaseClient();
    
    // 总数
    const { count: total } = await client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', teacherId);

    // 按分类统计
    const { data: categoryData } = await client
      .from(this.tableName)
      .select('category')
      .eq('teacher_id', teacherId);

    const byCategory: Record<string, number> = {};
    (categoryData || []).forEach(item => {
      byCategory[item.category] = (byCategory[item.category] || 0) + 1;
    });

    // 按年级统计
    const { data: gradeData } = await client
      .from(this.tableName)
      .select('grade')
      .eq('teacher_id', teacherId)
      .not('grade', 'is', null);

    const byGrade: Record<number, number> = {};
    (gradeData || []).forEach(item => {
      if (item.grade) {
        byGrade[item.grade] = (byGrade[item.grade] || 0) + 1;
      }
    });

    // 最近7天新增
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { count: recentCount } = await client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', teacherId)
      .gte('created_at', sevenDaysAgo.toISOString());

    // 使用最多的资源
    const { data: mostUsedData } = await client
      .from(this.tableName)
      .select('id, category, type, title, description, grade, status, view_count, use_count, created_at, updated_at')
      .eq('teacher_id', teacherId)
      .order('use_count', { ascending: false })
      .limit(5);

    return {
      total: total || 0,
      byCategory: byCategory as ResourceStatistics['byCategory'],
      byGrade,
      recentCount: recentCount || 0,
      mostUsed: (mostUsedData || []).map(this.mapToListItem),
    };
  }

  // ==================== 私有方法 ====================

  /**
   * 映射数据库行到实体
   */
  private mapToEntity(row: ResourceRow): TeachingResource {
    return {
      id: row.id,
      teacherId: row.teacher_id,
      teacherName: row.teacher_name || undefined,
      category: row.category,
      type: row.type as ResourceType,
      subject: row.subject || undefined,
      grade: row.grade || undefined,
      title: row.title,
      description: row.description || undefined,
      content: row.content,
      tags: row.tags || undefined,
      viewCount: row.view_count,
      useCount: row.use_count,
      status: row.status as TeachingResource['status'],
      lessonTitle: row.lesson_title || undefined,
      sourceId: row.source_id || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * 映射到列表项
   */
  private mapToListItem(row: Pick<ResourceRow, 'id' | 'category' | 'type' | 'title' | 'description' | 'grade' | 'status' | 'view_count' | 'use_count' | 'created_at' | 'updated_at'>): ResourceListItem {
    return {
      id: row.id,
      category: row.category,
      type: row.type as ResourceType,
      title: row.title,
      description: row.description || undefined,
      grade: row.grade || undefined,
      status: row.status as ResourceListItem['status'],
      viewCount: row.view_count,
      useCount: row.use_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// ==================== 单例导出 ====================

export const teachingResourceRepository = new TeachingResourceRepository();
