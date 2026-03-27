/**
 * 教研活动 Service
 * 
 * 提供教研活动业务逻辑处理
 * 
 * ⚠️ 架构原则：
 * - 通过 DI 容器获取 Repository，不直接 import 具体实现
 * - Service 层只依赖 Repository 接口，遵循依赖倒置原则
 * 
 * @module services/research.service
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import type {
  IResearchActivityRepository,
  IResearchStageRepository,
  IResearchAchievementRepository,
  IResearchResourceRepository,
  ResearchQueryOptions,
} from '@/types/repository';
import type {
  ResearchActivity,
  ResearchStage,
  ResearchAchievement,
  ResearchResource,
  ActivityStatus,
} from '@/types/research';

/**
 * 教研活动 Service
 */
export class ResearchActivityService extends BaseService {
  /**
   * 获取教研活动 Repository（通过 DI 容器）
   */
  private get researchActivityRepository(): IResearchActivityRepository {
    return getService(SERVICE_IDENTIFIERS.ResearchActivityRepository);
  }

  /**
   * 获取教研阶段 Repository（通过 DI 容器）
   */
  private get researchStageRepository(): IResearchStageRepository {
    return getService(SERVICE_IDENTIFIERS.ResearchStageRepository);
  }

  /**
   * 获取分页列表
   */
  async getPaginated(options: ResearchQueryOptions = {}): Promise<PaginatedServiceResult<ResearchActivity>> {
    try {
      const result = await this.researchActivityRepository.findPaginated(options);
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
    const activity = await this.researchActivityRepository.findById(id);
    if (!activity) {
      return this.fail('教研活动不存在', 'NOT_FOUND');
    }
    return this.ok(activity);
  }

  /**
   * 获取详情（含阶段）
   */
  async getDetail(id: string): Promise<ServiceResult<ResearchActivity & { stages?: ResearchStage[] }>> {
    const activity = await this.researchActivityRepository.findById(id);
    if (!activity) {
      return this.fail('教研活动不存在', 'NOT_FOUND');
    }

    const stages = await this.researchStageRepository.findByActivity(id);
    return this.ok({ ...activity, stages });
  }

  /**
   * 创建活动
   */
  async create(data: Partial<ResearchActivity>): Promise<ServiceResult<ResearchActivity>> {
    if (!data.title || !data.type) {
      return this.fail('活动标题和类型不能为空', 'VALIDATION_ERROR');
    }

    const activity = await this.researchActivityRepository.create({
      ...data,
      status: (data.status || 'scheduled') as ActivityStatus,
    });

    if (!activity) {
      return this.fail('创建教研活动失败', 'CREATE_ERROR');
    }

    return this.ok(activity);
  }

  /**
   * 更新活动
   */
  async update(id: string, data: Partial<ResearchActivity>): Promise<ServiceResult<ResearchActivity>> {
    const existing = await this.researchActivityRepository.findById(id);
    if (!existing) {
      return this.fail('教研活动不存在', 'NOT_FOUND');
    }

    const activity = await this.researchActivityRepository.update(id, data);
    if (!activity) {
      return this.fail('更新教研活动失败', 'UPDATE_ERROR');
    }

    return this.ok(activity);
  }

  /**
   * 更新状态
   */
  async updateStatus(id: string, status: ActivityStatus): Promise<ServiceResult<ResearchActivity>> {
    return this.update(id, { status });
  }

  /**
   * 开始活动
   */
  async start(id: string): Promise<ServiceResult<ResearchActivity>> {
    return this.updateStatus(id, 'in_progress');
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
    const existing = await this.researchActivityRepository.findById(id);
    if (!existing) {
      return this.fail('教研活动不存在', 'NOT_FOUND');
    }

    if (existing.status === 'in_progress') {
      return this.fail('进行中的活动不能删除', 'INVALID_STATUS');
    }

    const success = await this.researchActivityRepository.delete(id);
    if (!success) {
      return this.fail('删除教研活动失败', 'DELETE_ERROR');
    }

    return this.ok();
  }

  /**
   * 获取进行中的活动
   */
  async getOngoing(): Promise<ServiceResult<ResearchActivity[]>> {
    const activities = await this.researchActivityRepository.findOngoing();
    return this.ok(activities);
  }
}

/**
 * 教研阶段 Service
 */
export class ResearchStageService extends BaseService {
  /**
   * 获取教研阶段 Repository（通过 DI 容器）
   */
  private get researchStageRepository(): IResearchStageRepository {
    return getService(SERVICE_IDENTIFIERS.ResearchStageRepository);
  }

  /**
   * 根据活动ID获取阶段列表
   */
  async getByActivity(activityId: string): Promise<ServiceResult<ResearchStage[]>> {
    const stages = await this.researchStageRepository.findByActivity(activityId);
    return this.ok(stages);
  }

  /**
   * 创建阶段
   */
  async create(data: Partial<ResearchStage>): Promise<ServiceResult<ResearchStage>> {
    if (!data.themeId || !data.name) {
      return this.fail('主题ID和阶段名称不能为空', 'VALIDATION_ERROR');
    }

    const stage = await this.researchStageRepository.create(data);
    if (!stage) {
      return this.fail('创建阶段失败', 'CREATE_ERROR');
    }

    return this.ok(stage);
  }

  /**
   * 更新阶段
   */
  async update(id: string, data: Partial<ResearchStage>): Promise<ServiceResult<ResearchStage>> {
    const stage = await this.researchStageRepository.update(id, data);
    if (!stage) {
      return this.fail('更新阶段失败', 'UPDATE_ERROR');
    }
    return this.ok(stage);
  }

  /**
   * 删除阶段
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    const success = await this.researchStageRepository.delete(id);
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
   * 获取教研成果 Repository（通过 DI 容器）
   */
  private get researchAchievementRepository(): IResearchAchievementRepository {
    return getService(SERVICE_IDENTIFIERS.ResearchAchievementRepository);
  }

  /**
   * 根据活动获取成果
   */
  async getByActivity(activityId: string): Promise<ServiceResult<ResearchAchievement[]>> {
    const achievements = await this.researchAchievementRepository.findByActivity(activityId);
    return this.ok(achievements);
  }

  /**
   * 创建成果
   */
  async create(data: Partial<ResearchAchievement>): Promise<ServiceResult<ResearchAchievement>> {
    if (!data.title || !data.type || !data.authorIds?.length) {
      return this.fail('成果标题、类型和作者不能为空', 'VALIDATION_ERROR');
    }

    const achievement = await this.researchAchievementRepository.create({
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
  async update(id: string, data: Partial<ResearchAchievement>): Promise<ServiceResult<ResearchAchievement>> {
    const achievement = await this.researchAchievementRepository.update(id, data);
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
   * 获取教研资源 Repository（通过 DI 容器）
   */
  private get researchResourceRepository(): IResearchResourceRepository {
    return getService(SERVICE_IDENTIFIERS.ResearchResourceRepository);
  }

  /**
   * 获取分页列表
   */
  async getPaginated(
    options: { pagination?: { page?: number; pageSize?: number }; filters?: { subject?: string } } = {}
  ): Promise<PaginatedServiceResult<ResearchResource>> {
    try {
      const result = await this.researchResourceRepository.findPaginated({
        pagination: options.pagination ? {
          page: options.pagination.page || 1,
          pageSize: options.pagination.pageSize || 20,
        } : undefined,
        filters: options.filters,
      });
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
    const resource = await this.researchResourceRepository.findById(id);
    if (!resource) {
      return this.fail('资源不存在', 'NOT_FOUND');
    }
    return this.ok(resource);
  }

  /**
   * 创建资源
   */
  async create(data: Partial<ResearchResource>): Promise<ServiceResult<ResearchResource>> {
    if (!data.title || !data.type || !data.fileUrl) {
      return this.fail('资源标题、类型和文件不能为空', 'VALIDATION_ERROR');
    }

    const resource = await this.researchResourceRepository.create({
      ...data,
      downloadCount: 0,
      viewCount: 0,
      isActive: true,
    });

    if (!resource) {
      return this.fail('创建资源失败', 'CREATE_ERROR');
    }

    return this.ok(resource);
  }

  /**
   * 更新资源
   */
  async update(id: string, data: Partial<ResearchResource>): Promise<ServiceResult<ResearchResource>> {
    const resource = await this.researchResourceRepository.update(id, data);
    if (!resource) {
      return this.fail('更新资源失败', 'UPDATE_ERROR');
    }
    return this.ok(resource);
  }

  /**
   * 删除资源
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    const success = await this.researchResourceRepository.delete(id);
    if (!success) {
      return this.fail('删除资源失败', 'DELETE_ERROR');
    }
    return this.ok();
  }
}

// 导出单例
export const researchActivityService = new ResearchActivityService();
export const researchStageService = new ResearchStageService();
export const researchAchievementService = new ResearchAchievementService();
export const researchResourceService = new ResearchResourceService();
