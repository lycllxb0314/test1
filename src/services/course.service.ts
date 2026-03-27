/**
 * 课程 Service
 * 
 * 提供课程业务逻辑处理
 * 
 * ⚠️ 架构原则：
 * - 通过 DI 容器获取 Repository，不直接 import 具体实现
 * - Service 层只依赖 Repository 接口，遵循依赖倒置原则
 * 
 * @module services/course.service
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import type { ICourseRepository } from '@/types/repository';
import type { Course, CourseType } from '@/types/course';
import type { QueryOptions } from '@/repositories/base.repository';

/**
 * 课程查询选项
 */
export interface CourseQueryOptions extends QueryOptions {
  type?: CourseType;
  isMain?: boolean;
}

/**
 * 课程 Service 类
 */
export class CourseService extends BaseService {
  /**
   * 获取课程 Repository（通过 DI 容器）
   */
  private get courseRepository(): ICourseRepository {
    return getService(SERVICE_IDENTIFIERS.CourseRepository);
  }

  /**
   * 获取课程列表
   */
  async getList(options: CourseQueryOptions = {}): Promise<ServiceResult<Course[]>> {
    try {
      const courses = await this.courseRepository.findAll();
      return this.ok(courses);
    } catch (error) {
      return this.fail('获取课程列表失败', 'FETCH_ERROR');
    }
  }

  /**
   * 获取分页课程列表
   */
  async getPaginated(options: CourseQueryOptions = {}): Promise<PaginatedServiceResult<Course>> {
    try {
      const result = await this.courseRepository.findPaginated(options);
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
    const course = await this.courseRepository.findById(id);
    if (!course) {
      return this.fail('课程不存在', 'NOT_FOUND');
    }
    return this.ok(course);
  }

  /**
   * 根据类型获取课程
   */
  async getByType(type: CourseType): Promise<ServiceResult<Course[]>> {
    const courses = await this.courseRepository.findWhere({ type } as Record<string, unknown>);
    return this.ok(courses);
  }

  /**
   * 根据教师获取课程
   */
  async getByTeacher(teacherId: string): Promise<ServiceResult<Course[]>> {
    const courses = await this.courseRepository.findByTeacher(teacherId);
    return this.ok(courses);
  }

  /**
   * 根据班级获取课程
   */
  async getByClass(classId: string): Promise<ServiceResult<Course[]>> {
    const courses = await this.courseRepository.findByClass(classId);
    return this.ok(courses);
  }

  /**
   * 创建课程
   */
  async create(data: Partial<Course>): Promise<ServiceResult<Course>> {
    if (!data.name || !data.code) {
      return this.fail('课程名称和代码不能为空', 'VALIDATION_ERROR');
    }

    const course = await this.courseRepository.create(data);
    if (!course) {
      return this.fail('创建课程失败', 'CREATE_ERROR');
    }

    return this.ok(course);
  }

  /**
   * 更新课程
   */
  async update(id: string, data: Partial<Course>): Promise<ServiceResult<Course>> {
    const existing = await this.courseRepository.findById(id);
    if (!existing) {
      return this.fail('课程不存在', 'NOT_FOUND');
    }

    const course = await this.courseRepository.update(id, data);
    if (!course) {
      return this.fail('更新课程失败', 'UPDATE_ERROR');
    }

    return this.ok(course);
  }

  /**
   * 删除课程
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    const existing = await this.courseRepository.findById(id);
    if (!existing) {
      return this.fail('课程不存在', 'NOT_FOUND');
    }

    const success = await this.courseRepository.delete(id);
    if (!success) {
      return this.fail('删除课程失败', 'DELETE_ERROR');
    }

    return this.ok();
  }
}

// 导出单例
export const courseService = new CourseService();
