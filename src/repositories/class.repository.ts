/**
 * 班级 Repository
 * 
 * 处理班级相关的数据访问
 */

import { BaseRepository, PaginatedResult } from './base.repository';
import type { Class, ClassInfo } from '@/types';

/**
 * 班级查询筛选
 */
export interface ClassFilters {
  grade?: number;
  status?: string;
  academicYear?: string;
}

/**
 * 班级统计信息
 */
export interface ClassStatistics {
  totalStudents: number;
  maleCount: number;
  femaleCount: number;
  teacherCount: number;
}

/**
 * 班级 Repository
 */
export class ClassRepository extends BaseRepository<Class> {
  constructor() {
    super('classes');
  }

  /**
   * 根据年级查询班级
   */
  async findByGrade(grade: number): Promise<Class[]> {
    return this.findWhere({ grade } as Record<string, unknown>);
  }

  /**
   * 查询活跃班级
   */
  async findActive(): Promise<Class[]> {
    return this.findWhere({ status: 'active' } as Record<string, unknown>);
  }

  /**
   * 查询班级详情（包含教师和学生数）
   */
  async findDetailById(id: string): Promise<ClassInfo | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(`
        *,
        head_teacher:users!head_teacher_id(id, name, phone),
        teachers:class_teachers(
          teacher_id,
          position,
          users(id, name, phone, role)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('[ClassRepository] findDetailById error:', error.message);
      return null;
    }

    return data as ClassInfo;
  }

  /**
   * 分页查询班级（带筛选）
   */
  async findPaginatedWithFilters(
    options: {
      filters?: ClassFilters;
      search?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<PaginatedResult<Class>> {
    const { filters, search, page = 1, pageSize = 20 } = options;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.client
      .from(this.tableName)
      .select('*', { count: 'exact' });

    if (filters?.grade) {
      query = query.eq('grade', filters.grade);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    query = query.order('grade').order('name').range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('[ClassRepository] findPaginatedWithFilters error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    return {
      data: (data || []) as Class[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * 获取班级统计信息
   */
  async getStatistics(classId: string): Promise<ClassStatistics> {
    const [studentsResult, teachersResult] = await Promise.all([
      this.client
        .from('students')
        .select('gender')
        .eq('class_id', classId),
      this.client
        .from('class_teachers')
        .select('id')
        .eq('class_id', classId)
        .eq('status', 'active'),
    ]);

    const students = studentsResult.data || [];
    
    return {
      totalStudents: students.length,
      maleCount: students.filter((s: { gender?: string }) => s.gender === 'male' || s.gender === '男').length,
      femaleCount: students.filter((s: { gender?: string }) => s.gender === 'female' || s.gender === '女').length,
      teacherCount: teachersResult.data?.length || 0,
    };
  }

  /**
   * 获取年级班级列表（带学生数）
   */
  async findByGradeWithStudentCount(grade: number): Promise<(Class & { student_count: number })[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(`
        *,
        students(count)
      `)
      .eq('grade', grade)
      .eq('status', 'active');

    if (error) {
      console.error('[ClassRepository] findByGradeWithStudentCount error:', error.message);
      return [];
    }

    return (data || []).map((c: Record<string, unknown>) => ({
      ...c,
      student_count: (c.students as { count: number }[])?.[0]?.count || 0,
    })) as (Class & { student_count: number })[];
  }

  /**
   * 获取班主任管理的班级
   */
  async findByHeadTeacher(teacherId: string): Promise<Class[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('head_teacher_id', teacherId);

    if (error) {
      console.error('[ClassRepository] findByHeadTeacher error:', error.message);
      return [];
    }

    return (data || []) as Class[];
  }

  /**
   * 获取教师任教的班级
   */
  async findByTeacher(teacherId: string): Promise<Class[]> {
    const { data, error } = await this.client
      .from('class_teachers')
      .select('classes(*)')
      .eq('teacher_id', teacherId)
      .eq('status', 'active');

    if (error) {
      console.error('[ClassRepository] findByTeacher error:', error.message);
      return [];
    }

    return (data || [])
      .map((ct: Record<string, unknown>) => ct.classes)
      .filter(Boolean) as Class[];
  }

  /**
   * 统计年级班级数
   */
  async countByGrade(): Promise<Record<number, number>> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('grade')
      .eq('status', 'active');

    if (error) {
      console.error('[ClassRepository] countByGrade error:', error.message);
      return {};
    }

    const counts: Record<number, number> = {};
    (data || []).forEach((item: { grade: number }) => {
      counts[item.grade] = (counts[item.grade] || 0) + 1;
    });

    return counts;
  }
}

// 导出单例
export const classRepository = new ClassRepository();
