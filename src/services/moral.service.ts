/**
 * 德育活动 Service
 * 
 * 提供德育活动业务逻辑处理
 * 
 * ⚠️ 架构原则：
 * - 通过 DI 容器获取 Repository，不直接 import 具体实现
 * - Service 层只依赖 Repository 接口，遵循依赖倒置原则
 * 
 * @module services/moral.service
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import type { IMoralActivityRepository, IMoralActivitySubmissionRepository, MoralQueryOptions } from '@/types/repository';
import type { MoralActivity, MoralActivitySubmission, MoralActivityStatus, MoralActivityType } from '@/types/moral';

/**
 * 德育活动 Service 类
 */
export class MoralActivityService extends BaseService {
  /**
   * 获取德育活动 Repository（通过 DI 容器）
   */
  private get moralActivityRepository(): IMoralActivityRepository {
    return getService(SERVICE_IDENTIFIERS.MoralActivityRepository);
  }

  /**
   * 获取活动列表
   */
  async getList(options: MoralQueryOptions = {}): Promise<ServiceResult<MoralActivity[]>> {
    try {
      const filters = options.filters || {};
      if (filters.organizerId) {
        const activities = await this.moralActivityRepository.findByOrganizer(filters.organizerId as string);
        return this.ok(activities);
      }
      if (filters.type) {
        const activities = await this.moralActivityRepository.findByType(filters.type as string);
        return this.ok(activities);
      }
      const activities = await this.moralActivityRepository.findAll();
      return this.ok(activities);
    } catch (error) {
      return this.fail('获取德育活动列表失败', 'FETCH_ERROR');
    }
  }

  /**
   * 获取分页活动列表
   */
  async getPaginated(options: MoralQueryOptions = {}): Promise<PaginatedServiceResult<MoralActivity>> {
    try {
      const result = await this.moralActivityRepository.findPaginated(options);
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
      return {
        success: false,
        error: '获取德育活动列表失败',
      };
    }
  }

  /**
   * 根据ID获取活动
   */
  async getById(id: string): Promise<ServiceResult<MoralActivity>> {
    const activity = await this.moralActivityRepository.findById(id);
    if (!activity) {
      return this.fail('德育活动不存在', 'NOT_FOUND');
    }
    return this.ok(activity);
  }

  /**
   * 创建活动
   */
  async create(data: Partial<MoralActivity>): Promise<ServiceResult<MoralActivity>> {
    if (!data.title || !data.organizerId) {
      return this.fail('活动标题和组织者不能为空', 'VALIDATION_ERROR');
    }

    const activity = await this.moralActivityRepository.create({
      ...data,
      status: (data.status || 'planned') as MoralActivityStatus,
    });

    if (!activity) {
      return this.fail('创建德育活动失败', 'CREATE_ERROR');
    }

    return this.ok(activity);
  }

  /**
   * 更新活动
   */
  async update(id: string, data: Partial<MoralActivity>): Promise<ServiceResult<MoralActivity>> {
    const existing = await this.moralActivityRepository.findById(id);
    if (!existing) {
      return this.fail('德育活动不存在', 'NOT_FOUND');
    }

    const activity = await this.moralActivityRepository.update(id, data);
    if (!activity) {
      return this.fail('更新德育活动失败', 'UPDATE_ERROR');
    }

    return this.ok(activity);
  }

  /**
   * 发布活动
   */
  async publish(id: string): Promise<ServiceResult<MoralActivity>> {
    return this.updateStatus(id, 'ongoing');
  }

  /**
   * 关闭活动
   */
  async close(id: string): Promise<ServiceResult<MoralActivity>> {
    return this.updateStatus(id, 'completed');
  }

  /**
   * 取消活动
   */
  async cancel(id: string): Promise<ServiceResult<MoralActivity>> {
    return this.updateStatus(id, 'cancelled');
  }

  /**
   * 更新活动状态
   */
  private async updateStatus(id: string, status: MoralActivityStatus): Promise<ServiceResult<MoralActivity>> {
    const existing = await this.moralActivityRepository.findById(id);
    if (!existing) {
      return this.fail('德育活动不存在', 'NOT_FOUND');
    }

    const activity = await this.moralActivityRepository.update(id, { status } as Partial<MoralActivity>);
    if (!activity) {
      return this.fail('更新活动状态失败', 'UPDATE_ERROR');
    }

    return this.ok(activity);
  }

  /**
   * 删除活动
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    const existing = await this.moralActivityRepository.findById(id);
    if (!existing) {
      return this.fail('德育活动不存在', 'NOT_FOUND');
    }

    if (existing.status === 'ongoing') {
      return this.fail('进行中的活动不能删除', 'INVALID_STATUS');
    }

    const success = await this.moralActivityRepository.delete(id);
    if (!success) {
      return this.fail('删除德育活动失败', 'DELETE_ERROR');
    }

    return this.ok();
  }
}

/**
 * 德育活动提交 Service 类
 */
export class MoralActivitySubmissionService extends BaseService {
  /**
   * 获取提交 Repository（通过 DI 容器）
   */
  private get moralActivitySubmissionRepository(): IMoralActivitySubmissionRepository {
    return getService(SERVICE_IDENTIFIERS.MoralActivitySubmissionRepository);
  }

  /**
   * 根据活动ID获取提交
   */
  async getByActivity(activityId: string): Promise<ServiceResult<MoralActivitySubmission[]>> {
    const submissions = await this.moralActivitySubmissionRepository.findByActivity(activityId);
    return this.ok(submissions);
  }

  /**
   * 根据学生ID获取提交
   */
  async getByStudent(studentId: string): Promise<ServiceResult<MoralActivitySubmission[]>> {
    const submissions = await this.moralActivitySubmissionRepository.findByStudent(studentId);
    return this.ok(submissions);
  }

  /**
   * 提交活动
   */
  async submit(
    activityId: string,
    studentId: string,
    data: { content?: string; attachments?: string[] }
  ): Promise<ServiceResult<MoralActivitySubmission>> {
    const submission = await this.moralActivitySubmissionRepository.create({
      activityId,
      studentId,
      content: data.content,
      attachments: data.attachments,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    } as Partial<MoralActivitySubmission>);

    if (!submission) {
      return this.fail('提交失败', 'SUBMIT_ERROR');
    }

    return this.ok(submission);
  }
}

// 导出单例
export const moralActivityService = new MoralActivityService();
export const moralActivitySubmissionService = new MoralActivitySubmissionService();
