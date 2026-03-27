/**
 * 教师服务层
 * 
 * 处理教师相关的业务逻辑
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { teacherRepository, classRepository, scheduleRepository } from '@/repositories';
import type { User, TeacherProfile, TeacherWorkload, UserRole } from '@/types';

/**
 * 教师查询参数
 */
export interface TeacherQueryParams {
  role?: string;
  department?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 创建教师参数
 */
export interface CreateTeacherParams {
  name: string;
  employeeId: string;
  role?: UserRole;
  department?: string;
  phone?: string;
  email?: string;
  [key: string]: unknown;
}

/**
 * 更新教师参数
 */
export interface UpdateTeacherParams {
  name?: string;
  department?: string;
  phone?: string;
  email?: string;
  [key: string]: unknown;
}

/**
 * 教师服务
 */
export class TeacherService extends BaseService {
  /**
   * 获取教师详情
   */
  async getTeacher(id: string): Promise<ServiceResult<User>> {
    const teacher = await teacherRepository.findById(id);
    
    if (!teacher) {
      return this.fail('教师不存在', 'NOT_FOUND');
    }
    
    return this.ok(teacher);
  }

  /**
   * 获取教师完整档案
   */
  async getTeacherProfile(id: string): Promise<ServiceResult<TeacherProfile>> {
    const teacher = await teacherRepository.findById(id);
    if (!teacher) {
      return this.fail('教师不存在', 'NOT_FOUND');
    }

    // 获取关联信息
    const [classes, schedules] = await Promise.all([
      teacherRepository.findTeachingClasses(id),
      teacherRepository.findSchedule(id),
    ]);

    const profile: TeacherProfile = {
      ...teacher,
      honors: [],
      trainings: [],
      achievements: [],
      records: [],
    } as unknown as TeacherProfile;

    return this.ok(profile);
  }

  /**
   * 查询教师列表
   */
  async listTeachers(params: TeacherQueryParams): Promise<PaginatedServiceResult<User>> {
    const { page = 1, pageSize = 20, role, department, search } = params;

    const result = await teacherRepository.findPaginatedWithFilters({
      filters: { role, department },
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
   * 创建教师
   */
  async createTeacher(params: CreateTeacherParams): Promise<ServiceResult<User>> {
    // 检查工号是否重复
    const { data: existing } = await teacherRepository.findPaginatedWithFilters({
      search: params.employeeId,
    });
    
    if (existing.some((t: User) => t.employeeId === params.employeeId)) {
      return this.fail('工号已存在', 'DUPLICATE_EMPLOYEE_ID');
    }

    const teacher = await teacherRepository.create({
      ...params,
      role: params.role || 'subject_teacher' as UserRole,
    });

    if (!teacher) {
      return this.fail('创建教师失败', 'CREATE_FAILED');
    }

    return this.ok(teacher);
  }

  /**
   * 更新教师信息
   */
  async updateTeacher(id: string, params: UpdateTeacherParams): Promise<ServiceResult<User>> {
    const existing = await teacherRepository.findById(id);
    if (!existing) {
      return this.fail('教师不存在', 'NOT_FOUND');
    }

    const teacher = await teacherRepository.update(id, params);
    
    if (!teacher) {
      return this.fail('更新教师失败', 'UPDATE_FAILED');
    }

    return this.ok(teacher);
  }

  /**
   * 删除教师
   */
  async deleteTeacher(id: string): Promise<ServiceResult<void>> {
    const existing = await teacherRepository.findById(id);
    if (!existing) {
      return this.fail('教师不存在', 'NOT_FOUND');
    }

    // 检查是否还有任教班级
    const classes = await teacherRepository.findTeachingClasses(id);
    if (classes.length > 0) {
      return this.fail('该教师还有任教班级，无法删除', 'HAS_TEACHING_CLASSES');
    }

    const success = await teacherRepository.delete(id);
    
    if (!success) {
      return this.fail('删除教师失败', 'DELETE_FAILED');
    }

    return this.ok();
  }

  /**
   * 获取班主任列表
   */
  async listHeadTeachers(): Promise<ServiceResult<User[]>> {
    const teachers = await teacherRepository.findHeadTeachers();
    return this.ok(teachers);
  }

  /**
   * 获取教师工作量统计
   */
  async getWorkload(teacherId: string, semester?: string): Promise<ServiceResult<TeacherWorkload>> {
    const teacher = await teacherRepository.findById(teacherId);
    if (!teacher) {
      return this.fail('教师不存在', 'NOT_FOUND');
    }

    // 获取周课时
    const weeklyHours = await scheduleRepository.getTeacherWeeklyHours(teacherId, semester);
    
    // 获取任教班级
    const classes = await teacherRepository.findTeachingClasses(teacherId);

    const workload: TeacherWorkload = {
      id: `workload-${teacherId}`,
      teacherId,
      teacherName: teacher.name || '',
      semester: semester || 'current',
      baseWeeklyHours: weeklyHours,
      expectedHours: weeklyHours * 4,
      selfTaughtHours: weeklyHours * 4,
      leaveHours: 0,
      leaveDetails: [],
      substitutedHours: 0,
      substitutionDetails: [],
      extraHours: 0,
      extraDetails: [],
      totalHours: weeklyHours * 4,
      verified: false,
      details: classes.map((c: Record<string, unknown>) => ({
        classId: c.class_id as string,
        className: (c.classes as { name: string })?.name || '',
        position: c.position as string,
        hours: 0,
      })),
    } as unknown as TeacherWorkload;

    return this.ok(workload);
  }

  /**
   * 获取教师统计
   */
  async getStatistics(): Promise<ServiceResult<{
    total: number;
    byRole: Record<string, number>;
    byDepartment: Record<string, number>;
  }>> {
    const allTeachers = await teacherRepository.findAllTeachers();
    const byRole = await teacherRepository.countByRole();

    // 按部门统计
    const byDepartment: Record<string, number> = {};
    allTeachers.forEach((t: User) => {
      if (t.department) {
        byDepartment[t.department] = (byDepartment[t.department] || 0) + 1;
      }
    });

    return this.ok({
      total: allTeachers.length,
      byRole,
      byDepartment,
    });
  }

  /**
   * 获取可选教师列表（用于排课等场景）
   */
  async getAvailableTeachers(
    options: {
      excludeIds?: string[];
      role?: string;
      subject?: string;
    } = {}
  ): Promise<ServiceResult<User[]>> {
    let teachers = await teacherRepository.findAllTeachers();

    if (options.role) {
      teachers = teachers.filter((t: User) => t.role === options.role);
    }

    if (options.excludeIds?.length) {
      teachers = teachers.filter((t: User) => !options.excludeIds?.includes(t.id));
    }

    return this.ok(teachers);
  }
}

// 导出单例
export const teacherService = new TeacherService();
