/**
 * 作业 Service
 * 
 * 提供作业业务逻辑处理
 * 
 * @module services/homework.service
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import {
  homeworkRepository,
  homeworkSubmissionRepository,
  HomeworkQueryOptions,
  Homework,
  HomeworkSubmission,
  HomeworkStatus,
} from '@/repositories/homework.repository';

/**
 * 作业 Service 类
 */
export class HomeworkService extends BaseService {
  /**
   * 获取作业列表
   */
  async getList(options: HomeworkQueryOptions = {}): Promise<ServiceResult<Homework[]>> {
    try {
      if (options.classId) {
        const homeworks = await homeworkRepository.findByClass(options.classId);
        return this.ok(homeworks);
      }
      if (options.teacherId) {
        const homeworks = await homeworkRepository.findByTeacher(options.teacherId);
        return this.ok(homeworks);
      }
      const homeworks = await homeworkRepository.findAll();
      return this.ok(homeworks);
    } catch (error) {
      return this.fail('获取作业列表失败', 'FETCH_ERROR');
    }
  }

  /**
   * 获取分页作业列表
   */
  async getPaginated(
    options: HomeworkQueryOptions = {}
  ): Promise<PaginatedServiceResult<Homework>> {
    try {
      const result = await homeworkRepository.findPaginated(options);
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
    const homework = await homeworkRepository.findById(id);
    if (!homework) {
      return this.fail('作业不存在', 'NOT_FOUND');
    }
    return this.ok(homework);
  }

  /**
   * 获取即将到期的作业
   */
  async getUpcoming(days: number = 7): Promise<ServiceResult<Homework[]>> {
    const homeworks = await homeworkRepository.findUpcoming(days);
    return this.ok(homeworks);
  }

  /**
   * 创建作业
   */
  async create(data: Partial<Homework>): Promise<ServiceResult<Homework>> {
    if (!data.title || !data.classId || !data.teacherId) {
      return this.fail('作业标题、班级和教师不能为空', 'VALIDATION_ERROR');
    }

    const homework = await homeworkRepository.create({
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
    const existing = await homeworkRepository.findById(id);
    if (!existing) {
      return this.fail('作业不存在', 'NOT_FOUND');
    }

    const homework = await homeworkRepository.update(id, data);
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
   * 归档作业
   */
  async archive(id: string): Promise<ServiceResult<Homework>> {
    return this.updateStatus(id, 'archived');
  }

  /**
   * 更新作业状态
   */
  private async updateStatus(
    id: string,
    status: HomeworkStatus
  ): Promise<ServiceResult<Homework>> {
    const existing = await homeworkRepository.findById(id);
    if (!existing) {
      return this.fail('作业不存在', 'NOT_FOUND');
    }

    const homework = await homeworkRepository.update(id, { status } as Partial<Homework>);
    if (!homework) {
      return this.fail('更新作业状态失败', 'UPDATE_ERROR');
    }

    return this.ok(homework);
  }

  /**
   * 删除作业
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    const existing = await homeworkRepository.findById(id);
    if (!existing) {
      return this.fail('作业不存在', 'NOT_FOUND');
    }

    // 只能删除草稿状态的作业
    if (existing.status !== 'draft') {
      return this.fail('只能删除草稿状态的作业', 'INVALID_STATUS');
    }

    const success = await homeworkRepository.delete(id);
    if (!success) {
      return this.fail('删除作业失败', 'DELETE_ERROR');
    }

    return this.ok();
  }

  /**
   * 获取作业统计
   */
  async getStatistics(id: string): Promise<
    ServiceResult<{
      totalCount: number;
      submittedCount: number;
      lateCount: number;
      pendingCount: number;
      gradedCount: number;
      avgScore: number | null;
    }>
  > {
    const homework = await homeworkRepository.findById(id);
    if (!homework) {
      return this.fail('作业不存在', 'NOT_FOUND');
    }

    const stats = await homeworkRepository.getStatistics(id);
    return this.ok(stats);
  }

  /**
   * 获取作业详情（含统计）
   */
  async getDetail(id: string): Promise<ServiceResult<Homework & { statistics?: any }>> {
    const homework = await homeworkRepository.findById(id);
    if (!homework) {
      return this.fail('作业不存在', 'NOT_FOUND');
    }

    const statistics = await homeworkRepository.getStatistics(id);
    return this.ok({ ...homework, statistics });
  }
}

/**
 * 作业提交 Service 类
 */
export class HomeworkSubmissionService extends BaseService {
  /**
   * 根据作业ID获取提交
   */
  async getByHomework(homeworkId: string): Promise<ServiceResult<HomeworkSubmission[]>> {
    const submissions = await homeworkSubmissionRepository.findByHomework(homeworkId);
    return this.ok(submissions);
  }

  /**
   * 根据学生ID获取提交
   */
  async getByStudent(studentId: string): Promise<ServiceResult<HomeworkSubmission[]>> {
    const submissions = await homeworkSubmissionRepository.findByStudent(studentId);
    return this.ok(submissions);
  }

  /**
   * 提交作业
   */
  async submit(
    homeworkId: string,
    studentId: string,
    studentName: string,
    data: { content?: string; attachments?: string[] }
  ): Promise<ServiceResult<HomeworkSubmission>> {
    // 检查作业是否存在
    const homework = await homeworkRepository.findById(homeworkId);
    if (!homework) {
      return this.fail('作业不存在', 'NOT_FOUND');
    }

    // 检查是否已过截止日期
    const now = new Date();
    const dueDate = new Date(homework.dueDate);
    const isLate = now > dueDate;

    // 检查是否允许迟交
    if (isLate && !homework.allowLateSubmission) {
      return this.fail('作业已过截止日期，不允许迟交', 'LATE_SUBMISSION');
    }

    // 检查是否已提交
    const existing = await homeworkSubmissionRepository.findByHomeworkAndStudent(
      homeworkId,
      studentId
    );

    if (existing && existing.status === 'submitted') {
      return this.fail('作业已提交', 'ALREADY_SUBMITTED');
    }

    const submission = await homeworkSubmissionRepository.create({
      homeworkId,
      studentId,
      studentName,
      classId: homework.classId,
      content: data.content,
      attachments: data.attachments,
      submittedAt: now.toISOString(),
      status: isLate ? 'late' : 'submitted',
    } as any);

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
    feedback: string,
    gradedBy: string
  ): Promise<ServiceResult<HomeworkSubmission>> {
    const submission = await homeworkSubmissionRepository.findById(submissionId);
    if (!submission) {
      return this.fail('提交记录不存在', 'NOT_FOUND');
    }

    const updated = await homeworkSubmissionRepository.update(submissionId, {
      score,
      feedback,
      status: 'graded',
      gradedBy,
      gradedAt: new Date().toISOString(),
    } as any);

    if (!updated) {
      return this.fail('评分失败', 'GRADE_ERROR');
    }

    return this.ok(updated);
  }

  /**
   * 批量评分
   */
  async batchGrade(
    submissions: Array<{ id: string; score: number; feedback?: string }>,
    gradedBy: string
  ): Promise<ServiceResult<HomeworkSubmission[]>> {
    if (!submissions || submissions.length === 0) {
      return this.fail('评分数据不能为空', 'VALIDATION_ERROR');
    }

    const result = await homeworkSubmissionRepository.batchGrade(submissions, gradedBy);
    if (result.length === 0) {
      return this.fail('批量评分失败', 'BATCH_GRADE_ERROR');
    }

    return this.ok(result);
  }
}

// 导出单例
export const homeworkService = new HomeworkService();
export const homeworkSubmissionService = new HomeworkSubmissionService();
