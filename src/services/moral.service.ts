/**
 * 德育活动 Service
 * 
 * 提供德育活动业务逻辑处理
 * 
 * @module services/moral.service
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import {
  moralActivityRepository,
  moralActivitySubmissionRepository,
  MoralQueryOptions,
  MoralActivity,
  MoralActivitySubmission,
  MoralActivityStatus,
} from '@/repositories/moral.repository';

/**
 * 德育活动 Service
 */
export class MoralActivityService extends BaseService {
  /**
   * 获取分页列表
   */
  async getPaginated(
    options: MoralQueryOptions = {}
  ): Promise<PaginatedServiceResult<MoralActivity>> {
    try {
      const result = await moralActivityRepository.findPaginated(options);
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
      return { success: false, error: '获取德育活动列表失败' };
    }
  }

  /**
   * 根据ID获取详情
   */
  async getById(id: string): Promise<ServiceResult<MoralActivity>> {
    const activity = await moralActivityRepository.findById(id);
    if (!activity) {
      return this.fail('德育活动不存在', 'NOT_FOUND');
    }
    return this.ok(activity);
  }

  /**
   * 获取详情（含提交统计）
   */
  async getDetail(
    id: string
  ): Promise<
    ServiceResult<MoralActivity & { submissionStats?: { total: number; pending: number; approved: number; rejected: number } }>
  > {
    const activity = await moralActivityRepository.findById(id);
    if (!activity) {
      return this.fail('德育活动不存在', 'NOT_FOUND');
    }

    const submissionStats = await moralActivitySubmissionRepository.getActivitySubmissionStats(id);
    return this.ok({ ...activity, submissionStats });
  }

  /**
   * 创建活动
   */
  async create(data: Partial<MoralActivity>): Promise<ServiceResult<MoralActivity>> {
    if (!data.title || !data.type) {
      return this.fail('活动标题和类型不能为空', 'VALIDATION_ERROR');
    }

    const activity = await moralActivityRepository.create({
      ...data,
      status: data.status || 'planned',
    });

    if (!activity) {
      return this.fail('创建德育活动失败', 'CREATE_ERROR');
    }

    return this.ok(activity);
  }

  /**
   * 更新活动
   */
  async update(
    id: string,
    data: Partial<MoralActivity>
  ): Promise<ServiceResult<MoralActivity>> {
    const existing = await moralActivityRepository.findById(id);
    if (!existing) {
      return this.fail('德育活动不存在', 'NOT_FOUND');
    }

    const activity = await moralActivityRepository.update(id, data);
    if (!activity) {
      return this.fail('更新德育活动失败', 'UPDATE_ERROR');
    }

    return this.ok(activity);
  }

  /**
   * 更新状态
   */
  async updateStatus(
    id: string,
    status: MoralActivityStatus
  ): Promise<ServiceResult<MoralActivity>> {
    return this.update(id, { status });
  }

  /**
   * 开始活动
   */
  async start(id: string): Promise<ServiceResult<MoralActivity>> {
    return this.updateStatus(id, 'ongoing');
  }

  /**
   * 完成活动
   */
  async complete(id: string): Promise<ServiceResult<MoralActivity>> {
    return this.updateStatus(id, 'completed');
  }

  /**
   * 取消活动
   */
  async cancel(id: string): Promise<ServiceResult<MoralActivity>> {
    return this.updateStatus(id, 'cancelled');
  }

  /**
   * 删除活动
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    const existing = await moralActivityRepository.findById(id);
    if (!existing) {
      return this.fail('德育活动不存在', 'NOT_FOUND');
    }

    if (existing.status === 'ongoing') {
      return this.fail('进行中的活动不能删除', 'INVALID_STATUS');
    }

    const success = await moralActivityRepository.delete(id);
    if (!success) {
      return this.fail('删除德育活动失败', 'DELETE_ERROR');
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
      thisMonth: number;
    }>
  > {
    const stats = await moralActivityRepository.getStatistics();
    return this.ok(stats);
  }

  /**
   * 获取最近活动
   */
  async getRecent(limit: number = 10): Promise<ServiceResult<MoralActivity[]>> {
    const activities = await moralActivityRepository.findRecent(limit);
    return this.ok(activities);
  }
}

/**
 * 德育活动提交 Service
 */
export class MoralActivitySubmissionService extends BaseService {
  /**
   * 根据活动ID获取提交列表
   */
  async getByActivity(activityId: string): Promise<ServiceResult<MoralActivitySubmission[]>> {
    const submissions = await moralActivitySubmissionRepository.findByActivity(activityId);
    return this.ok(submissions);
  }

  /**
   * 根据班级ID获取提交列表
   */
  async getByClass(classId: string): Promise<ServiceResult<MoralActivitySubmission[]>> {
    const submissions = await moralActivitySubmissionRepository.findByClass(classId);
    return this.ok(submissions);
  }

  /**
   * 提交活动材料
   */
  async submit(
    activityId: string,
    classId: string,
    className: string,
    submitterId: string,
    submitterName: string,
    data: { content?: string; images?: string[]; attachments?: string[] }
  ): Promise<ServiceResult<MoralActivitySubmission>> {
    // 检查活动是否存在
    const activity = await moralActivityRepository.findById(activityId);
    if (!activity) {
      return this.fail('德育活动不存在', 'NOT_FOUND');
    }

    // 检查活动状态
    if (activity.status !== 'ongoing') {
      return this.fail('活动未开始或已结束', 'INVALID_STATUS');
    }

    const submission = await moralActivitySubmissionRepository.create({
      activityId,
      classId,
      className,
      submitterId,
      submitterName,
      content: data.content,
      images: data.images,
      attachments: data.attachments,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    } as any);

    if (!submission) {
      return this.fail('提交失败', 'SUBMIT_ERROR');
    }

    return this.ok(submission);
  }

  /**
   * 审核提交
   */
  async review(
    submissionId: string,
    status: 'approved' | 'rejected',
    reviewComments: string,
    reviewerId: string
  ): Promise<ServiceResult<MoralActivitySubmission>> {
    const submission = await moralActivitySubmissionRepository.findById(submissionId);
    if (!submission) {
      return this.fail('提交记录不存在', 'NOT_FOUND');
    }

    const updated = await moralActivitySubmissionRepository.update(submissionId, {
      status,
      reviewComments: reviewComments,
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewerId,
    } as any);

    if (!updated) {
      return this.fail('审核失败', 'REVIEW_ERROR');
    }

    return this.ok(updated);
  }

  /**
   * 评分
   */
  async grade(
    submissionId: string,
    score: number,
    reviewerId: string
  ): Promise<ServiceResult<MoralActivitySubmission>> {
    const submission = await moralActivitySubmissionRepository.findById(submissionId);
    if (!submission) {
      return this.fail('提交记录不存在', 'NOT_FOUND');
    }

    if (submission.status !== 'approved') {
      return this.fail('只能对已通过的提交评分', 'INVALID_STATUS');
    }

    const updated = await moralActivitySubmissionRepository.update(submissionId, {
      score,
      reviewedBy: reviewerId,
    } as any);

    if (!updated) {
      return this.fail('评分失败', 'GRADE_ERROR');
    }

    return this.ok(updated);
  }

  /**
   * 获取活动提交统计
   */
  async getActivitySubmissionStats(
    activityId: string
  ): Promise<
    ServiceResult<{ total: number; pending: number; approved: number; rejected: number }>
  > {
    const stats = await moralActivitySubmissionRepository.getActivitySubmissionStats(activityId);
    return this.ok(stats);
  }
}

// 导出单例
export const moralActivityService = new MoralActivityService();
export const moralActivitySubmissionService = new MoralActivitySubmissionService();
