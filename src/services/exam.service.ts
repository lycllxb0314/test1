/**
 * 考试 Service
 * 
 * 提供考试业务逻辑处理
 * 
 * ⚠️ 架构原则：
 * - 通过 DI 容器获取 Repository，不直接 import 具体实现
 * - Service 层只依赖 Repository 接口，遵循依赖倒置原则
 * 
 * @module services/exam.service
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import type { IExamRepository, IExamScoreRepository, ExamQueryOptions } from '@/lib/di/interfaces';
import type { Exam, ExamScore, ExamStatus, ExamStatistics } from '@/types/exam';

/**
 * 考试 Service 类
 */
export class ExamService extends BaseService {
  /**
   * 获取考试 Repository（通过 DI 容器）
   */
  private get examRepository(): IExamRepository {
    return getService(SERVICE_IDENTIFIERS.ExamRepository);
  }

  /**
   * 获取考试列表
   */
  async getList(options: ExamQueryOptions = {}): Promise<ServiceResult<Exam[]>> {
    try {
      const exams = options.filters?.status
        ? await this.examRepository.findByStatus(options.filters.status as ExamStatus)
        : await this.examRepository.findAll();
      return this.ok(exams);
    } catch (error) {
      return this.fail('获取考试列表失败', 'FETCH_ERROR');
    }
  }

  /**
   * 获取分页考试列表
   */
  async getPaginated(options: ExamQueryOptions = {}): Promise<PaginatedServiceResult<Exam>> {
    try {
      const result = await this.examRepository.findPaginated(options);
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
        error: '获取考试列表失败',
      };
    }
  }

  /**
   * 根据ID获取考试
   */
  async getById(id: string): Promise<ServiceResult<Exam>> {
    const exam = await this.examRepository.findById(id);
    if (!exam) {
      return this.fail('考试不存在', 'NOT_FOUND');
    }
    return this.ok(exam);
  }

  /**
   * 根据学期获取考试
   */
  async getBySemester(semester: string): Promise<ServiceResult<Exam[]>> {
    const exams = await this.examRepository.findBySemester(semester);
    return this.ok(exams);
  }

  /**
   * 创建考试
   */
  async create(data: Partial<Exam>): Promise<ServiceResult<Exam>> {
    if (!data.name || !data.semester) {
      return this.fail('考试名称和学期不能为空', 'VALIDATION_ERROR');
    }

    const exam = await this.examRepository.create({
      ...data,
      status: data.status || 'draft',
    });

    if (!exam) {
      return this.fail('创建考试失败', 'CREATE_ERROR');
    }

    return this.ok(exam);
  }

  /**
   * 更新考试
   */
  async update(id: string, data: Partial<Exam>): Promise<ServiceResult<Exam>> {
    const existing = await this.examRepository.findById(id);
    if (!existing) {
      return this.fail('考试不存在', 'NOT_FOUND');
    }

    const exam = await this.examRepository.update(id, data);
    if (!exam) {
      return this.fail('更新考试失败', 'UPDATE_ERROR');
    }

    return this.ok(exam);
  }

  /**
   * 发布考试
   */
  async publish(id: string): Promise<ServiceResult<Exam>> {
    return this.updateStatus(id, 'published');
  }

  /**
   * 开始考试
   */
  async start(id: string): Promise<ServiceResult<Exam>> {
    return this.updateStatus(id, 'ongoing');
  }

  /**
   * 结束考试
   */
  async complete(id: string): Promise<ServiceResult<Exam>> {
    return this.updateStatus(id, 'completed');
  }

  /**
   * 归档考试
   */
  async archive(id: string): Promise<ServiceResult<Exam>> {
    return this.updateStatus(id, 'archived');
  }

  /**
   * 更新考试状态
   */
  private async updateStatus(id: string, status: ExamStatus): Promise<ServiceResult<Exam>> {
    const existing = await this.examRepository.findById(id);
    if (!existing) {
      return this.fail('考试不存在', 'NOT_FOUND');
    }

    const exam = await this.examRepository.updateStatus(id, status);
    if (!exam) {
      return this.fail('更新考试状态失败', 'UPDATE_ERROR');
    }

    return this.ok(exam);
  }

  /**
   * 删除考试
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    const existing = await this.examRepository.findById(id);
    if (!existing) {
      return this.fail('考试不存在', 'NOT_FOUND');
    }

    if (existing.status !== 'draft') {
      return this.fail('只能删除草稿状态的考试', 'INVALID_STATUS');
    }

    const success = await this.examRepository.delete(id);
    if (!success) {
      return this.fail('删除考试失败', 'DELETE_ERROR');
    }

    return this.ok();
  }

  /**
   * 获取考试统计
   */
  async getStatistics(id: string): Promise<ServiceResult<ExamStatistics>> {
    const exam = await this.examRepository.findById(id);
    if (!exam) {
      return this.fail('考试不存在', 'NOT_FOUND');
    }

    const stats = await this.examRepository.getStatistics(id);
    return this.ok(stats);
  }

  /**
   * 获取考试详情（含统计）
   */
  async getDetail(id: string): Promise<ServiceResult<Exam & { statistics?: ExamStatistics }>> {
    const exam = await this.examRepository.findById(id);
    if (!exam) {
      return this.fail('考试不存在', 'NOT_FOUND');
    }

    const statistics = await this.examRepository.getStatistics(id);
    return this.ok({ ...exam, statistics });
  }
}

/**
 * 考试成绩 Service 类
 */
export class ExamScoreService extends BaseService {
  /**
   * 获取成绩 Repository（通过 DI 容器）
   */
  private get examScoreRepository(): IExamScoreRepository {
    return getService(SERVICE_IDENTIFIERS.ExamScoreRepository);
  }

  /**
   * 根据考试ID获取成绩
   */
  async getByExam(examId: string): Promise<ServiceResult<ExamScore[]>> {
    const scores = await this.examScoreRepository.findByExamId(examId);
    return this.ok(scores);
  }

  /**
   * 根据学生ID获取成绩
   */
  async getByStudent(studentId: string): Promise<ServiceResult<ExamScore[]>> {
    const scores = await this.examScoreRepository.findByStudentId(studentId);
    return this.ok(scores);
  }

  /**
   * 导入成绩
   */
  async importScores(scores: Partial<ExamScore>[]): Promise<ServiceResult<ExamScore[]>> {
    if (!scores || scores.length === 0) {
      return this.fail('成绩数据不能为空', 'VALIDATION_ERROR');
    }

    const result = await this.examScoreRepository.importScores(scores);
    if (result.length === 0) {
      return this.fail('导入成绩失败', 'IMPORT_ERROR');
    }

    return this.ok(result);
  }

  /**
   * 获取班级成绩统计
   */
  async getClassStatistics(examId: string, classId: string): Promise<
    ServiceResult<{
      count: number;
      avgScore: number;
      maxScore: number;
      minScore: number;
    }>
  > {
    const stats = await this.examScoreRepository.getClassStatistics(examId, classId);
    return this.ok(stats);
  }
}

// 导出单例
export const examService = new ExamService();
export const examScoreService = new ExamScoreService();
