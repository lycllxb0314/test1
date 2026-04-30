/**
 * 课后服务选课 Repository
 * 
 * 数据访问层，封装 after_school_services 和 after_school_enrollments 的数据库操作
 * 使用 Supabase 客户端 + RPC 函数实现防超卖选课
 */

import { BaseRepository } from './base.repository';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type {
  AfterSchoolCourseRow,
  CourseEnrollmentRow,
} from '@/types/after-school';

// ==================== 课程 Repository ====================

export class AfterSchoolCourseRepository extends BaseRepository<AfterSchoolCourseRow> {
  constructor() {
    super('after_school_services');
  }

  /** 根据年级获取可选课程 */
  async findByGrade(grade: number): Promise<AfterSchoolCourseRow[]> {
    const { data, error } = await this.client
      .from('after_school_services')
      .select('*')
      .eq('status', 'active')
      .contains('target_grades', `[${grade}]`)
      .order('day_of_week', { ascending: true });

    if (error) {
      console.error('[AfterSchoolCourseRepository] findByGrade error:', error.message);
      return [];
    }
    return (data || []) as AfterSchoolCourseRow[];
  }

  /** 根据学期获取所有课程 */
  async findBySemester(semester: string): Promise<AfterSchoolCourseRow[]> {
    const { data, error } = await this.client
      .from('after_school_services')
      .select('*')
      .eq('semester', semester)
      .order('day_of_week', { ascending: true });

    if (error) {
      console.error('[AfterSchoolCourseRepository] findBySemester error:', error.message);
      return [];
    }
    return (data || []) as AfterSchoolCourseRow[];
  }

  /** 根据教师获取课程 */
  async findByTeacher(teacherId: string, semester?: string): Promise<AfterSchoolCourseRow[]> {
    let query = this.client
      .from('after_school_services')
      .select('*')
      .eq('teacher_id', teacherId);

    if (semester) query = query.eq('semester', semester);

    const { data, error } = await query;
    if (error) {
      console.error('[AfterSchoolCourseRepository] findByTeacher error:', error.message);
      return [];
    }
    return (data || []) as AfterSchoolCourseRow[];
  }

  /** 获取课程统计 */
  async getStats(semester: string): Promise<{
    totalCourses: number;
    activeCourses: number;
    totalEnrollments: number;
    totalCapacity: number;
  }> {
    const { data, error } = await this.client
      .from('after_school_services')
      .select('status, max_students, current_students')
      .eq('semester', semester);

    if (error || !data) {
      return { totalCourses: 0, activeCourses: 0, totalEnrollments: 0, totalCapacity: 0 };
    }

    return {
      totalCourses: data.length,
      activeCourses: data.filter((c: Record<string, unknown>) => c.status === 'active').length,
      totalEnrollments: data.reduce((sum: number, c: Record<string, unknown>) => sum + (Number(c.current_students) || 0), 0),
      totalCapacity: data.reduce((sum: number, c: Record<string, unknown>) => sum + (Number(c.max_students) || 0), 0),
    };
  }
}

// ==================== 选课记录 Repository ====================

export class AfterSchoolEnrollmentRepository extends BaseRepository<CourseEnrollmentRow> {
  constructor() {
    super('after_school_enrollments');
  }

  /** 原子选课（RPC，防超卖） */
  async enroll(params: {
    courseId: string;
    studentId: string;
    studentName: string;
    className: string;
    parentId: string;
  }): Promise<{ success: boolean; enrollmentId?: string; error?: string }> {
    const { data, error } = await this.client.rpc('enroll_after_school_course', {
      p_course_id: params.courseId,
      p_student_id: params.studentId,
      p_student_name: params.studentName,
      p_class_name: params.className,
      p_parent_id: params.parentId,
    });

    if (error) {
      console.error('[AfterSchoolEnrollmentRepository] enroll RPC error:', error.message);
      return { success: false, error: '选课请求失败，请重试' };
    }

    return {
      success: data.success,
      enrollmentId: data.enrollment_id,
      error: data.error,
    };
  }

  /** 原子取消选课（RPC） */
  async cancel(params: {
    courseId: string;
    studentId: string;
    cancelReason?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await this.client.rpc('cancel_after_school_enrollment', {
      p_course_id: params.courseId,
      p_student_id: params.studentId,
      p_cancel_reason: params.cancelReason || null,
    });

    if (error) {
      console.error('[AfterSchoolEnrollmentRepository] cancel RPC error:', error.message);
      return { success: false, error: '取消选课请求失败，请重试' };
    }

    return {
      success: data.success,
      error: data.error,
    };
  }

  /** 获取学生的选课记录 */
  async findByStudent(studentId: string, status?: string): Promise<CourseEnrollmentRow[]> {
    let query = this.client
      .from('after_school_enrollments')
      .select('*')
      .eq('student_id', studentId);

    if (status) query = query.eq('status', status);
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error('[AfterSchoolEnrollmentRepository] findByStudent error:', error.message);
      return [];
    }
    return (data || []) as CourseEnrollmentRow[];
  }

  /** 获取家长的选课记录（关联所有子女） */
  async findByParent(parentId: string): Promise<(CourseEnrollmentRow & Record<string, unknown>)[]> {
    const { data, error } = await this.client
      .from('after_school_enrollments')
      .select('*, after_school_services(name, type, day_of_week, start_time, end_time)')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[AfterSchoolEnrollmentRepository] findByParent error:', error.message);
      return [];
    }
    return (data || []) as (CourseEnrollmentRow & Record<string, unknown>)[];
  }

  /** 获取课程的选课名单 */
  async findRosterByCourse(courseId: string): Promise<CourseEnrollmentRow[]> {
    const { data, error } = await this.client
      .from('after_school_enrollments')
      .select('*')
      .eq('course_id', courseId)
      .eq('status', 'success')
      .order('student_name', { ascending: true });

    if (error) {
      console.error('[AfterSchoolEnrollmentRepository] findRosterByCourse error:', error.message);
      return [];
    }
    return (data || []) as CourseEnrollmentRow[];
  }

  /** 检查学生是否已选某课程 */
  async hasEnrolled(studentId: string, courseId: string): Promise<boolean> {
    return this.exists({ student_id: studentId, course_id: courseId, status: 'success' });
  }

  /** 按课程查询选课记录 */
  async findByCourse(courseId: string, status?: string): Promise<CourseEnrollmentRow[]> {
    let query = this.client
      .from('after_school_enrollments')
      .select('*')
      .eq('course_id', courseId);

    if (status) query = query.eq('status', status);
    query = query.order('student_name', { ascending: true });

    const { data, error } = await query;
    if (error) {
      console.error('[AfterSchoolEnrollmentRepository] findByCourse error:', error.message);
      return [];
    }
    return (data || []) as CourseEnrollmentRow[];
  }

  /** 删除课程关联的选课记录 */
  async deleteByCourse(courseId: string): Promise<void> {
    const { error } = await this.client
      .from('after_school_enrollments')
      .delete()
      .eq('course_id', courseId);

    if (error) {
      console.error('[AfterSchoolEnrollmentRepository] deleteByCourse error:', error.message);
    }
  }
}

// ==================== 导出单例 ====================

export const afterSchoolCourseRepository = new AfterSchoolCourseRepository();
export const afterSchoolEnrollmentRepository = new AfterSchoolEnrollmentRepository();
