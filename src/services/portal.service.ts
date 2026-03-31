/**
 * 门户管理服务
 * 
 * 处理轮播图、荣誉、公告、成就等业务逻辑
 */

import { BaseService, ServiceResult } from './base.service';
import {
  carouselRepository,
  schoolHonorRepository,
  announcementRepository,
  achievementRepository,
  CarouselItemRecord,
  SchoolHonorRecord,
  AnnouncementRecord,
  AchievementRecord,
  AnnouncementQueryParams,
  AchievementQueryParams,
} from '@/repositories/portal.repository';

// ==================== 轮播图服务 ====================

export class CarouselService extends BaseService {
  async getList(limit: number = 10): Promise<ServiceResult<CarouselItemRecord[]>> {
    try {
      const data = await carouselRepository.findActive(limit);
      return this.ok(data);
    } catch (error) {
      console.error('[CarouselService] getList error:', error);
      return this.fail('获取轮播图数据失败');
    }
  }

  async create(data: Partial<CarouselItemRecord>): Promise<ServiceResult<CarouselItemRecord>> {
    try {
      const record = await carouselRepository.create({
        ...data,
        id: data.id || `carousel-${Date.now()}`,
        is_active: true,
        sort_order: data.sort_order || 0,
      });
      if (!record) {
        return this.fail('创建轮播图失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[CarouselService] create error:', error);
      return this.fail('创建轮播图失败');
    }
  }

  async update(id: string, data: Partial<CarouselItemRecord>): Promise<ServiceResult<CarouselItemRecord>> {
    try {
      const record = await carouselRepository.update(id, data);
      if (!record) {
        return this.fail('更新轮播图失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[CarouselService] update error:', error);
      return this.fail('更新轮播图失败');
    }
  }

  async delete(id: string): Promise<ServiceResult<boolean>> {
    try {
      const success = await carouselRepository.delete(id);
      return this.ok(success);
    } catch (error) {
      console.error('[CarouselService] delete error:', error);
      return this.fail('删除轮播图失败');
    }
  }
}

// ==================== 办学荣誉服务 ====================

export class SchoolHonorService extends BaseService {
  async getList(limit: number = 10): Promise<ServiceResult<SchoolHonorRecord[]>> {
    try {
      const data = await schoolHonorRepository.findActive(limit);
      return this.ok(data);
    } catch (error) {
      console.error('[SchoolHonorService] getList error:', error);
      return this.fail('获取办学荣誉数据失败');
    }
  }

  async create(data: Partial<SchoolHonorRecord>): Promise<ServiceResult<SchoolHonorRecord>> {
    try {
      const record = await schoolHonorRepository.create({
        ...data,
        id: data.id || `honor-${Date.now()}`,
        is_active: true,
        sort_order: data.sort_order || 0,
      });
      if (!record) {
        return this.fail('创建办学荣誉失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[SchoolHonorService] create error:', error);
      return this.fail('创建办学荣誉失败');
    }
  }
}

// ==================== 公告服务 ====================

export class AnnouncementService extends BaseService {
  async getList(params: AnnouncementQueryParams & { limit?: number }): Promise<ServiceResult<AnnouncementRecord[]>> {
    try {
      const data = await announcementRepository.findPublished(params);
      return this.ok(data);
    } catch (error) {
      console.error('[AnnouncementService] getList error:', error);
      return this.fail('获取公告数据失败');
    }
  }

  async getById(id: string): Promise<ServiceResult<AnnouncementRecord>> {
    try {
      const data = await announcementRepository.findById(id);
      if (!data) {
        return this.fail('公告不存在');
      }
      return this.ok(data);
    } catch (error) {
      console.error('[AnnouncementService] getById error:', error);
      return this.fail('获取公告详情失败');
    }
  }

  async create(data: Partial<AnnouncementRecord>): Promise<ServiceResult<AnnouncementRecord>> {
    try {
      const record = await announcementRepository.create({
        ...data,
        id: data.id || `announcement-${Date.now()}`,
        status: data.status || 'draft',
        view_count: 0,
        sort_order: data.sort_order || 0,
      });
      if (!record) {
        return this.fail('创建公告失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[AnnouncementService] create error:', error);
      return this.fail('创建公告失败');
    }
  }
}

// ==================== 成就服务 ====================

export class AchievementService extends BaseService {
  async getList(params: AchievementQueryParams & { limit?: number }): Promise<ServiceResult<AchievementRecord[]>> {
    try {
      const data = await achievementRepository.findActive(params);
      return this.ok(data);
    } catch (error) {
      console.error('[AchievementService] getList error:', error);
      return this.fail('获取成就数据失败');
    }
  }

  async getById(id: string): Promise<ServiceResult<AchievementRecord>> {
    try {
      const data = await achievementRepository.findById(id);
      if (!data) {
        return this.fail('成就不存在');
      }
      return this.ok(data);
    } catch (error) {
      console.error('[AchievementService] getById error:', error);
      return this.fail('获取成就详情失败');
    }
  }

  async getCategories(): Promise<ServiceResult<string[]>> {
    try {
      const data = await achievementRepository.findCategories();
      return this.ok(data);
    } catch (error) {
      console.error('[AchievementService] getCategories error:', error);
      return this.fail('获取成就分类失败');
    }
  }

  async create(data: Partial<AchievementRecord>): Promise<ServiceResult<AchievementRecord>> {
    try {
      const record = await achievementRepository.create({
        ...data,
        id: data.id || `achievement-${Date.now()}`,
        is_active: true,
        sort_order: data.sort_order || 0,
      });
      if (!record) {
        return this.fail('创建成就失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[AchievementService] create error:', error);
      return this.fail('创建成就失败');
    }
  }
}

// 导出单例
export const carouselService = new CarouselService();
export const schoolHonorService = new SchoolHonorService();
export const announcementService = new AnnouncementService();
export const achievementService = new AchievementService();

// ==================== 童心教育服务 ====================

import {
  ChildHeartPathRepository,
  PhilosophyActivityRepository,
  ChildHeartPathRecord,
  PhilosophyActivityRecord,
} from '@/repositories/portal.repository';

const childHeartPathRepository = new ChildHeartPathRepository();
const philosophyActivityRepository = new PhilosophyActivityRepository();

export class ChildHeartPathService extends BaseService {
  async getList(limit: number = 10): Promise<ServiceResult<ChildHeartPathRecord[]>> {
    try {
      const data = await childHeartPathRepository.findActive(limit);
      return this.ok(data);
    } catch (error) {
      console.error('[ChildHeartPathService] getList error:', error);
      return this.fail('获取童心教育数据失败');
    }
  }
}

export class PhilosophyActivityService extends BaseService {
  async getByCategory(categoryId: string, limit: number = 20): Promise<ServiceResult<{
    category: ChildHeartPathRecord | null;
    activities: PhilosophyActivityRecord[];
  }>> {
    try {
      // 获取板块信息
      const category = await childHeartPathRepository.findById(categoryId);
      
      // 获取活动列表
      const activities = await philosophyActivityRepository.findByCategory(categoryId, limit);
      
      return this.ok({
        category: category && category.is_active ? category : null,
        activities,
      });
    } catch (error) {
      console.error('[PhilosophyActivityService] getByCategory error:', error);
      return this.fail('获取活动内容失败');
    }
  }
}

export const childHeartPathService = new ChildHeartPathService();
export const philosophyActivityService = new PhilosophyActivityService();
