/**
 * 课后服务选课 Service
 * 
 * 业务逻辑层，处理选课核心业务
 * - 防并发超卖：通过 PostgreSQL RPC 函数实现原子操作
 * - 零教师负担：系统自动完成选课/退课，无需教师审批
 */

import { BaseService, ServiceResult } from './base.service';
import {
  afterSchoolCourseRepository,
  afterSchoolEnrollmentRepository,
  AfterSchoolCourseRepository,
  AfterSchoolEnrollmentRepository,
} from '@/repositories/after-school.repository';
import {
  mapCourseRow,
  mapEnrollmentRow,
  CATEGORY_CONFIG,
} from '@/types/after-school';
import type {
  AfterSchoolCourse,
  AfterSchoolCourseRow,
  CourseEnrollment,
  CourseStats,
  CategoryStat,
  CourseCategory,
  DayOfWeek,
} from '@/types/after-school';

export class AfterSchoolEnrollmentService extends BaseService {
  private courseRepo: AfterSchoolCourseRepository;
  private enrollmentRepo: AfterSchoolEnrollmentRepository;

  constructor() {
    super();
    this.courseRepo = afterSchoolCourseRepository;
    this.enrollmentRepo = afterSchoolEnrollmentRepository;
  }

  /**
   * 家长端：获取可选课程列表
   */
  async getAvailableCourses(grade: number): Promise<ServiceResult<AfterSchoolCourse[]>> {
    try {
      const rows = await this.courseRepo.findByGrade(grade);
      const courses = rows.map(mapCourseRow);
      return this.ok(courses);
    } catch (err) {
      console.error('[AfterSchoolEnrollmentService] getAvailableCourses error:', err);
      return this.fail('获取课程列表失败', 'DATABASE_ERROR');
    }
  }

  /**
   * 教师端：获取某教师的课后服务课程
   */
  async getCoursesByTeacher(teacherId: string): Promise<ServiceResult<AfterSchoolCourse[]>> {
    try {
      const rows = await this.courseRepo.findByTeacher(teacherId);
      const courses = rows.map(mapCourseRow);
      return this.ok(courses);
    } catch (err) {
      console.error('[AfterSchoolEnrollmentService] getCoursesByTeacher error:', err);
      return this.fail('获取教师课程失败', 'DATABASE_ERROR');
    }
  }

  /**
   * 教务端：获取所有课程（按学期）
   */
  async getAllCourses(semester: string): Promise<ServiceResult<AfterSchoolCourse[]>> {
    try {
      const rows = await this.courseRepo.findBySemester(semester);
      const courses = rows.map(mapCourseRow);
      return this.ok(courses);
    } catch (err) {
      console.error('[AfterSchoolEnrollmentService] getAllCourses error:', err);
      return this.fail('获取课程列表失败', 'DATABASE_ERROR');
    }
  }

  /**
   * 核心：家长一键选课（防超卖）
   */
  async enrollCourse(params: {
    courseId: string;
    studentId: string;
    studentName: string;
    className: string;
    parentId: string;
  }): Promise<ServiceResult<CourseEnrollment>> {
    try {
      // 调用 RPC 原子选课（防超卖核心）
      const result = await this.enrollmentRepo.enroll(params);

      if (!result.success) {
        return this.fail(result.error || '选课失败', 'ENROLLMENT_FAILED');
      }

      // 获取创建的选课记录
      const enrollment = await this.enrollmentRepo.findById(result.enrollmentId || '');
      if (!enrollment) {
        return this.ok({
          id: result.enrollmentId || '',
          courseId: params.courseId,
          studentId: params.studentId,
          studentName: params.studentName,
          className: params.className,
          parentId: params.parentId,
          status: 'success',
          cancelledAt: null,
          cancelReason: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      return this.ok(mapEnrollmentRow(enrollment));
    } catch (err) {
      console.error('[AfterSchoolEnrollmentService] enrollCourse error:', err);
      return this.fail('选课失败，请稍后重试', 'ENROLLMENT_ERROR');
    }
  }

  /**
   * 家长取消选课
   */
  async cancelEnrollment(params: {
    courseId: string;
    studentId: string;
    cancelReason?: string;
  }): Promise<ServiceResult<void>> {
    try {
      const result = await this.enrollmentRepo.cancel(params);

      if (!result.success) {
        return this.fail(result.error || '取消选课失败', 'CANCEL_FAILED');
      }

      return this.ok();
    } catch (err) {
      console.error('[AfterSchoolEnrollmentService] cancelEnrollment error:', err);
      return this.fail('取消选课失败', 'CANCEL_ERROR');
    }
  }

  /**
   * 获取学生的选课记录
   */
  async getStudentEnrollments(studentId: string): Promise<ServiceResult<CourseEnrollment[]>> {
    try {
      const rows = await this.enrollmentRepo.findByStudent(studentId);
      const enrollments = rows.map(mapEnrollmentRow);
      return this.ok(enrollments);
    } catch (err) {
      console.error('[AfterSchoolEnrollmentService] getStudentEnrollments error:', err);
      return this.fail('获取选课记录失败', 'DATABASE_ERROR');
    }
  }

  /**
   * 家长端：获取所有子女的选课记录
   */
  async getParentEnrollments(parentId: string): Promise<ServiceResult<CourseEnrollment[]>> {
    try {
      const rows = await this.enrollmentRepo.findByParent(parentId);
      const enrollments = rows.map(row => {
        // 处理关联查询的课程信息
        const courseInfo = row.after_school_services as Record<string, unknown> | undefined;
        return {
          ...mapEnrollmentRow(row),
          courseName: courseInfo?.name as string | undefined,
          courseType: courseInfo?.type as string | undefined,
          dayOfWeek: courseInfo?.day_of_week as DayOfWeek | undefined,
          startTime: courseInfo?.start_time as string | undefined,
          endTime: courseInfo?.end_time as string | undefined,
        };
      });
      return this.ok(enrollments);
    } catch (err) {
      console.error('[AfterSchoolEnrollmentService] getParentEnrollments error:', err);
      return this.fail('获取选课记录失败', 'DATABASE_ERROR');
    }
  }

  /**
   * 教师端：获取课程点名名单
   */
  async getCourseRoster(courseId: string): Promise<ServiceResult<CourseEnrollment[]>> {
    try {
      const rows = await this.enrollmentRepo.findRosterByCourse(courseId);
      const roster = rows.map(mapEnrollmentRow);
      return this.ok(roster);
    } catch (err) {
      console.error('[AfterSchoolEnrollmentService] getCourseRoster error:', err);
      return this.fail('获取点名名单失败', 'DATABASE_ERROR');
    }
  }

  /**
   * 教务端：获取统计概览
   */
  async getStats(semester: string): Promise<ServiceResult<CourseStats>> {
    try {
      const stats = await this.courseRepo.getStats(semester);

      // 获取分类统计
      const courses = await this.courseRepo.findBySemester(semester);
      const categoryMap = new Map<CourseCategory, { count: number; enrolled: number; capacity: number }>();

      for (const row of courses) {
        const cat = (row.category || 'interest') as CourseCategory;
        const existing = categoryMap.get(cat) || { count: 0, enrolled: 0, capacity: 0 };
        existing.count++;
        existing.enrolled += row.current_students || 0;
        existing.capacity += row.max_students || 0;
        categoryMap.set(cat, existing);
      }

      const categoryStats: CategoryStat[] = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        label: CATEGORY_CONFIG[category]?.label || category,
        ...data,
      }));

      return this.ok({
        ...stats,
        categoryStats,
      });
    } catch (err) {
      console.error('[AfterSchoolEnrollmentService] getStats error:', err);
      return this.fail('获取统计失败', 'DATABASE_ERROR');
    }
  }

  /**
   * 教师端：获取我的课程
   */
  async getTeacherCourses(teacherId: string, semester?: string): Promise<ServiceResult<AfterSchoolCourse[]>> {
    try {
      const rows = await this.courseRepo.findByTeacher(teacherId, semester);
      const courses = rows.map(mapCourseRow);
      return this.ok(courses);
    } catch (err) {
      console.error('[AfterSchoolEnrollmentService] getTeacherCourses error:', err);
      return this.fail('获取课程失败', 'DATABASE_ERROR');
    }
  }

  /**
   * 获取单个课程详情
   */
  async getCourseById(id: string): Promise<ServiceResult<AfterSchoolCourse>> {
    try {
      const row = await this.courseRepo.findById(id);
      if (!row) {
        return this.fail('课程不存在', 'NOT_FOUND');
      }
      return this.ok(mapCourseRow(row as unknown as AfterSchoolCourseRow));
    } catch (err) {
      console.error('[AfterSchoolEnrollmentService] getCourseById error:', err);
      return this.fail('获取课程详情失败', 'DATABASE_ERROR');
    }
  }

  /**
   * 创建课程
   */
  async createCourse(data: Record<string, unknown>): Promise<ServiceResult<AfterSchoolCourse>> {
    try {
      const row: Record<string, unknown> = {
        id: `as_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        name: data.name,
        type: data.type || '兴趣班',
        category: data.category || 'interest',
        description: data.description || null,
        cover_image: data.coverImage || data.cover_image || null,
        target_grades: data.targetGrades || data.target_grades || [],
        teacher_id: data.teacherId || data.teacher_id,
        teacher_name: data.teacherName || data.teacher_name,
        classroom: data.classroom || null,
        day_of_week: data.dayOfWeek || data.day_of_week || 1,
        start_time: data.startTime || data.start_time || '16:30',
        end_time: data.endTime || data.end_time || '17:30',
        max_students: data.maxStudents || data.max_students || 30,
        current_students: 0,
        fee: data.fee || null,
        status: data.status || 'active',
        semester: data.semester || '2025-2026-2',
        enrollment_start: data.enrollmentStart || data.enrollment_start || null,
        enrollment_end: data.enrollmentEnd || data.enrollment_end || null,
        approval_status: 'approved', // 教务端创建的课程不需要审核
      };

      const result = await this.courseRepo.create(row as unknown as Partial<AfterSchoolCourseRow>);
      if (!result) {
        return this.fail('创建课程失败', 'CREATE_FAILED');
      }
      return this.ok(mapCourseRow(result as unknown as AfterSchoolCourseRow));
    } catch (err) {
      console.error('[AfterSchoolEnrollmentService] createCourse error:', err);
      return this.fail('创建课程失败', 'CREATE_ERROR');
    }
  }

  /**
   * 更新课程
   */
  async updateCourse(id: string, data: Record<string, unknown>): Promise<ServiceResult<AfterSchoolCourse>> {
    try {
      // 驼峰转下划线
      const updateData: Record<string, unknown> = {};
      const fieldMap: Record<string, string> = {
        name: 'name',
        type: 'type',
        category: 'category',
        description: 'description',
        coverImage: 'cover_image',
        cover_image: 'cover_image',
        targetGrades: 'target_grades',
        target_grades: 'target_grades',
        teacherId: 'teacher_id',
        teacher_id: 'teacher_id',
        teacherName: 'teacher_name',
        teacher_name: 'teacher_name',
        classroom: 'classroom',
        dayOfWeek: 'day_of_week',
        day_of_week: 'day_of_week',
        startTime: 'start_time',
        start_time: 'start_time',
        endTime: 'end_time',
        end_time: 'end_time',
        maxStudents: 'max_students',
        max_students: 'max_students',
        fee: 'fee',
        status: 'status',
        enrollmentStart: 'enrollment_start',
        enrollment_start: 'enrollment_start',
        enrollmentEnd: 'enrollment_end',
        enrollment_end: 'enrollment_end',
      };

      for (const [key, value] of Object.entries(data)) {
        if (fieldMap[key]) {
          updateData[fieldMap[key]] = value;
        }
      }
      updateData['updated_at'] = new Date().toISOString();

      const result = await this.courseRepo.update(id, updateData as unknown as Partial<AfterSchoolCourseRow>);
      if (!result) {
        return this.fail('更新课程失败', 'UPDATE_FAILED');
      }
      return this.ok(mapCourseRow(result as unknown as AfterSchoolCourseRow));
    } catch (err) {
      console.error('[AfterSchoolEnrollmentService] updateCourse error:', err);
      return this.fail('更新课程失败', 'UPDATE_ERROR');
    }
  }

  /**
   * 删除课程
   */
  async deleteCourse(id: string): Promise<ServiceResult<void>> {
    try {
      // 先删除关联的选课记录
      await this.enrollmentRepo.deleteByCourse(id);
      await this.courseRepo.delete(id);
      return this.ok();
    } catch (err) {
      console.error('[AfterSchoolEnrollmentService] deleteCourse error:', err);
      return this.fail('删除课程失败', 'DELETE_ERROR');
    }
  }

  /**
   * 按课程查询选课记录（管理端）
   */
  async getEnrollmentsByCourse(courseId: string, status?: string): Promise<ServiceResult<CourseEnrollment[]>> {
    try {
      const rows = await this.enrollmentRepo.findByCourse(courseId, status);
      const enrollments = rows.map(mapEnrollmentRow);
      return this.ok(enrollments);
    } catch (err) {
      console.error('[AfterSchoolEnrollmentService] getEnrollmentsByCourse error:', err);
      return this.fail('获取选课记录失败', 'DATABASE_ERROR');
    }
  }

  /**
   * 按学生查询选课记录（家长端）
   */
  async getEnrollmentsByStudent(studentId: string, status?: string): Promise<ServiceResult<CourseEnrollment[]>> {
    try {
      const rows = await this.enrollmentRepo.findByStudent(studentId, status);
      const enrollments = rows.map(mapEnrollmentRow);
      return this.ok(enrollments);
    } catch (err) {
      console.error('[AfterSchoolEnrollmentService] getEnrollmentsByStudent error:', err);
      return this.fail('获取选课记录失败', 'DATABASE_ERROR');
    }
  }

  /**
   * 教师申请开课（提交审核）
   */
  async applyCourse(data: Record<string, unknown>): Promise<ServiceResult<AfterSchoolCourse>> {
    try {
      const row: Record<string, unknown> = {
        id: `as_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        name: data.name,
        type: data.type || '兴趣班',
        category: data.category || 'interest',
        description: data.description || null,
        cover_image: data.coverImage || data.cover_image || null,
        target_grades: data.targetGrades || data.target_grades || [],
        teacher_id: data.teacherId || data.teacher_id,
        teacher_name: data.teacherName || data.teacher_name,
        classroom: data.classroom || null,
        day_of_week: data.dayOfWeek || data.day_of_week || 1,
        start_time: data.startTime || data.start_time || '16:30',
        end_time: data.endTime || data.end_time || '17:30',
        max_students: data.maxStudents || data.max_students || 30,
        current_students: 0,
        fee: data.fee || null,
        status: 'draft', // 教师申请的课程默认草稿状态
        semester: data.semester || '2025-2026-2',
        enrollment_start: data.enrollmentStart || data.enrollment_start || null,
        enrollment_end: data.enrollmentEnd || data.enrollment_end || null,
        approval_status: 'pending', // 待审核
        applied_by: data.teacherId || data.teacher_id,
      };

      const result = await this.courseRepo.create(row as unknown as Partial<AfterSchoolCourseRow>);
      if (!result) {
        return this.fail('申请课程失败', 'CREATE_FAILED');
      }
      return this.ok(mapCourseRow(result as unknown as AfterSchoolCourseRow));
    } catch (err) {
      console.error('[AfterSchoolEnrollmentService] applyCourse error:', err);
      return this.fail('申请课程失败', 'CREATE_ERROR');
    }
  }

  /**
   * 教务端：获取待审核课程
   */
  async getPendingCourses(semester?: string): Promise<ServiceResult<AfterSchoolCourse[]>> {
    try {
      const rows = await this.courseRepo.findPending(semester);
      const courses = rows.map(mapCourseRow);
      return this.ok(courses);
    } catch (err) {
      console.error('[AfterSchoolEnrollmentService] getPendingCourses error:', err);
      return this.fail('获取待审核课程失败', 'DATABASE_ERROR');
    }
  }

  /**
   * 教务端：审核课程（通过/拒绝）
   */
  async reviewCourse(id: string, params: {
    approvalStatus: 'approved' | 'rejected';
    reviewedBy: string;
    rejectionReason?: string;
  }): Promise<ServiceResult<AfterSchoolCourse>> {
    try {
      const result = await this.courseRepo.updateApprovalStatus(id, {
        approvalStatus: params.approvalStatus,
        reviewedBy: params.reviewedBy,
        rejectionReason: params.rejectionReason,
        status: params.approvalStatus === 'approved' ? 'active' : undefined,
      });

      if (!result) {
        return this.fail('审核操作失败', 'UPDATE_FAILED');
      }
      return this.ok(mapCourseRow(result as unknown as AfterSchoolCourseRow));
    } catch (err) {
      console.error('[AfterSchoolEnrollmentService] reviewCourse error:', err);
      return this.fail('审核操作失败', 'UPDATE_ERROR');
    }
  }
}

// 导出单例
export const afterSchoolEnrollmentService = new AfterSchoolEnrollmentService();
