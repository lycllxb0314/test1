/**
 * 学生服务层
 * 
 * 处理学生相关的业务逻辑
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { studentRepository, classRepository } from '@/repositories';
import type { Student, StudentFullProfile, StudentStatus } from '@/types';

/**
 * 创建学生参数
 */
export interface CreateStudentParams {
  name: string;
  studentNumber: string;
  gender?: 'male' | 'female';
  birthDate?: string;
  classId: string;
  grade?: number;
  parentId?: string;
  [key: string]: unknown;
}

/**
 * 更新学生参数
 */
export interface UpdateStudentParams {
  name?: string;
  gender?: 'male' | 'female';
  birthDate?: string;
  classId?: string;
  status?: StudentStatus;
  [key: string]: unknown;
}

/**
 * 学生查询参数
 */
export interface StudentQueryParams {
  classId?: string;
  grade?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 学生服务
 */
export class StudentService extends BaseService {
  /**
   * 获取学生详情
   */
  async getStudent(id: string): Promise<ServiceResult<Student>> {
    const student = await studentRepository.findById(id);
    
    if (!student) {
      return this.fail('学生不存在', 'NOT_FOUND');
    }
    
    return this.ok(student);
  }

  /**
   * 获取学生完整档案
   */
  async getStudentProfile(id: string): Promise<ServiceResult<StudentFullProfile>> {
    // 获取学生基本信息
    const student = await studentRepository.findById(id);
    if (!student) {
      return this.fail('学生不存在', 'NOT_FOUND');
    }

    // 获取关联信息
    const { parents } = await studentRepository.findDetailById(id);

    const profile: StudentFullProfile = {
      ...student,
      parents: parents,
    } as StudentFullProfile;

    return this.ok(profile);
  }

  /**
   * 查询学生列表
   */
  async listStudents(params: StudentQueryParams): Promise<PaginatedServiceResult<Student>> {
    const { page = 1, pageSize = 20, classId, grade, status, search } = params;

    const result = await studentRepository.findWithClass(
      { classId, grade, status },
      { page, pageSize }
    );

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
   * 创建学生
   */
  async createStudent(params: CreateStudentParams): Promise<ServiceResult<Student>> {
    // 检查学号是否重复
    const existing = await studentRepository.findByStudentNumber(params.studentNumber);
    if (existing) {
      return this.fail('学号已存在', 'DUPLICATE_STUDENT_NUMBER');
    }

    // 获取班级信息确定年级
    let grade = params.grade;
    if (!grade && params.classId) {
      const classInfo = await classRepository.findById(params.classId);
      grade = classInfo?.grade;
    }

    const student = await studentRepository.create({
      ...params,
      grade,
      status: '在校' as StudentStatus,
    });

    if (!student) {
      return this.fail('创建学生失败', 'CREATE_FAILED');
    }

    return this.ok(student);
  }

  /**
   * 更新学生信息
   */
  async updateStudent(id: string, params: UpdateStudentParams): Promise<ServiceResult<Student>> {
    // 检查学生是否存在
    const existing = await studentRepository.findById(id);
    if (!existing) {
      return this.fail('学生不存在', 'NOT_FOUND');
    }

    // 如果更换班级，更新年级
    if (params.classId && params.classId !== existing.classId) {
      const classInfo = await classRepository.findById(params.classId);
      if (classInfo) {
        (params as Record<string, unknown>)['grade'] = classInfo.grade;
      }
    }

    const student = await studentRepository.update(id, params as Partial<Student>);
    
    if (!student) {
      return this.fail('更新学生失败', 'UPDATE_FAILED');
    }

    return this.ok(student);
  }

  /**
   * 删除学生
   */
  async deleteStudent(id: string): Promise<ServiceResult<void>> {
    const existing = await studentRepository.findById(id);
    if (!existing) {
      return this.fail('学生不存在', 'NOT_FOUND');
    }

    const success = await studentRepository.delete(id);
    
    if (!success) {
      return this.fail('删除学生失败', 'DELETE_FAILED');
    }

    return this.ok();
  }

  /**
   * 批量删除学生
   */
  async batchDelete(ids: string[]): Promise<ServiceResult<{ success: number; failed: number }>> {
    let success = 0;
    let failed = 0;

    for (const id of ids) {
      const result = await studentRepository.delete(id);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return this.ok({ success, failed });
  }

  /**
   * 转班
   */
  async transferClass(studentId: string, newClassId: string): Promise<ServiceResult<Student>> {
    const student = await studentRepository.findById(studentId);
    if (!student) {
      return this.fail('学生不存在', 'NOT_FOUND');
    }

    const newClass = await classRepository.findById(newClassId);
    if (!newClass) {
      return this.fail('目标班级不存在', 'CLASS_NOT_FOUND');
    }

    const updated = await studentRepository.update(studentId, {
      classId: newClassId,
      grade: newClass.grade,
    } as Partial<Student>);

    if (!updated) {
      return this.fail('转班失败', 'TRANSFER_FAILED');
    }

    // 发送通知
    await this.sendNotification(
      '学生转班通知',
      `学生${student.name}已转入${newClass.name}`,
      [studentId]
    );

    return this.ok(updated);
  }

  /**
   * 获取班级学生列表
   */
  async getStudentsByClass(classId: string): Promise<ServiceResult<Student[]>> {
    const students = await studentRepository.findByClass(classId);
    return this.ok(students);
  }

  /**
   * 获取年级学生统计
   */
  async getGradeStatistics(grade: number): Promise<ServiceResult<{
    total: number;
    male: number;
    female: number;
    classes: { classId: string; className: string; count: number }[];
  }>> {
    const classes = await classRepository.findByGradeWithStudentCount(grade);
    
    let total = 0;
    const classStats: { classId: string; className: string; count: number }[] = [];

    for (const cls of classes) {
      total += cls.student_count;
      classStats.push({
        classId: cls.id,
        className: cls.name,
        count: cls.student_count,
      });
    }

    return this.ok({
      total,
      male: 0,
      female: 0,
      classes: classStats,
    });
  }

  /**
   * 毕业升级
   */
  async promoteGrade(currentGrade: number): Promise<ServiceResult<{ count: number }>> {
    if (currentGrade >= 6) {
      return this.fail('六年级学生不能升级', 'INVALID_GRADE');
    }

    const nextGrade = currentGrade + 1;
    const count = await studentRepository.promoteGrade(
      String(currentGrade),
      String(nextGrade)
    );

    return this.ok({ count });
  }
}

// 导出单例
export const studentService = new StudentService();
