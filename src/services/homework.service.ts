/**
 * 作业 Service
 * 
 * 提供作业业务逻辑处理
 * 
 * ⚠️ 架构原则：
 * - 通过 DI 容器获取 Repository，不直接 import 具体实现
 * - Service 层只依赖 Repository 接口，遵循依赖倒置原则
 * 
 * @module services/homework.service
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import type { IHomeworkRepository, IHomeworkSubmissionRepository, HomeworkQueryOptions } from '@/lib/di/interfaces';
import type { Homework, HomeworkSubmission, HomeworkStatus, HomeworkStatistics } from '@/types/homework';

/**
 * 作业 Service 类
 */
export class HomeworkService extends BaseService {
  /**
   * 获取作业 Repository（通过 DI 容器）
   */
  private get homeworkRepository(): IHomeworkRepository {
    return getService(SERVICE_IDENTIFIERS.HomeworkRepository);
  }

  /**
   * 获取作业列表
   */
  async getList(options: HomeworkQueryOptions = {}): Promise<ServiceResult<Homework[]>> {
    try {
      const filters = options.filters || {};
      if (filters.classId) {
        const homeworks = await this.homeworkRepository.findByClass(filters.classId as string);
        return this.ok(homeworks);
      }
      if (filters.teacherId) {
        const homeworks = await this.homeworkRepository.findByTeacher(filters.teacherId as string);
        return this.ok(homeworks);
      }
      const homeworks = await this.homeworkRepository.findAll();
      return this.ok(homeworks);
    } catch (error) {
      return this.fail('获取作业列表失败', 'FETCH_ERROR');
    }
  }

  /**
   * 获取分页作业列表
   */
  async getPaginated(options: HomeworkQueryOptions = {}): Promise<PaginatedServiceResult<Homework>> {
    try {
      const result = await this.homeworkRepository.findPaginated(options);
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
        error: '获取作业列表失败',
      };
    }
  }

  /**
   * 根据ID获取作业
   */
  async getById(id: string): Promise<ServiceResult<Homework>> {
    const homework = await this.homeworkRepository.findById(id);
    if (!homework) {
      return this.fail('作业不存在', 'NOT_FOUND');
    }
    return this.ok(homework);
  }

  /**
   * 创建作业
   */
  async create(data: Partial<Homework>): Promise<ServiceResult<Homework>> {
    if (!data.title || !data.classId || !data.teacherId) {
      return this.fail('作业标题、班级和教师不能为空', 'VALIDATION_ERROR');
    }

    const homework = await this.homeworkRepository.create({
      ...data,
      status: data.status || 'draft',
    });

    if (!homework) {
      return this.fail('创建作业失败', 'CREATE_ERROR');
    }

    return this.ok(homework);
  }

  /**
   * 更新作业
   */
  async update(id: string, data: Partial<Homework>): Promise<ServiceResult<Homework>> {
    const existing = await this.homeworkRepository.findById(id);
    if (!existing) {
      return this.fail('作业不存在', 'NOT_FOUND');
    }

    const homework = await this.homeworkRepository.update(id, data);
    if (!homework) {
      return this.fail('更新作业失败', 'UPDATE_ERROR');
    }

    return this.ok(homework);
  }

  /**
   * 发布作业
   */
  async publish(id: string): Promise<ServiceResult<Homework>> {
    return this.updateStatus(id, 'published');
  }

  /**
   * 关闭作业
   */
  async close(id: string): Promise<ServiceResult<Homework>> {
    return this.updateStatus(id, 'closed');
  }

  /**
   * 更新作业状态
   */
  private async updateStatus(id: string, status: HomeworkStatus): Promise<ServiceResult<Homework>> {
    const existing = await this.homeworkRepository.findById(id);
    if (!existing) {
      return this.fail('作业不存在', 'NOT_FOUND');
    }

    const homework = await this.homeworkRepository.update(id, { status } as Partial<Homework>);
    if (!homework) {
      return this.fail('更新作业状态失败', 'UPDATE_ERROR');
    }

    return this.ok(homework);
  }

  /**
   * 删除作业
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    const existing = await this.homeworkRepository.findById(id);
    if (!existing) {
      return this.fail('作业不存在', 'NOT_FOUND');
    }

    if (existing.status !== 'draft') {
      return this.fail('只能删除草稿状态的作业', 'INVALID_STATUS');
    }

    const success = await this.homeworkRepository.delete(id);
    if (!success) {
      return this.fail('删除作业失败', 'DELETE_ERROR');
    }

    return this.ok();
  }
}

/**
 * 作业提交 Service 类
 */
export class HomeworkSubmissionService extends BaseService {
  /**
   * 获取提交 Repository（通过 DI 容器）
   */
  private get homeworkSubmissionRepository(): IHomeworkSubmissionRepository {
    return getService(SERVICE_IDENTIFIERS.HomeworkSubmissionRepository);
  }

  /**
   * 根据作业ID获取提交
   */
  async getByHomework(homeworkId: string): Promise<ServiceResult<HomeworkSubmission[]>> {
    const submissions = await this.homeworkSubmissionRepository.findByHomework(homeworkId);
    return this.ok(submissions);
  }

  /**
   * 根据学生ID获取提交
   */
  async getByStudent(studentId: string): Promise<ServiceResult<HomeworkSubmission[]>> {
    const submissions = await this.homeworkSubmissionRepository.findByStudent(studentId);
    return this.ok(submissions);
  }

  /**
   * 提交作业
   */
  async submit(
    homeworkId: string,
    studentId: string,
    data: { content?: string; attachments?: string[] }
  ): Promise<ServiceResult<HomeworkSubmission>> {
    const submission = await this.homeworkSubmissionRepository.create({
      homeworkId,
      studentId,
      content: data.content,
      attachments: data.attachments,
      submittedAt: new Date().toISOString(),
      status: 'submitted',
    } as Partial<HomeworkSubmission>);

    if (!submission) {
      return this.fail('提交作业失败', 'SUBMIT_ERROR');
    }

    return this.ok(submission);
  }

  /**
   * 评分
   */
  async grade(
    submissionId: string,
    score: number,
    feedback: string
  ): Promise<ServiceResult<HomeworkSubmission>> {
    const submission = await this.homeworkSubmissionRepository.findById(submissionId);
    if (!submission) {
      return this.fail('提交记录不存在', 'NOT_FOUND');
    }

    const updated = await this.homeworkSubmissionRepository.update(submissionId, {
      score,
      feedback,
      status: 'graded',
      gradedAt: new Date().toISOString(),
    } as Partial<HomeworkSubmission>);

    if (!updated) {
      return this.fail('评分失败', 'GRADE_ERROR');
    }

    return this.ok(updated);
  }
}

// 导出单例
export const homeworkService = new HomeworkService();
export const homeworkSubmissionService = new HomeworkSubmissionService();
