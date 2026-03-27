/**
 * 课程 Repository
 * 
 * 提供课程数据访问
 * 
 * @module repositories/course.repository
 */

import { BaseRepository, QueryOptions, PaginatedResult } from './base.repository';
import type { Course, CourseType } from '@/types/course';

/**
 * 课程查询选项
 */
export interface CourseQueryOptions extends QueryOptions {
  type?: CourseType;
  isMain?: boolean;
}

/**
 * 课程 Repository 类
 */
export class CourseRepository extends BaseRepository<Course> {
  constructor() {
    super('courses');
  }

  /**
   * 根据类型查询课程
   */
  async findByType(type: CourseType): Promise<Course[]> {
    return this.findWhere({ type });
  }

  /**
   * 查询主科课程
   */
  async findMainCourses(): Promise<Course[]> {
    return this.findWhere({ is_main: true });
  }

  /**
   * 根据代码查询课程
   */
  async findByCode(code: string): Promise<Course | null> {
    const results = await this.findWhere({ code });
    return results[0] || null;
  }

  /**
   * 分页查询课程
   */
  async findPaginated(options: CourseQueryOptions = {}): Promise<PaginatedResult<Course>> {
    const { type, isMain, ...baseOptions } = options;
    
    const filters: Record<string, unknown> = {
      ...baseOptions.filters,
    };
    
    if (type) filters.type = type;
    if (isMain !== undefined) filters.is_main = isMain;

    return super.findPaginated({
      ...baseOptions,
      filters,
    });
  }

  /**
   * 批量更新课程
   */
  async updateMany(ids: string[], data: Partial<Course>): Promise<Course[]> {
    const client = this.client;
    const { data: result, error } = await client
      .from(this.tableName)
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)
      .select();

    if (error) {
      console.error(`[${this.tableName}] updateMany error:`, error.message);
      return [];
    }

    return (result || []) as Course[];
  }

  /**
   * 获取所有课程类型统计
   */
  async getTypeStatistics(): Promise<Record<CourseType, number>> {
    const client = this.client;
    const { data, error } = await client
      .from(this.tableName)
      .select('type');

    if (error) {
      console.error(`[${this.tableName}] getTypeStatistics error:`, error.message);
      return {} as Record<CourseType, number>;
    }

    const stats: Record<string, number> = {};
    (data || []).forEach((item) => {
      stats[item.type] = (stats[item.type] || 0) + 1;
    });

    return stats as Record<CourseType, number>;
  }
}

// 导出单例
export const courseRepository = new CourseRepository();
