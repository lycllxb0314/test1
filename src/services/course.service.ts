/**
 * 课程 Service
 * 
 * 提供课程业务逻辑处理
 * 
 * @module services/course.service
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { courseRepository, CourseQueryOptions } from '@/repositories/course.repository';
import type { Course, CourseType } from '@/types/course';

/**
 * 课程 Service 类
 */
export class CourseService extends BaseService {
  /**
   * 获取课程列表
   */
  async getList(options: CourseQueryOptions = {}): Promise<ServiceResult<Course[]>> {
    try {
      const courses = await courseRepository.findAll();
      return this.ok(courses);
    } catch (error) {
      return this.fail('获取课程列表失败', 'FETCH_ERROR');
    }
  }

  /**
   * 获取分页课程列表
   */
  async getPaginated(
    options: CourseQueryOptions = {}
  ): Promise<PaginatedServiceResult<Course>> {
    try {
      const result = await courseRepository.findPaginated(options);
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
        error: '获取课程列表失败',
      };
    }
  }

  /**
   * 根据ID获取课程
   */
  async getById(id: string): Promise<ServiceResult<Course>> {
    const course = await courseRepository.findById(id);
    if (!course) {
      return this.fail('课程不存在', 'NOT_FOUND');
    }
    return this.ok(course);
  }

  /**
   * 根据类型获取课程
   */
  async getByType(type: CourseType): Promise<ServiceResult<Course[]>> {
    const courses = await courseRepository.findByType(type);
    return this.ok(courses);
  }

  /**
   * 获取主科课程
   */
  async getMainCourses(): Promise<ServiceResult<Course[]>> {
    const courses = await courseRepository.findMainCourses();
    return this.ok(courses);
  }

  /**
   * 创建课程
   */
  async create(data: Partial<Course>): Promise<ServiceResult<Course>> {
    // 验证必填字段
    if (!data.name || !data.code) {
      return this.fail('课程名称和代码不能为空', 'VALIDATION_ERROR');
    }

    // 检查代码是否重复
    const existing = await courseRepository.findByCode(data.code);
    if (existing) {
      return this.fail('课程代码已存在', 'DUPLICATE_ERROR');
    }

    const course = await courseRepository.create(data);
    if (!course) {
      return this.fail('创建课程失败', 'CREATE_ERROR');
    }

    return this.ok(course);
  }

  /**
   * 更新课程
   */
  async update(id: string, data: Partial<Course>): Promise<ServiceResult<Course>> {
    // 检查课程是否存在
    const existing = await courseRepository.findById(id);
    if (!existing) {
      return this.fail('课程不存在', 'NOT_FOUND');
    }

    // 如果更新代码，检查是否重复
    if (data.code && data.code !== existing.code) {
      const codeExists = await courseRepository.findByCode(data.code);
      if (codeExists) {
        return this.fail('课程代码已存在', 'DUPLICATE_ERROR');
      }
    }

    const course = await courseRepository.update(id, data);
    if (!course) {
      return this.fail('更新课程失败', 'UPDATE_ERROR');
    }

    return this.ok(course);
  }

  /**
   * 删除课程
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    const existing = await courseRepository.findById(id);
    if (!existing) {
      return this.fail('课程不存在', 'NOT_FOUND');
    }

    const success = await courseRepository.delete(id);
    if (!success) {
      return this.fail('删除课程失败', 'DELETE_ERROR');
    }

    return this.ok();
  }

  /**
   * 批量删除课程
   */
  async deleteMany(ids: string[]): Promise<ServiceResult<void>> {
    for (const id of ids) {
      await courseRepository.delete(id);
    }
    return this.ok();
  }

  /**
   * 获取类型统计
   */
  async getTypeStatistics(): Promise<ServiceResult<Record<CourseType, number>>> {
    const stats = await courseRepository.getTypeStatistics();
    return this.ok(stats);
  }
}

// 导出单例
export const courseService = new CourseService();
