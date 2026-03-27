/**
 * 考试 Service
 * 
 * 提供考试业务逻辑处理
 * 
 * @module services/exam.service
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import {
  examRepository,
  examScoreRepository,
  ExamQueryOptions,
  Exam,
  ExamScore,
  ExamStatus,
} from '@/repositories/exam.repository';

/**
 * 考试 Service 类
 */
export class ExamService extends BaseService {
  /**
   * 获取考试列表
   */
  async getList(options: ExamQueryOptions = {}): Promise<ServiceResult<Exam[]>> {
    try {
      const exams = options.status
        ? await examRepository.findByStatus(options.status)
        : await examRepository.findAll();
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
      const result = await examRepository.findPaginated(options);
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
    const exam = await examRepository.findById(id);
    if (!exam) {
      return this.fail('考试不存在', 'NOT_FOUND');
    }
    return this.ok(exam);
  }

  /**
   * 根据学期获取考试
   */
  async getBySemester(semester: string): Promise<ServiceResult<Exam[]>> {
    const exams = await examRepository.findBySemester(semester);
    return this.ok(exams);
  }

  /**
   * 创建考试
   */
  async create(data: Partial<Exam>): Promise<ServiceResult<Exam>> {
    if (!data.name || !data.semester) {
      return this.fail('考试名称和学期不能为空', 'VALIDATION_ERROR');
    }

    const exam = await examRepository.create({
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
    const existing = await examRepository.findById(id);
    if (!existing) {
      return this.fail('考试不存在', 'NOT_FOUND');
    }

    const exam = await examRepository.update(id, data);
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
  private async updateStatus(
    id: string,
    status: ExamStatus
  ): Promise<ServiceResult<Exam>> {
    const existing = await examRepository.findById(id);
    if (!existing) {
      return this.fail('考试不存在', 'NOT_FOUND');
    }

    const exam = await examRepository.updateStatus(id, status);
    if (!exam) {
      return this.fail('更新考试状态失败', 'UPDATE_ERROR');
    }

    return this.ok(exam);
  }

  /**
   * 删除考试
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    const existing = await examRepository.findById(id);
    if (!existing) {
      return this.fail('考试不存在', 'NOT_FOUND');
    }

    // 只能删除草稿状态的考试
    if (existing.status !== 'draft') {
      return this.fail('只能删除草稿状态的考试', 'INVALID_STATUS');
    }

    const success = await examRepository.delete(id);
    if (!success) {
      return this.fail('删除考试失败', 'DELETE_ERROR');
    }

    return this.ok();
  }

  /**
   * 获取考试统计
   */
  async getStatistics(id: string): Promise<
    ServiceResult<{
      participantCount: number;
      avgScore: number;
      maxScore: number;
      minScore: number;
      passRate: number;
      excellentRate: number;
    }>
  > {
    const exam = await examRepository.findById(id);
    if (!exam) {
      return this.fail('考试不存在', 'NOT_FOUND');
    }

    const stats = await examRepository.getStatistics(id);
    return this.ok(stats);
  }

  /**
   * 获取考试详情（含成绩统计）
   */
  async getDetail(id: string): Promise<
    ServiceResult<Exam & { statistics?: ReturnType<typeof examRepository.getStatistics> extends Promise<infer T> ? T : never }>
  > {
    const exam = await examRepository.findById(id);
    if (!exam) {
      return this.fail('考试不存在', 'NOT_FOUND');
    }

    const statistics = await examRepository.getStatistics(id);
    return this.ok({ ...exam, statistics } as Exam & { statistics: typeof statistics });
  }
}

/**
 * 考试成绩 Service 类
 */
export class ExamScoreService extends BaseService {
  /**
   * 根据考试ID获取成绩
   */
  async getByExam(examId: string): Promise<ServiceResult<ExamScore[]>> {
    const scores = await examScoreRepository.findByExamId(examId);
    return this.ok(scores);
  }

  /**
   * 根据学生ID获取成绩
   */
  async getByStudent(studentId: string): Promise<ServiceResult<ExamScore[]>> {
    const scores = await examScoreRepository.findByStudentId(studentId);
    return this.ok(scores);
  }

  /**
   * 导入成绩
   */
  async importScores(scores: Partial<ExamScore>[]): Promise<ServiceResult<ExamScore[]>> {
    if (!scores || scores.length === 0) {
      return this.fail('成绩数据不能为空', 'VALIDATION_ERROR');
    }

    const result = await examScoreRepository.importScores(scores);
    if (result.length === 0) {
      return this.fail('导入成绩失败', 'IMPORT_ERROR');
    }

    return this.ok(result);
  }

  /**
   * 获取班级成绩统计
   */
  async getClassStatistics(
    examId: string,
    classId: string
  ): Promise<
    ServiceResult<{
      count: number;
      avgScore: number;
      maxScore: number;
      minScore: number;
    }>
  > {
    const stats = await examScoreRepository.getClassStatistics(examId, classId);
    return this.ok(stats);
  }
}

// 导出单例
export const examService = new ExamService();
export const examScoreService = new ExamScoreService();
