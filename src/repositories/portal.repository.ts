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
  priority?: string;
  publisher_id?: string;
  publisher_name?: string;
  publish_date?: string;
  expire_date?: string;
  status: string;
  view_count?: number;
  sort_order: number;
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
      .order('publish_date', { ascending: false });

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
}

// ==================== 成就展示 ====================

export interface AchievementRecord {
  id: string;
  title: string;
  category: string;
  description?: string;
  image?: string;
  achievement_date?: string;
  participants?: string[];
  awards?: string;
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
      query = query.eq('category', params.category);
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
      .select('category')
      .eq('is_active', true);

    if (error) {
      console.error('[AchievementRepository] findCategories error:', error.message);
      return [];
    }

    const categories = new Set((data || []).map((item: { category: string }) => item.category));
    return Array.from(categories);
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
}

// ==================== 导出单例 ====================

export const carouselRepository = new CarouselRepository();
export const schoolHonorRepository = new SchoolHonorRepository();
export const announcementRepository = new AnnouncementRepository();
export const achievementRepository = new AchievementRepository();
