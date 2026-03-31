/**
 * 门户管理 Repository
 * 
 * 处理轮播图、荣誉、公告、成就等数据的访问
 */

import { BaseRepository, PaginatedResult } from './base.repository';

// ==================== 轮播图 ====================

export interface CarouselItemRecord {
  id: string;
  type: string;
  image: string;
  video_url?: string;
  bilibili_url?: string;
  bilibili_bvid?: string;
  title: string;
  subtitle?: string;
  tag?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export class CarouselRepository extends BaseRepository<CarouselItemRecord> {
  constructor() {
    super('carousel_items');
  }

  async findActive(limit: number = 10): Promise<CarouselItemRecord[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[CarouselRepository] findActive error:', error.message);
      return [];
    }

    return (data || []) as CarouselItemRecord[];
  }

  /** 管理端：获取所有轮播图（包括未激活） */
  async findAllForAdmin(includeInactive: boolean = false, limit: number = 50): Promise<CarouselItemRecord[]> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[CarouselRepository] findAllForAdmin error:', error.message);
      return [];
    }

    return (data || []) as CarouselItemRecord[];
  }
}

// ==================== 办学荣誉 ====================

export interface SchoolHonorRecord {
  id: string;
  title: string;
  year?: string;
  description?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export class SchoolHonorRepository extends BaseRepository<SchoolHonorRecord> {
  constructor() {
    super('school_honors');
  }

  async findActive(limit: number = 10): Promise<SchoolHonorRecord[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[SchoolHonorRepository] findActive error:', error.message);
      return [];
    }

    return (data || []) as SchoolHonorRecord[];
  }
}

// ==================== 公告 ====================

export interface AnnouncementRecord {
  id: string;
  title: string;
  content: string;
  category?: string;
  type?: string;
  author_id?: string;
  author_name?: string;
  department?: string;
  cover_image?: string;
  media_level?: string;
  summary?: string;
  is_published?: boolean;
  published_at?: string;
  status: string;
  view_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface AnnouncementQueryParams {
  category?: string;
  status?: string;
  search?: string;
}

export class AnnouncementRepository extends BaseRepository<AnnouncementRecord> {
  constructor() {
    super('announcements');
  }

  async findPublished(params: AnnouncementQueryParams & { limit?: number }): Promise<AnnouncementRecord[]> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (params.category) {
      query = query.eq('category', params.category);
    }
    if (params.search) {
      query = query.or(`title.ilike.%${params.search}%,content.ilike.%${params.search}%`);
    }
    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AnnouncementRepository] findPublished error:', error.message);
      return [];
    }

    return (data || []) as AnnouncementRecord[];
  }

  /** 管理端：获取所有公告 */
  async findAllForAdmin(params: { type?: string; category?: string; limit?: number }): Promise<AnnouncementRecord[]> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(params.limit || 50);

    // 类型过滤
    if (params.type && params.type !== 'all') {
      if (params.type === 'announcement') {
        query = query.in('type', ['announcement', 'internal_notice']);
      } else if (params.type === 'news') {
        query = query.eq('type', 'news');
      }
    }

    // 分类过滤
    if (params.category) {
      query = query.eq('category', params.category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AnnouncementRepository] findAllForAdmin error:', error.message);
      return [];
    }

    return (data || []) as AnnouncementRecord[];
  }
}

// ==================== 成就展示 ====================

export interface AchievementRecord {
  id: string;
  title: string;
  category_id?: string;
  description?: string;
  image?: string;
  date?: string;
  summary?: string;
  highlights?: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AchievementQueryParams {
  category?: string;
  status?: string;
}

export class AchievementRepository extends BaseRepository<AchievementRecord> {
  constructor() {
    super('achievements');
  }

  async findActive(params: AchievementQueryParams & { limit?: number }): Promise<AchievementRecord[]> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (params.category) {
      query = query.eq('category_id', params.category);
    }
    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AchievementRepository] findActive error:', error.message);
      return [];
    }

    return (data || []) as AchievementRecord[];
  }

  async findCategories(): Promise<string[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('category_id')
      .eq('is_active', true);

    if (error) {
      console.error('[AchievementRepository] findCategories error:', error.message);
      return [];
    }

    const categories = new Set((data || []).map((item: { category_id: string }) => item.category_id).filter(Boolean));
    return Array.from(categories);
  }

  /** 管理端：获取成果分类列表 */
  async findAllCategories(includeInactive: boolean = false): Promise<any[]> {
    let query = this.client
      .from('achievement_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AchievementRepository] findAllCategories error:', error.message);
      return [];
    }

    return data || [];
  }

  /** 管理端：创建成果分类 */
  async createCategory(data: Record<string, any>): Promise<any | null> {
    const { data: result, error } = await this.client
      .from('achievement_categories')
      .insert({
        name: data.name,
        slug: data.slug || data.name?.toLowerCase().replace(/\s+/g, '-'),
        icon: data.icon || 'Sparkles',
        tag: data.tag || '',
        description: data.description || '',
        sort_order: data.sort_order || 0,
        is_active: data.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('[AchievementRepository] createCategory error:', error.message);
      return null;
    }

    return result;
  }

  /** 管理端：更新成果分类 */
  async updateCategory(id: string, data: Record<string, any>): Promise<any | null> {
    const { data: result, error } = await this.client
      .from('achievement_categories')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[AchievementRepository] updateCategory error:', error.message);
      return null;
    }

    return result;
  }

  /** 管理端：删除成果分类 */
  async deleteCategory(id: string): Promise<boolean> {
    // 先删除关联成果
    await this.client.from('achievements').delete().eq('category_id', id);
    // 再删除分类
    const { error } = await this.client.from('achievement_categories').delete().eq('id', id);

    if (error) {
      console.error('[AchievementRepository] deleteCategory error:', error.message);
      return false;
    }

    return true;
  }

  /** 管理端：获取成果列表（含分类信息） */
  async findAllWithCategory(categoryId?: string, includeInactive: boolean = false, limit: number = 50): Promise<any[]> {
    let query = this.client
      .from(this.tableName)
      .select('*, category:achievement_categories(id, name, icon)')
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AchievementRepository] findAllWithCategory error:', error.message);
      return [];
    }

    return data || [];
  }
}

// ==================== 童心教育 ====================

export interface ChildHeartPathRecord {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  image: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export class ChildHeartPathRepository extends BaseRepository<ChildHeartPathRecord> {
  constructor() {
    super('child_heart_paths');
  }

  async findActive(limit: number = 10): Promise<ChildHeartPathRecord[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[ChildHeartPathRepository] findActive error:', error.message);
      return [];
    }

    return (data || []) as ChildHeartPathRecord[];
  }

  /** 管理端：获取所有板块（包括未激活） */
  async findAllForAdmin(includeInactive: boolean = false, limit: number = 50): Promise<ChildHeartPathRecord[]> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ChildHeartPathRepository] findAllForAdmin error:', error.message);
      return [];
    }

    return (data || []) as ChildHeartPathRecord[];
  }
}

// ==================== 童心教育活动 ====================

export interface PhilosophyActivityRecord {
  id: string;
  category_id: string;
  title: string;
  image: string;
  date?: string;
  summary?: string;
  content?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export class PhilosophyActivityRepository extends BaseRepository<PhilosophyActivityRecord> {
  constructor() {
    super('philosophy_activities');
  }

  async findByCategory(categoryId: string, limit: number = 20): Promise<PhilosophyActivityRecord[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[PhilosophyActivityRepository] findByCategory error:', error.message);
      return [];
    }

    return (data || []) as PhilosophyActivityRecord[];
  }

  /** 管理端：获取分类下所有活动（包括未激活） */
  async findByCategoryForAdmin(categoryId: string, includeInactive: boolean = false, limit: number = 50): Promise<PhilosophyActivityRecord[]> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .eq('category_id', categoryId)
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[PhilosophyActivityRepository] findByCategoryForAdmin error:', error.message);
      return [];
    }

    return (data || []) as PhilosophyActivityRecord[];
  }
}

// ==================== 导出单例 ====================

export const carouselRepository = new CarouselRepository();
export const schoolHonorRepository = new SchoolHonorRepository();
export const announcementRepository = new AnnouncementRepository();
export const achievementRepository = new AchievementRepository();
