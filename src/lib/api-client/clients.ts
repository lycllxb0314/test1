/**
 * API客户端 - 领域客户端
 * 
 * 为每个业务领域提供专用的API客户端封装
 * 
 * @module api-client/clients
 */

import { apiClient } from './core';
import type { ApiResponse, ListResponse, QueryParams } from './types';

// ============================================
// 类型定义（从现有类型导入或在此定义）
// ============================================

// 基础实体类型
interface BaseEntity {
  id: string;
  created_at?: string;
  updated_at?: string;
}

// 用户相关类型
export interface User extends BaseEntity {
  name: string;
  email: string;
  role: string;
  avatar?: string;
  phone?: string;
  status?: string;
}

// 学生相关类型
export interface Student extends BaseEntity {
  student_no: string;
  name: string;
  gender: string;
  birth_date?: string;
  phone?: string;
  email?: string;
  address?: string;
  class_id?: string;
  class_name?: string;
  status: string;
  enroll_date?: string;
}

// 教师相关类型
export interface Teacher extends BaseEntity {
  teacher_no: string;
  name: string;
  gender: string;
  phone?: string;
  email?: string;
  department?: string;
  title?: string;
  status: string;
  hire_date?: string;
}

// 班级相关类型
export interface Class extends BaseEntity {
  class_no: string;
  name: string;
  grade: string;
  teacher_id?: string;
  teacher_name?: string;
  student_count?: number;
  status: string;
}

// 课程相关类型
export interface Course extends BaseEntity {
  course_no: string;
  name: string;
  credits: number;
  hours: number;
  category?: string;
  description?: string;
  status: string;
}

// 课程安排类型
export interface Schedule extends BaseEntity {
  course_id: string;
  course_name?: string;
  teacher_id: string;
  teacher_name?: string;
  class_id: string;
  class_name?: string;
  classroom?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  semester?: string;
  status: string;
}

// 考勤相关类型
export interface Attendance extends BaseEntity {
  student_id: string;
  student_name?: string;
  schedule_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'leave' | 'early';
  remark?: string;
  recorded_by?: string;
}

// 成绩相关类型
export interface Grade extends BaseEntity {
  student_id: string;
  student_name?: string;
  course_id: string;
  course_name?: string;
  score: number;
  grade_type: string;
  semester: string;
  remark?: string;
  recorded_by?: string;
}

// 请假相关类型
export interface LeaveRequest extends BaseEntity {
  student_id: string;
  student_name?: string;
  type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approver_id?: string;
  approver_name?: string;
  approved_at?: string;
  rejection_reason?: string;
}

// ============================================
// 基础客户端类
// ============================================

/**
 * 基础API客户端
 * 提供通用的CRUD操作
 */
abstract class BaseApiClient<T extends BaseEntity> {
  constructor(protected basePath: string) {}

  /**
   * 获取列表
   */
  async getList(params?: QueryParams): Promise<ApiResponse<ListResponse<T>>> {
    // 将 QueryParams 转换为请求参数
    const requestParams: Record<string, string | number | boolean | undefined> = {
      page: params?.page,
      pageSize: params?.pageSize,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      keyword: params?.keyword,
    };
    return apiClient.get<ListResponse<T>>(this.basePath, requestParams);
  }

  /**
   * 获取详情
   */
  async getById(id: string): Promise<ApiResponse<T>> {
    return apiClient.get<T>(`${this.basePath}/${id}`);
  }

  /**
   * 创建
   */
  async create(data: Partial<T>): Promise<ApiResponse<T>> {
    return apiClient.post<T>(this.basePath, data);
  }

  /**
   * 更新
   */
  async update(id: string, data: Partial<T>): Promise<ApiResponse<T>> {
    return apiClient.put<T>(`${this.basePath}/${id}`, data);
  }

  /**
   * 删除
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }

  /**
   * 批量删除
   */
  async batchDelete(ids: string[]): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`${this.basePath}/batch-delete`, { ids });
  }

  /**
   * 使缓存失效
   */
  invalidateCache(): void {
    apiClient.invalidateCache(this.basePath);
  }
}

// ============================================
// 领域客户端实现
// ============================================

/**
 * 学生API客户端
 */
export class StudentApiClient extends BaseApiClient<Student> {
  constructor() {
    super('/api/students');
  }

  /**
   * 按班级获取学生
   */
  async getByClass(classId: string): Promise<ApiResponse<Student[]>> {
    return apiClient.get<Student[]>(`${this.basePath}/class/${classId}`);
  }

  /**
   * 搜索学生
   */
  async search(keyword: string): Promise<ApiResponse<Student[]>> {
    return apiClient.get<Student[]>(`${this.basePath}/search`, { keyword });
  }

  /**
   * 导入学生
   */
  async importStudents(file: File): Promise<ApiResponse<{ success: number; failed: number }>> {
    const formData = new FormData();
    formData.append('file', file);
    
    // 这里需要特殊处理FormData
    const response = await fetch('/api/students/import', {
      method: 'POST',
      body: formData,
    });
    
    return response.json();
  }
}

/**
 * 教师API客户端
 */
export class TeacherApiClient extends BaseApiClient<Teacher> {
  constructor() {
    super('/api/teachers');
  }

  /**
   * 按部门获取教师
   */
  async getByDepartment(department: string): Promise<ApiResponse<Teacher[]>> {
    return apiClient.get<Teacher[]>(`${this.basePath}/department/${department}`);
  }

  /**
   * 获取教师的课程
   */
  async getCourses(teacherId: string): Promise<ApiResponse<Course[]>> {
    return apiClient.get<Course[]>(`${this.basePath}/${teacherId}/courses`);
  }

  /**
   * 获取教师的工作量统计
   */
  async getWorkload(teacherId: string, semester?: string): Promise<ApiResponse<{
    totalHours: number;
    courses: Array<{ name: string; hours: number }>;
  }>> {
    return apiClient.get(`${this.basePath}/${teacherId}/workload`, { semester });
  }
}

/**
 * 班级API客户端
 */
export class ClassApiClient extends BaseApiClient<Class> {
  constructor() {
    super('/api/classes');
  }

  /**
   * 按年级获取班级
   */
  async getByGrade(grade: string): Promise<ApiResponse<Class[]>> {
    return apiClient.get<Class[]>(`${this.basePath}/grade/${grade}`);
  }

  /**
   * 获取班级学生
   */
  async getStudents(classId: string): Promise<ApiResponse<Student[]>> {
    return apiClient.get<Student[]>(`${this.basePath}/${classId}/students`);
  }
}

/**
 * 课程API客户端
 */
export class CourseApiClient extends BaseApiClient<Course> {
  constructor() {
    super('/api/courses');
  }

  /**
   * 按类别获取课程
   */
  async getByCategory(category: string): Promise<ApiResponse<Course[]>> {
    return apiClient.get<Course[]>(`${this.basePath}/category/${category}`);
  }
}

/**
 * 课程安排API客户端
 */
export class ScheduleApiClient extends BaseApiClient<Schedule> {
  constructor() {
    super('/api/schedules');
  }

  /**
   * 按班级获取课程安排
   */
  async getByClass(classId: string): Promise<ApiResponse<Schedule[]>> {
    return apiClient.get<Schedule[]>(`${this.basePath}/class/${classId}`);
  }

  /**
   * 按教师获取课程安排
   */
  async getByTeacher(teacherId: string): Promise<ApiResponse<Schedule[]>> {
    return apiClient.get<Schedule[]>(`${this.basePath}/teacher/${teacherId}`);
  }

  /**
   * 获取周课表
   */
  async getWeeklySchedule(params: {
    classId?: string;
    teacherId?: string;
    semester?: string;
  }): Promise<ApiResponse<Schedule[]>> {
    return apiClient.get<Schedule[]>(`${this.basePath}/weekly`, params);
  }

  /**
   * 检查时间冲突
   */
  async checkConflict(data: Partial<Schedule>): Promise<ApiResponse<{
    hasConflict: boolean;
    conflicts: Schedule[];
  }>> {
    return apiClient.post(`${this.basePath}/check-conflict`, data);
  }
}

/**
 * 考勤API客户端
 */
export class AttendanceApiClient extends BaseApiClient<Attendance> {
  constructor() {
    super('/api/attendance');
  }

  /**
   * 按日期获取考勤
   */
  async getByDate(date: string, classId?: string): Promise<ApiResponse<Attendance[]>> {
    return apiClient.get<Attendance[]>(`${this.basePath}/date/${date}`, { classId });
  }

  /**
   * 按学生获取考勤记录
   */
  async getByStudent(studentId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<Attendance[]>> {
    return apiClient.get<Attendance[]>(`${this.basePath}/student/${studentId}`, params);
  }

  /**
   * 批量记录考勤
   */
  async batchRecord(data: Array<{
    studentId: string;
    scheduleId: string;
    date: string;
    status: Attendance['status'];
    remark?: string;
  }>): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`${this.basePath}/batch`, { records: data });
  }

  /**
   * 获取考勤统计
   */
  async getStats(params: {
    classId?: string;
    studentId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<{
    total: number;
    present: number;
    absent: number;
    late: number;
    leave: number;
  }>> {
    return apiClient.get(`${this.basePath}/stats`, params);
  }
}

/**
 * 成绩API客户端
 */
export class GradeApiClient extends BaseApiClient<Grade> {
  constructor() {
    super('/api/grades');
  }

  /**
   * 按学生获取成绩
   */
  async getByStudent(studentId: string, semester?: string): Promise<ApiResponse<Grade[]>> {
    return apiClient.get<Grade[]>(`${this.basePath}/student/${studentId}`, { semester });
  }

  /**
   * 按课程获取成绩
   */
  async getByCourse(courseId: string, semester?: string): Promise<ApiResponse<Grade[]>> {
    return apiClient.get<Grade[]>(`${this.basePath}/course/${courseId}`, { semester });
  }

  /**
   * 批量录入成绩
   */
  async batchRecord(data: Array<{
    studentId: string;
    courseId: string;
    score: number;
    gradeType: string;
    semester: string;
    remark?: string;
  }>): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`${this.basePath}/batch`, { records: data });
  }

  /**
   * 获取成绩统计
   */
  async getStats(params: {
    classId?: string;
    courseId?: string;
    semester?: string;
  }): Promise<ApiResponse<{
    average: number;
    highest: number;
    lowest: number;
    distribution: Array<{ range: string; count: number }>;
  }>> {
    return apiClient.get(`${this.basePath}/stats`, params);
  }
}

/**
 * 请假API客户端
 */
export class LeaveRequestApiClient extends BaseApiClient<LeaveRequest> {
  constructor() {
    super('/api/leave-requests');
  }

  /**
   * 获取待审批请假
   */
  async getPending(): Promise<ApiResponse<LeaveRequest[]>> {
    return apiClient.get<LeaveRequest[]>(`${this.basePath}/pending`);
  }

  /**
   * 按学生获取请假记录
   */
  async getByStudent(studentId: string): Promise<ApiResponse<LeaveRequest[]>> {
    return apiClient.get<LeaveRequest[]>(`${this.basePath}/student/${studentId}`);
  }

  /**
   * 审批请假
   */
  async approve(id: string, approved: boolean, reason?: string): Promise<ApiResponse<LeaveRequest>> {
    return apiClient.post<LeaveRequest>(`${this.basePath}/${id}/approve`, {
      approved,
      reason,
    });
  }
}

// ============================================
// 导出单例实例
// ============================================

export const studentApi = new StudentApiClient();
export const teacherApi = new TeacherApiClient();
export const classApi = new ClassApiClient();
export const courseApi = new CourseApiClient();
export const scheduleApi = new ScheduleApiClient();
export const attendanceApi = new AttendanceApiClient();
export const gradeApi = new GradeApiClient();
export const leaveRequestApi = new LeaveRequestApiClient();
