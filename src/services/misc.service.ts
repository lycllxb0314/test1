/**
 * 其他模块服务
 * 
 * 处理课后服务、教师考勤、工作量、学校统计、学生荣誉等业务逻辑
 */

import { BaseService, ServiceResult } from './base.service';
import {
  afterSchoolServiceRepository,
  teacherAttendanceRepository,
  workloadRepository,
  schoolStatsRepository,
  studentHonorRepository,
  AfterSchoolServiceRecord,
  TeacherAttendanceRecord,
  WorkloadRecord,
  SchoolStatsRecord,
  StudentHonorRecord,
} from '@/repositories/misc.repository';
import { PaginatedResult } from '@/repositories/base.repository';

// ==================== 课后服务 ====================

export class AfterSchoolServiceService extends BaseService {
  async getList(semester?: string): Promise<ServiceResult<AfterSchoolServiceRecord[]>> {
    try {
      const data = semester 
        ? await afterSchoolServiceRepository.findBySemester(semester)
        : await afterSchoolServiceRepository.findAll();
      return this.ok(data);
    } catch (error) {
      console.error('[AfterSchoolServiceService] getList error:', error);
      return this.fail('获取课后服务列表失败');
    }
  }

  async create(data: Partial<AfterSchoolServiceRecord>): Promise<ServiceResult<AfterSchoolServiceRecord>> {
    try {
      const record = await afterSchoolServiceRepository.create({
        ...data,
        id: data.id || `service-${Date.now()}`,
        enrolled: data.enrolled || 0,
        status: data.status || 'active',
      });
      if (!record) {
        return this.fail('创建课后服务失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[AfterSchoolServiceService] create error:', error);
      return this.fail('创建课后服务失败');
    }
  }

  async update(id: string, data: Partial<AfterSchoolServiceRecord>): Promise<ServiceResult<AfterSchoolServiceRecord>> {
    try {
      const record = await afterSchoolServiceRepository.update(id, data);
      if (!record) {
        return this.fail('更新课后服务失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[AfterSchoolServiceService] update error:', error);
      return this.fail('更新课后服务失败');
    }
  }
}

// ==================== 教师考勤 ====================

export class TeacherAttendanceService extends BaseService {
  async getByDate(date: string): Promise<ServiceResult<TeacherAttendanceRecord[]>> {
    try {
      const data = await teacherAttendanceRepository.findByDate(date);
      return this.ok(data);
    } catch (error) {
      console.error('[TeacherAttendanceService] getByDate error:', error);
      return this.fail('获取教师考勤失败');
    }
  }

  async getByTeacher(teacherId: string, startDate?: string, endDate?: string): Promise<ServiceResult<TeacherAttendanceRecord[]>> {
    try {
      const data = await teacherAttendanceRepository.findByTeacher(teacherId, startDate, endDate);
      return this.ok(data);
    } catch (error) {
      console.error('[TeacherAttendanceService] getByTeacher error:', error);
      return this.fail('获取教师考勤记录失败');
    }
  }

  async checkIn(teacherId: string, teacherName: string, location?: string): Promise<ServiceResult<TeacherAttendanceRecord>> {
    try {
      const record = await teacherAttendanceRepository.checkIn(teacherId, teacherName, location);
      if (!record) {
        return this.fail('签到失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[TeacherAttendanceService] checkIn error:', error);
      return this.fail('签到失败');
    }
  }

  async checkOut(teacherId: string): Promise<ServiceResult<TeacherAttendanceRecord>> {
    try {
      const record = await teacherAttendanceRepository.checkOut(teacherId);
      if (!record) {
        return this.fail('签退失败，今日未签到');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[TeacherAttendanceService] checkOut error:', error);
      return this.fail('签退失败');
    }
  }

  /**
   * 获取每日考勤数据
   */
  async getDailyAttendance(date: string): Promise<ServiceResult<{
    date: string;
    summary: { total: number; normal: number; late: number; absent: number; leave: number };
    records: Array<{
      teacherId: string;
      teacherName: string;
      employeeId: string;
      department: string;
      subject: string;
      status: string;
      leaveType?: string;
      leaveDuration?: number;
      remark?: string;
      recordId?: string;
    }>;
  }>> {
    try {
      const data = await teacherAttendanceRepository.getDailyAttendance(date);
      return this.ok(data);
    } catch (error) {
      console.error('[TeacherAttendanceService] getDailyAttendance error:', error);
      return this.fail('获取每日考勤数据失败');
    }
  }

  /**
   * 获取月度考勤数据
   */
  async getMonthlyAttendance(month: string): Promise<ServiceResult<{
    month: string;
    summary: {
      totalTeachers: number;
      totalDays: number;
      normalDays: number;
      lateDays: number;
      absentDays: number;
      leaveDays: number;
      averageAttendanceRate: number;
    };
    byTeacher: Array<{
      teacherId: string;
      teacherName: string;
      employeeId: string;
      department: string;
      normalDays: number;
      lateDays: number;
      absentDays: number;
      leaveDays: number;
      attendanceRate: number;
      leaveRecords: Array<{ date: string; type: string }>;
    }>;
    byDate: Array<{
      date: string;
      weekday: string;
      normal: number;
      late: number;
      absent: number;
      leave: number;
    }>;
  }>> {
    try {
      const data = await teacherAttendanceRepository.getMonthlyAttendance(month);
      return this.ok(data);
    } catch (error) {
      console.error('[TeacherAttendanceService] getMonthlyAttendance error:', error);
      return this.fail('获取月度考勤数据失败');
    }
  }

  /**
   * 标记考勤状态
   */
  async markStatus(
    teacherId: string,
    teacherName?: string,
    date?: string,
    status?: string,
    remark?: string
  ): Promise<ServiceResult<TeacherAttendanceRecord>> {
    try {
      const record = await teacherAttendanceRepository.markStatus(teacherId, teacherName, date || new Date().toISOString().split('T')[0], status || 'normal', remark);
      if (!record) {
        return this.fail('标记考勤状态失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[TeacherAttendanceService] markStatus error:', error);
      return this.fail('标记考勤状态失败');
    }
  }
}

// ==================== 工作量 ====================

export class WorkloadService extends BaseService {
  async getByTeacher(teacherId: string, semester?: string): Promise<ServiceResult<WorkloadRecord[]>> {
    try {
      const data = await workloadRepository.findByTeacher(teacherId, semester);
      return this.ok(data);
    } catch (error) {
      console.error('[WorkloadService] getByTeacher error:', error);
      return this.fail('获取工作量失败');
    }
  }

  async getBySemester(semester: string): Promise<ServiceResult<WorkloadRecord[]>> {
    try {
      const data = await workloadRepository.findBySemester(semester);
      return this.ok(data);
    } catch (error) {
      console.error('[WorkloadService] getBySemester error:', error);
      return this.fail('获取工作量列表失败');
    }
  }

  async createOrUpdate(data: Partial<WorkloadRecord>): Promise<ServiceResult<WorkloadRecord>> {
    try {
      const record = await workloadRepository.create({
        ...data,
        id: data.id || `workload-${Date.now()}`,
      });
      if (!record) {
        return this.fail('保存工作量失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[WorkloadService] createOrUpdate error:', error);
      return this.fail('保存工作量失败');
    }
  }
}

// ==================== 学校统计 ====================

export class SchoolStatsService extends BaseService {
  async getLatest(): Promise<ServiceResult<SchoolStatsRecord>> {
    try {
      const data = await schoolStatsRepository.getLatest();
      if (!data) {
        return this.fail('暂无统计数据');
      }
      return this.ok(data);
    } catch (error) {
      console.error('[SchoolStatsService] getLatest error:', error);
      return this.fail('获取学校统计失败');
    }
  }

  async getByDateRange(startDate: string, endDate: string): Promise<ServiceResult<SchoolStatsRecord[]>> {
    try {
      const data = await schoolStatsRepository.getByDateRange(startDate, endDate);
      return this.ok(data);
    } catch (error) {
      console.error('[SchoolStatsService] getByDateRange error:', error);
      return this.fail('获取历史统计失败');
    }
  }
}

// ==================== 学生荣誉 ====================

export class StudentHonorService extends BaseService {
  async getList(params: { studentId?: string; classId?: string; honorType?: string; page?: number; pageSize?: number }): Promise<ServiceResult<PaginatedResult<StudentHonorRecord>>> {
    try {
      const data = await studentHonorRepository.findByParams(params);
      return this.ok(data);
    } catch (error) {
      console.error('[StudentHonorService] getList error:', error);
      return this.fail('获取学生荣誉失败');
    }
  }

  async getById(id: string): Promise<ServiceResult<StudentHonorRecord>> {
    try {
      const data = await studentHonorRepository.findById(id);
      if (!data) {
        return this.fail('荣誉记录不存在');
      }
      return this.ok(data);
    } catch (error) {
      console.error('[StudentHonorService] getById error:', error);
      return this.fail('获取荣誉详情失败');
    }
  }

  async create(data: Partial<StudentHonorRecord>): Promise<ServiceResult<StudentHonorRecord>> {
    try {
      const record = await studentHonorRepository.create({
        ...data,
        id: data.id || `honor-${Date.now()}`,
      });
      if (!record) {
        return this.fail('创建荣誉记录失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[StudentHonorService] create error:', error);
      return this.fail('创建荣誉记录失败');
    }
  }

  async update(id: string, data: Partial<StudentHonorRecord>): Promise<ServiceResult<StudentHonorRecord>> {
    try {
      const record = await studentHonorRepository.update(id, data);
      if (!record) {
        return this.fail('更新荣誉记录失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[StudentHonorService] update error:', error);
      return this.fail('更新荣誉记录失败');
    }
  }

  async delete(id: string): Promise<ServiceResult<boolean>> {
    try {
      const success = await studentHonorRepository.delete(id);
      return this.ok(success);
    } catch (error) {
      console.error('[StudentHonorService] delete error:', error);
      return this.fail('删除荣誉记录失败');
    }
  }
}

// 导出单例
export const afterSchoolServiceService = new AfterSchoolServiceService();
export const teacherAttendanceService = new TeacherAttendanceService();
export const workloadService = new WorkloadService();
export const schoolStatsService = new SchoolStatsService();
export const studentHonorService = new StudentHonorService();
