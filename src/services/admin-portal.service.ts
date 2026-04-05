/**
 * 门户管理服务（管理端）
 * 
 * 处理校长工作台的门户管理功能
 */

import { BaseService, ServiceResult } from './base.service';
import {
  carouselRepository,
  announcementRepository,
  achievementRepository,
  CarouselItemRecord,
  AnnouncementRecord,
  AchievementRecord,
  ChildHeartPathRepository,
  PhilosophyActivityRepository,
  ChildHeartPathRecord,
  PhilosophyActivityRecord,
} from '@/repositories/portal.repository';

const childHeartPathRepository = new ChildHeartPathRepository();
const philosophyActivityRepository = new PhilosophyActivityRepository();

// ==================== 轮播图管理服务 ====================

export class AdminCarouselService extends BaseService {
  /** 获取轮播图列表 */
  async getList(includeInactive: boolean = false, limit: number = 50): Promise<ServiceResult<CarouselItemRecord[]>> {
    try {
      const data = await carouselRepository.findAllForAdmin(includeInactive, limit);
      return this.ok(data);
    } catch (error) {
      console.error('[AdminCarouselService] getList error:', error);
      return this.fail('获取轮播图数据失败');
    }
  }

  /** 创建轮播图 */
  async create(data: Partial<CarouselItemRecord>): Promise<ServiceResult<CarouselItemRecord>> {
    try {
      const record = await carouselRepository.create({
        ...data,
        is_active: data.is_active ?? true,
        sort_order: data.sort_order || 0,
      });
      if (!record) {
        return this.fail('创建轮播图失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[AdminCarouselService] create error:', error);
      return this.fail('创建轮播图失败');
    }
  }

  /** 更新轮播图 */
  async update(id: string, data: Partial<CarouselItemRecord>): Promise<ServiceResult<CarouselItemRecord>> {
    try {
      const record = await carouselRepository.update(id, data);
      if (!record) {
        return this.fail('更新轮播图失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[AdminCarouselService] update error:', error);
      return this.fail('更新轮播图失败');
    }
  }

  /** 删除轮播图 */
  async delete(id: string): Promise<ServiceResult<boolean>> {
    try {
      const success = await carouselRepository.delete(id);
      return this.ok(success);
    } catch (error) {
      console.error('[AdminCarouselService] delete error:', error);
      return this.fail('删除轮播图失败');
    }
  }
}

// ==================== 童心教育管理服务 ====================

export class AdminPhilosophyService extends BaseService {
  /** 获取板块列表 */
  async getCategories(includeInactive: boolean = false, limit: number = 50): Promise<ServiceResult<ChildHeartPathRecord[]>> {
    try {
      const data = await childHeartPathRepository.findAllForAdmin(includeInactive, limit);
      return this.ok(data);
    } catch (error) {
      console.error('[AdminPhilosophyService] getCategories error:', error);
      return this.fail('获取板块数据失败');
    }
  }

  /** 创建板块 */
  async createCategory(data: Partial<ChildHeartPathRecord>): Promise<ServiceResult<ChildHeartPathRecord>> {
    try {
      const record = await childHeartPathRepository.create({
        ...data,
        is_active: data.is_active ?? true,
        sort_order: data.sort_order || 0,
      });
      if (!record) {
        return this.fail('创建板块失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[AdminPhilosophyService] createCategory error:', error);
      return this.fail('创建板块失败');
    }
  }

  /** 更新板块 */
  async updateCategory(id: string, data: Partial<ChildHeartPathRecord>): Promise<ServiceResult<ChildHeartPathRecord>> {
    try {
      const record = await childHeartPathRepository.update(id, data);
      if (!record) {
        return this.fail('更新板块失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[AdminPhilosophyService] updateCategory error:', error);
      return this.fail('更新板块失败');
    }
  }

  /** 删除板块（同时删除关联活动） */
  async deleteCategory(id: string): Promise<ServiceResult<boolean>> {
    try {
      // 先删除关联活动
      await philosophyActivityRepository.deleteWhere({ category_id: id });
      // 再删除板块
      const success = await childHeartPathRepository.delete(id);
      return this.ok(success);
    } catch (error) {
      console.error('[AdminPhilosophyService] deleteCategory error:', error);
      return this.fail('删除板块失败');
    }
  }

  /** 获取活动列表 */
  async getActivities(categoryId: string, includeInactive: boolean = false, limit: number = 50): Promise<ServiceResult<PhilosophyActivityRecord[]>> {
    try {
      const data = await philosophyActivityRepository.findByCategoryForAdmin(categoryId, includeInactive, limit);
      return this.ok(data);
    } catch (error) {
      console.error('[AdminPhilosophyService] getActivities error:', error);
      return this.fail('获取活动数据失败');
    }
  }

  /** 创建活动 */
  async createActivity(data: Partial<PhilosophyActivityRecord>): Promise<ServiceResult<PhilosophyActivityRecord>> {
    try {
      const record = await philosophyActivityRepository.create({
        ...data,
        is_active: data.is_active ?? true,
        sort_order: data.sort_order || 0,
      });
      if (!record) {
        return this.fail('创建活动失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[AdminPhilosophyService] createActivity error:', error);
      return this.fail('创建活动失败');
    }
  }

  /** 更新活动 */
  async updateActivity(id: string, data: Partial<PhilosophyActivityRecord>): Promise<ServiceResult<PhilosophyActivityRecord>> {
    try {
      const record = await philosophyActivityRepository.update(id, data);
      if (!record) {
        return this.fail('更新活动失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[AdminPhilosophyService] updateActivity error:', error);
      return this.fail('更新活动失败');
    }
  }

  /** 删除活动 */
  async deleteActivity(id: string): Promise<ServiceResult<boolean>> {
    try {
      const success = await philosophyActivityRepository.delete(id);
      return this.ok(success);
    } catch (error) {
      console.error('[AdminPhilosophyService] deleteActivity error:', error);
      return this.fail('删除活动失败');
    }
  }
}

// ==================== 公告新闻管理服务 ====================

export class AdminAnnouncementService extends BaseService {
  /** 获取公告列表 */
  async getList(params: { type?: string; category?: string; limit?: number }): Promise<ServiceResult<any[]>> {
    try {
      const data = await announcementRepository.findAllForAdmin(params);
      // 将数据库字段（下划线命名）映射为前端字段（驼峰命名）
      const mappedData = data.map(item => ({
        id: item.id,
        title: item.title,
        summary: item.summary,
        content: item.content,
        type: item.type,
        category: item.category,
        mediaLevel: item.media_level,
        department: item.department,
        coverImage: item.cover_image,
        publishStatus: item.status === 'published' ? 'published' : 'pending',
        publishedAt: item.published_at,
        isPinned: item.is_pinned ?? false,
        pinOrder: item.pin_order ?? 0,
        viewCount: item.view_count ?? 0,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));
      return this.ok(mappedData);
    } catch (error) {
      console.error('[AdminAnnouncementService] getList error:', error);
      return this.fail('获取公告数据失败');
    }
  }

  /** 创建公告 */
  async create(data: Record<string, any>): Promise<ServiceResult<AnnouncementRecord>> {
    try {
      const now = new Date().toISOString();
      
      // 发布状态映射：前端 publishStatus -> 数据库 status
      const statusMap: Record<string, string> = {
        pending: 'draft',
        scheduled: 'draft',
        published: 'published',
        unpublished: 'draft',
      };
      const dbStatus = statusMap[data.publishStatus] || 'draft';
      
      // 生成 UUID（如果数据库没有自动生成）
      const { randomUUID } = await import('crypto');
      const id = randomUUID();
      
      // 将前端字段（驼峰命名）映射为数据库字段（下划线命名）
      const insertData: Record<string, any> = {
        id,
        title: data.title,
        content: data.content || '',
        type: data.type || 'announcement',
        category: data.category || null,
        status: dbStatus,
        published_at: data.publishStatus === 'published' ? (data.publishedAt || now) : null,
        summary: data.summary || null,
        media_level: data.mediaLevel || null,
        department: data.department || null,
        cover_image: data.coverImage || null,
        is_pinned: data.isPinned ?? false,
        pin_order: data.pinOrder ?? 0,
      };

      const record = await announcementRepository.create(insertData);
      if (!record) {
        return this.fail('创建公告失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[AdminAnnouncementService] create error:', error);
      return this.fail('创建公告失败');
    }
  }

  /** 更新公告 */
  async update(id: string, data: Record<string, any>): Promise<ServiceResult<AnnouncementRecord>> {
    try {
      const updateData: Record<string, any> = {};

      // 基础字段映射（驼峰 -> 下划线）
      if (data.title !== undefined) updateData.title = data.title;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.summary !== undefined) updateData.summary = data.summary;
      if (data.department !== undefined) updateData.department = data.department;
      
      // 特殊字段映射（驼峰 -> 下划线）
      if (data.mediaLevel !== undefined) updateData.media_level = data.mediaLevel;
      if (data.coverImage !== undefined) updateData.cover_image = data.coverImage;
      if (data.isPinned !== undefined) updateData.is_pinned = data.isPinned;
      if (data.pinOrder !== undefined) updateData.pin_order = data.pinOrder;

      // 发布状态处理：映射前端 publishStatus 到数据库 status
      if (data.publishStatus !== undefined) {
        // 前端: pending/scheduled/published/unpublished -> 数据库: draft/published
        const statusMap: Record<string, string> = {
          pending: 'draft',
          scheduled: 'draft',
          published: 'published',
          unpublished: 'draft',
        };
        updateData.status = statusMap[data.publishStatus] || 'draft';
        
        // 发布时设置发布时间
        if (data.publishStatus === 'published') {
          updateData.published_at = data.publishedAt || new Date().toISOString();
        }
      }

      const record = await announcementRepository.update(id, updateData);
      if (!record) {
        return this.fail('更新公告失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[AdminAnnouncementService] update error:', error);
      return this.fail('更新公告失败');
    }
  }

  /** 删除公告 */
  async delete(id: string): Promise<ServiceResult<boolean>> {
    try {
      const success = await announcementRepository.delete(id);
      return this.ok(success);
    } catch (error) {
      console.error('[AdminAnnouncementService] delete error:', error);
      return this.fail('删除公告失败');
    }
  }
}

// ==================== 成果管理服务 ====================

export class AdminAchievementService extends BaseService {
  /** 获取成果分类列表 */
  async getCategories(includeInactive: boolean = false): Promise<ServiceResult<any[]>> {
    try {
      const data = await achievementRepository.findAllCategories(includeInactive);
      return this.ok(data);
    } catch (error) {
      console.error('[AdminAchievementService] getCategories error:', error);
      return this.fail('获取分类数据失败');
    }
  }

  /** 创建成果分类 */
  async createCategory(data: Record<string, any>): Promise<ServiceResult<any>> {
    try {
      const record = await achievementRepository.createCategory(data);
      if (!record) {
        return this.fail('创建分类失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[AdminAchievementService] createCategory error:', error);
      return this.fail('创建分类失败');
    }
  }

  /** 更新成果分类 */
  async updateCategory(id: string, data: Record<string, any>): Promise<ServiceResult<any>> {
    try {
      const updateData: Record<string, any> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.slug !== undefined) updateData.slug = data.slug;
      if (data.icon !== undefined) updateData.icon = data.icon;
      if (data.tag !== undefined) updateData.tag = data.tag;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;

      const record = await achievementRepository.updateCategory(id, updateData);
      if (!record) {
        return this.fail('更新分类失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[AdminAchievementService] updateCategory error:', error);
      return this.fail('更新分类失败');
    }
  }

  /** 删除成果分类 */
  async deleteCategory(id: string): Promise<ServiceResult<boolean>> {
    try {
      const success = await achievementRepository.deleteCategory(id);
      return this.ok(success);
    } catch (error) {
      console.error('[AdminAchievementService] deleteCategory error:', error);
      return this.fail('删除分类失败');
    }
  }

  /** 获取成果列表 */
  async getItems(categoryId?: string, includeInactive: boolean = false, limit: number = 50): Promise<ServiceResult<any[]>> {
    try {
      const data = await achievementRepository.findAllWithCategory(categoryId, includeInactive, limit);
      return this.ok(data);
    } catch (error) {
      console.error('[AdminAchievementService] getItems error:', error);
      return this.fail('获取成果数据失败');
    }
  }

  /** 创建成果 */
  async createItem(data: Partial<AchievementRecord>): Promise<ServiceResult<AchievementRecord>> {
    try {
      const record = await achievementRepository.create({
        ...data,
        is_active: data.is_active ?? true,
        sort_order: data.sort_order || 0,
      });
      if (!record) {
        return this.fail('创建成果失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[AdminAchievementService] createItem error:', error);
      return this.fail('创建成果失败');
    }
  }

  /** 更新成果 */
  async updateItem(id: string, data: Partial<AchievementRecord>): Promise<ServiceResult<AchievementRecord>> {
    try {
      const record = await achievementRepository.update(id, data);
      if (!record) {
        return this.fail('更新成果失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[AdminAchievementService] updateItem error:', error);
      return this.fail('更新成果失败');
    }
  }

  /** 删除成果 */
  async deleteItem(id: string): Promise<ServiceResult<boolean>> {
    try {
      const success = await achievementRepository.delete(id);
      return this.ok(success);
    } catch (error) {
      console.error('[AdminAchievementService] deleteItem error:', error);
      return this.fail('删除成果失败');
    }
  }
}

// 导出单例
export const adminCarouselService = new AdminCarouselService();
export const adminPhilosophyService = new AdminPhilosophyService();
export const adminAnnouncementService = new AdminAnnouncementService();
export const adminAchievementService = new AdminAchievementService();
