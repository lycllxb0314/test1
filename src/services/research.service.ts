/**
 * 教研活动 Service
 * 
 * 提供教研活动业务逻辑处理
 * 
 * @module services/research.service
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import {
  researchActivityRepository,
  researchStageRepository,
  researchAchievementRepository,
  researchResourceRepository,
  ResearchQueryOptions,
  ResearchActivity,
  ResearchStage,
  ResearchAchievement,
  ResearchResource,
  ResearchStatus,
} from '@/repositories/research.repository';

/**
 * 教研活动 Service
 */
export class ResearchActivityService extends BaseService {
  /**
   * 获取分页列表
   */
  async getPaginated(
    options: ResearchQueryOptions = {}
  ): Promise<PaginatedServiceResult<ResearchActivity>> {
    try {
      const result = await researchActivityRepository.findPaginated(options);
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
      return { success: false, error: '获取教研活动列表失败' };
    }
  }

  /**
   * 根据ID获取详情
   */
  async getById(id: string): Promise<ServiceResult<ResearchActivity>> {
    const activity = await researchActivityRepository.findById(id);
    if (!activity) {
      return this.fail('教研活动不存在', 'NOT_FOUND');
    }
    return this.ok(activity);
  }

  /**
   * 获取详情（含阶段）
   */
  async getDetail(
    id: string
  ): Promise<ServiceResult<ResearchActivity & { stages?: ResearchStage[] }>> {
    const activity = await researchActivityRepository.findById(id);
    if (!activity) {
      return this.fail('教研活动不存在', 'NOT_FOUND');
    }

    const stages = await researchStageRepository.findByActivity(id);
    return this.ok({ ...activity, stages });
  }

  /**
   * 创建活动
   */
  async create(data: Partial<ResearchActivity>): Promise<ServiceResult<ResearchActivity>> {
    if (!data.title || !data.type) {
      return this.fail('活动标题和类型不能为空', 'VALIDATION_ERROR');
    }

    const activity = await researchActivityRepository.create({
      ...data,
      status: data.status || 'planned',
    });

    if (!activity) {
      return this.fail('创建教研活动失败', 'CREATE_ERROR');
    }

    return this.ok(activity);
  }

  /**
   * 更新活动
   */
  async update(
    id: string,
    data: Partial<ResearchActivity>
  ): Promise<ServiceResult<ResearchActivity>> {
    const existing = await researchActivityRepository.findById(id);
    if (!existing) {
      return this.fail('教研活动不存在', 'NOT_FOUND');
    }

    const activity = await researchActivityRepository.update(id, data);
    if (!activity) {
      return this.fail('更新教研活动失败', 'UPDATE_ERROR');
    }

    return this.ok(activity);
  }

  /**
   * 更新状态
   */
  async updateStatus(id: string, status: ResearchStatus): Promise<ServiceResult<ResearchActivity>> {
    return this.update(id, { status });
  }

  /**
   * 开始活动
   */
  async start(id: string): Promise<ServiceResult<ResearchActivity>> {
    return this.updateStatus(id, 'ongoing');
  }

  /**
   * 完成活动
   */
  async complete(id: string): Promise<ServiceResult<ResearchActivity>> {
    return this.updateStatus(id, 'completed');
  }

  /**
   * 取消活动
   */
  async cancel(id: string): Promise<ServiceResult<ResearchActivity>> {
    return this.updateStatus(id, 'cancelled');
  }

  /**
   * 删除活动
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    const existing = await researchActivityRepository.findById(id);
    if (!existing) {
      return this.fail('教研活动不存在', 'NOT_FOUND');
    }

    if (existing.status === 'ongoing') {
      return this.fail('进行中的活动不能删除', 'INVALID_STATUS');
    }

    const success = await researchActivityRepository.delete(id);
    if (!success) {
      return this.fail('删除教研活动失败', 'DELETE_ERROR');
    }

    return this.ok();
  }

  /**
   * 获取统计数据
   */
  async getStatistics(): Promise<
    ServiceResult<{
      total: number;
      byType: Record<string, number>;
      byStatus: Record<string, number>;
    }>
  > {
    const stats = await researchActivityRepository.getStatistics();
    return this.ok(stats);
  }

  /**
   * 获取进行中的活动
   */
  async getOngoing(): Promise<ServiceResult<ResearchActivity[]>> {
    const activities = await researchActivityRepository.findOngoing();
    return this.ok(activities);
  }
}

/**
 * 教研阶段 Service
 */
export class ResearchStageService extends BaseService {
  /**
   * 根据活动ID获取阶段列表
   */
  async getByActivity(activityId: string): Promise<ServiceResult<ResearchStage[]>> {
    const stages = await researchStageRepository.findByActivity(activityId);
    return this.ok(stages);
  }

  /**
   * 创建阶段
   */
  async create(data: Partial<ResearchStage>): Promise<ServiceResult<ResearchStage>> {
    if (!data.activityId || !data.name) {
      return this.fail('活动ID和阶段名称不能为空', 'VALIDATION_ERROR');
    }

    const stage = await researchStageRepository.create(data);
    if (!stage) {
      return this.fail('创建阶段失败', 'CREATE_ERROR');
    }

    return this.ok(stage);
  }

  /**
   * 更新阶段
   */
  async update(id: string, data: Partial<ResearchStage>): Promise<ServiceResult<ResearchStage>> {
    const stage = await researchStageRepository.update(id, data);
    if (!stage) {
      return this.fail('更新阶段失败', 'UPDATE_ERROR');
    }
    return this.ok(stage);
  }

  /**
   * 删除阶段
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    const success = await researchStageRepository.delete(id);
    if (!success) {
      return this.fail('删除阶段失败', 'DELETE_ERROR');
    }
    return this.ok();
  }
}

/**
 * 教研成果 Service
 */
export class ResearchAchievementService extends BaseService {
  /**
   * 根据活动获取成果
   */
  async getByActivity(activityId: string): Promise<ServiceResult<ResearchAchievement[]>> {
    const achievements = await researchAchievementRepository.findByActivity(activityId);
    return this.ok(achievements);
  }

  /**
   * 创建成果
   */
  async create(data: Partial<ResearchAchievement>): Promise<ServiceResult<ResearchAchievement>> {
    if (!data.title || !data.type || !data.authorId) {
      return this.fail('成果标题、类型和作者不能为空', 'VALIDATION_ERROR');
    }

    const achievement = await researchAchievementRepository.create({
      ...data,
      status: data.status || 'draft',
    });

    if (!achievement) {
      return this.fail('创建成果失败', 'CREATE_ERROR');
    }

    return this.ok(achievement);
  }

  /**
   * 更新成果
   */
  async update(
    id: string,
    data: Partial<ResearchAchievement>
  ): Promise<ServiceResult<ResearchAchievement>> {
    const achievement = await researchAchievementRepository.update(id, data);
    if (!achievement) {
      return this.fail('更新成果失败', 'UPDATE_ERROR');
    }
    return this.ok(achievement);
  }
}

/**
 * 教研资源 Service
 */
export class ResearchResourceService extends BaseService {
  /**
   * 获取分页列表
   */
  async getPaginated(
    options: { page?: number; pageSize?: number; subject?: string; keyword?: string } = {}
  ): Promise<PaginatedServiceResult<ResearchResource>> {
    try {
      const queryOptions: any = {
        page: options.page || 1,
        pageSize: options.pageSize || 20,
      };

      if (options.subject) {
        queryOptions.filters = { subject: options.subject };
      }

      if (options.keyword) {
        queryOptions.search = {
          fields: ['title', 'description', 'tags'],
          value: options.keyword,
        };
      }

      const result = await researchResourceRepository.findPaginated(queryOptions);
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
      return { success: false, error: '获取资源列表失败' };
    }
  }

  /**
   * 根据ID获取详情
   */
  async getById(id: string): Promise<ServiceResult<ResearchResource>> {
    const resource = await researchResourceRepository.findById(id);
    if (!resource) {
      return this.fail('资源不存在', 'NOT_FOUND');
    }
    return this.ok(resource);
  }

  /**
   * 创建资源
   */
  async create(data: Partial<ResearchResource>): Promise<ServiceResult<ResearchResource>> {
    if (!data.title || !data.type || !data.authorId || !data.fileUrl) {
      return this.fail('资源标题、类型、作者和文件不能为空', 'VALIDATION_ERROR');
    }

    const resource = await researchResourceRepository.create({
      ...data,
      downloadCount: 0,
      status: data.status || 'draft',
    });

    if (!resource) {
      return this.fail('创建资源失败', 'CREATE_ERROR');
    }

    return this.ok(resource);
  }

  /**
   * 更新资源
   */
  async update(
    id: string,
    data: Partial<ResearchResource>
  ): Promise<ServiceResult<ResearchResource>> {
    const resource = await researchResourceRepository.update(id, data);
    if (!resource) {
      return this.fail('更新资源失败', 'UPDATE_ERROR');
    }
    return this.ok(resource);
  }

  /**
   * 删除资源
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    const success = await researchResourceRepository.delete(id);
    if (!success) {
      return this.fail('删除资源失败', 'DELETE_ERROR');
    }
    return this.ok();
  }

  /**
   * 下载资源（增加下载次数）
   */
  async download(id: string): Promise<ServiceResult<ResearchResource>> {
    const resource = await researchResourceRepository.findById(id);
    if (!resource) {
      return this.fail('资源不存在', 'NOT_FOUND');
    }

    await researchResourceRepository.incrementDownloadCount(id);
    return this.ok(resource);
  }
}

// 导出单例
export const researchActivityService = new ResearchActivityService();
export const researchStageService = new ResearchStageService();
export const researchAchievementService = new ResearchAchievementService();
export const researchResourceService = new ResearchResourceService();
