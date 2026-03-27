/**
 * 班级服务层
 * 
 * 处理班级相关的业务逻辑
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { classRepository, studentRepository, teacherRepository } from '@/repositories';
import type { Class, ClassInfo, ClassStatus } from '@/types';

/**
 * 班级查询参数
 */
export interface ClassQueryParams {
  grade?: number;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 创建班级参数
 */
export interface CreateClassParams {
  name: string;
  grade: number;
  headTeacherId?: string;
  academicYear?: string;
  [key: string]: unknown;
}

/**
 * 更新班级参数
 */
export interface UpdateClassParams {
  name?: string;
  headTeacherId?: string;
  status?: ClassStatus;
  [key: string]: unknown;
}

/**
 * 班级服务
 */
export class ClassService extends BaseService {
  /**
   * 获取班级详情
   */
  async getClass(id: string): Promise<ServiceResult<ClassInfo>> {
    const classInfo = await classRepository.findDetailById(id);
    
    if (!classInfo) {
      return this.fail('班级不存在', 'NOT_FOUND');
    }
    
    return this.ok(classInfo);
  }

  /**
   * 查询班级列表
   */
  async listClasses(params: ClassQueryParams): Promise<PaginatedServiceResult<Class>> {
    const { page = 1, pageSize = 20, grade, status, search } = params;

    const result = await classRepository.findPaginatedWithFilters({
      filters: { grade, status },
      search,
      page,
      pageSize,
    });

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
  }

  /**
   * 创建班级
   */
  async createClass(params: CreateClassParams): Promise<ServiceResult<Class>> {
    // 检查班级名称是否重复
    const existing = await classRepository.findAll();
    if (existing.some((c: Class) => c.name === params.name)) {
      return this.fail('班级名称已存在', 'DUPLICATE_NAME');
    }

    // 如果指定班主任，检查是否已经是其他班班主任
    if (params.headTeacherId) {
      const headTeacherClasses = await classRepository.findByHeadTeacher(params.headTeacherId);
      if (headTeacherClasses.length > 0) {
        return this.fail('该教师已经是其他班级的班主任', 'ALREADY_HEAD_TEACHER');
      }
    }

    const newClass = await classRepository.create({
      ...params,
    });

    if (!newClass) {
      return this.fail('创建班级失败', 'CREATE_FAILED');
    }

    return this.ok(newClass);
  }

  /**
   * 更新班级信息
   */
  async updateClass(id: string, params: UpdateClassParams): Promise<ServiceResult<Class>> {
    const existing = await classRepository.findById(id);
    if (!existing) {
      return this.fail('班级不存在', 'NOT_FOUND');
    }

    // 如果更换班主任，检查新班主任是否已经是其他班班主任
    if (params.headTeacherId && params.headTeacherId !== existing.headTeacherId) {
      const headTeacherClasses = await classRepository.findByHeadTeacher(params.headTeacherId);
      const isHeadOfOtherClass = headTeacherClasses.some((c: Class) => c.id !== id);
      if (isHeadOfOtherClass) {
        return this.fail('该教师已经是其他班级的班主任', 'ALREADY_HEAD_TEACHER');
      }
    }

    const updated = await classRepository.update(id, params as Partial<Class>);
    
    if (!updated) {
      return this.fail('更新班级失败', 'UPDATE_FAILED');
    }

    return this.ok(updated);
  }

  /**
   * 删除班级
   */
  async deleteClass(id: string): Promise<ServiceResult<void>> {
    const existing = await classRepository.findById(id);
    if (!existing) {
      return this.fail('班级不存在', 'NOT_FOUND');
    }

    // 检查班级是否还有学生
    const studentCount = await studentRepository.countByClass(id);
    if (studentCount > 0) {
      return this.fail('班级内还有学生，无法删除', 'HAS_STUDENTS');
    }

    const success = await classRepository.delete(id);
    
    if (!success) {
      return this.fail('删除班级失败', 'DELETE_FAILED');
    }

    return this.ok();
  }

  /**
   * 获取班级统计
   */
  async getClassStatistics(id: string): Promise<ServiceResult<{
    students: {
      total: number;
      male: number;
      female: number;
    };
    teachers: {
      total: number;
      headTeacher: { id: string; name: string } | null;
    };
  }>> {
    const classInfo = await classRepository.findById(id);
    if (!classInfo) {
      return this.fail('班级不存在', 'NOT_FOUND');
    }

    const stats = await classRepository.getStatistics(id);

    return this.ok({
      students: {
        total: stats.totalStudents,
        male: stats.maleCount,
        female: stats.femaleCount,
      },
      teachers: {
        total: stats.teacherCount,
        headTeacher: classInfo.headTeacherId ? {
          id: classInfo.headTeacherId,
          name: classInfo.headTeacherName || '',
        } : null,
      },
    });
  }

  /**
   * 获取年级班级列表
   */
  async listByGrade(grade: number): Promise<ServiceResult<(Class & { student_count: number })[]>> {
    const classes = await classRepository.findByGradeWithStudentCount(grade);
    return this.ok(classes);
  }

  /**
   * 获取班主任管理的班级
   */
  async getByHeadTeacher(teacherId: string): Promise<ServiceResult<Class[]>> {
    const classes = await classRepository.findByHeadTeacher(teacherId);
    return this.ok(classes);
  }

  /**
   * 获取教师任教的班级
   */
  async getByTeacher(teacherId: string): Promise<ServiceResult<Class[]>> {
    const classes = await classRepository.findByTeacher(teacherId);
    return this.ok(classes);
  }

  /**
   * 分配班主任
   */
  async assignHeadTeacher(classId: string, teacherId: string): Promise<ServiceResult<Class>> {
    const classInfo = await classRepository.findById(classId);
    if (!classInfo) {
      return this.fail('班级不存在', 'NOT_FOUND');
    }

    const teacher = await teacherRepository.findById(teacherId);
    if (!teacher) {
      return this.fail('教师不存在', 'TEACHER_NOT_FOUND');
    }

    // 检查教师是否已经是其他班班主任
    const headTeacherClasses = await classRepository.findByHeadTeacher(teacherId);
    const isHeadOfOtherClass = headTeacherClasses.some((c: Class) => c.id !== classId);
    if (isHeadOfOtherClass) {
      return this.fail('该教师已经是其他班级的班主任', 'ALREADY_HEAD_TEACHER');
    }

    const updated = await classRepository.update(classId, {
      headTeacherId: teacherId,
    } as Partial<Class>);

    if (!updated) {
      return this.fail('分配班主任失败', 'ASSIGN_FAILED');
    }

    return this.ok(updated);
  }

  /**
   * 获取全校班级统计
   */
  async getOverallStatistics(): Promise<ServiceResult<{
    total: number;
    byGrade: Record<number, { count: number; totalStudents: number }>;
  }>> {
    const allClasses = await classRepository.findActive();
    const byGradeCount = await classRepository.countByGrade();

    const byGrade: Record<number, { count: number; totalStudents: number }> = {};

    for (const grade of [1, 2, 3, 4, 5, 6]) {
      const classes = allClasses.filter((c: Class) => c.grade === grade);
      let totalStudents = 0;

      for (const cls of classes) {
        const count = await studentRepository.countByClass(cls.id);
        totalStudents += count;
      }

      byGrade[grade] = {
        count: byGradeCount[grade] || 0,
        totalStudents,
      };
    }

    return this.ok({
      total: allClasses.length,
      byGrade,
    });
  }
}

// 导出单例
export const classService = new ClassService();
